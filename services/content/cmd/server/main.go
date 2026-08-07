package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fusion-platform/content/internal/config"
	"github.com/fusion-platform/content/internal/handler"
	"github.com/fusion-platform/content/internal/repository"
	"github.com/fusion-platform/content/internal/service"
	"github.com/fusion-platform/pkg/database"
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

	contentSvc := service.NewContentService(pgPool, cfg)
	h := handler.NewContentHandler(contentSvc)
	contentRepo := repository.NewContentRepository(pgPool)
	adminH := handler.NewAdminHandler(contentRepo)

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
		r.Get("/categories", adminH.ListCategories)
		r.Post("/categories", adminH.CreateCategory)
		r.Get("/categories/{id}", adminH.GetCategory)
		r.Patch("/categories/{id}", adminH.UpdateCategory)
		r.Delete("/categories/{id}", adminH.DeleteCategory)
		r.Get("/reports", adminH.ListReports)
		r.Patch("/reports/{id}", adminH.ResolveReport)
		r.Get("/clips", adminH.ListClips)
		r.Delete("/clips/{id}", adminH.DeleteClip)
	})

	r.Route("/api/v1/content", func(r chi.Router) {
		r.Post("/categories", h.CreateCategory)
		r.Get("/categories", h.ListCategories)
		r.Get("/categories/{id}", h.GetCategory)
		r.Post("/categories/{id}/follow", h.FollowCategory)
		r.Get("/search", h.Search)
		r.Post("/report", h.ReportContent)
		r.Get("/trending", h.Trending)
		r.Get("/recommended", h.Recommended)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("content service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down content service...")
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
