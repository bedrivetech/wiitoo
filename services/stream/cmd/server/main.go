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
	"github.com/bedrivetech/wiitoo/stream/internal/config"
	"github.com/bedrivetech/wiitoo/stream/internal/handler"
	"github.com/bedrivetech/wiitoo/stream/internal/service"
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

	streamSvc := service.NewStreamService(cfg, pgPool)
	h := handler.NewStreamHandler(streamSvc)
	adminH := handler.NewAdminHandler(streamSvc)

	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Heartbeat("/healthz"))
	r.Use(cors.Handler(cors.Options{AllowedOrigins: []string{"*"}, AllowedMethods: []string{"GET","POST","PATCH","DELETE","OPTIONS"}, AllowedHeaders: []string{"Accept","Authorization","Content-Type"}}))

	// Admin routes — protected by API gateway/mesh. Inline middleware checks X-User-Role header.
	r.Route("/api/v1/admin", func(r chi.Router) {
		r.Use(adminRoleMiddleware)
		r.Get("/streams", adminH.ListStreams)
		r.Get("/streams/{id}", adminH.GetStream)
		r.Post("/streams/{id}/kill", adminH.KillStream)
		r.Post("/users/{userId}/stream-ban", adminH.BanUserFromStreaming)
	})

	r.Route("/api/v1/stream", func(r chi.Router) {
		r.Post("/start", h.StartStream)
		r.Post("/{id}/end", h.EndStream)
		r.Get("/{id}", h.GetStream)
		r.Get("/", h.ListStreams)
		r.Get("/live", h.ListLiveStreams)
		r.Get("/categories", h.ListCategories)
		r.Post("/simulcast", h.UpdateSimulcast)
		r.Get("/simulcast/{streamId}", h.GetSimulcastConfig)
		r.Get("/ingest-servers", h.ListIngestServers)
		r.Get("/analytics/{streamId}", h.GetAnalytics)
		r.Post("/webhook/mediatx", h.MediaMTXWebhook)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("stream service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down stream service...")
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
