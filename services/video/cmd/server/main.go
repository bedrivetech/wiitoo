package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bedrivetech/wiitoo/pkg/database"
	"github.com/bedrivetech/wiitoo/pkg/storage"
	"github.com/bedrivetech/wiitoo/video/internal/config"
	"github.com/bedrivetech/wiitoo/video/internal/handler"
	"github.com/bedrivetech/wiitoo/video/internal/repository"
	"github.com/bedrivetech/wiitoo/video/internal/service"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := svcconfig.Load()
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	pgPool, err := database.NewPoolFromURL(context.Background(), cfg.DatabaseURL, 25)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pgPool.Close()

	objStore, err := storage.NewS3Store(storage.S3Config{
		Endpoint:  cfg.StorageEndpoint,
		Region:    cfg.StorageRegion,
		AccessKey: cfg.StorageAccessKey,
		SecretKey: cfg.StorageSecretKey,
	})
	if err != nil {
		slog.Error("failed to create object store", "error", err)
		os.Exit(1)
	}

	// Cloud video pipeline — provider-selected via VIDEO_PROVIDER env var.
	// Supported: "cloudflare" (default), "gcore".
	// No self-hosted transcoding. All video processing happens via cloud PaaS API.
	pipeline := service.NewPipelineFromConfig(cfg.VideoProvider, cfg)
	vidRepo := repository.NewVideoRepository(pgPool)
	vidService := service.NewVideoService(vidRepo, objStore, pipeline, cfg)

	h := handler.NewVideoHandler(vidService)
	adminH := handler.NewAdminHandler(vidRepo)

	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Heartbeat("/healthz"))
	r.Use(cors.Handler(cors.Options{AllowedOrigins: []string{"*"}, AllowedMethods: []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"}, AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"}}))

	// Admin routes — protected by API gateway/mesh. Inline middleware checks X-User-Role header.
	r.Route("/api/v1/admin", func(r chi.Router) {
		r.Use(adminRoleMiddleware)
		r.Get("/videos", adminH.ListVideos)
		r.Get("/videos/{id}", adminH.GetVideo)
		r.Patch("/videos/{id}", adminH.UpdateVideo)
		r.Delete("/videos/{id}", adminH.DeleteVideo)
	})

	r.Route("/api/v1/video", func(r chi.Router) {
		r.Post("/upload", h.RequestUpload)
		r.Post("/upload/complete", h.CompleteUpload)
		r.Post("/process", h.StartProcessing)
		r.Post("/{id}/process-callback", h.ProcessCallback)
		r.Get("/{id}", h.GetVideo)
		r.Get("/", h.ListVideos)
		r.Post("/{id}/clip", h.GenerateClip)
		r.Post("/{id}/thumbnail", h.GenerateThumbnail)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("video service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down video service...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

// adminRoleMiddleware checks that the caller has an admin role.
// In production, the API gateway or service mesh injects this header after JWT validation.
func adminRoleMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := r.Header.Get("X-User-Role")
		if role != "admin" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"success":false,"error":{"code":"FORBIDDEN","message":"Access denied"}}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}