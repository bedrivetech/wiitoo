package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fusion-platform/email/internal/config"
	"github.com/fusion-platform/email/internal/handler"
	"github.com/fusion-platform/email/internal/repository"
	"github.com/fusion-platform/email/internal/service"
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

	// Initialize repository
	emailRepo := repository.NewEmailRepository(pgPool)

	// Initialize email service (loads providers from DB)
	emailSvc, err := service.NewEmailService(context.Background(), emailRepo)
	if err != nil {
		slog.Error("failed to initialize email service", "error", err)
		os.Exit(1)
	}

	// Initialize supporting services
	providerSvc := service.NewProviderService(emailRepo, emailSvc)
	templateSvc := service.NewTemplateService(emailRepo)

	// Initialize handlers
	emailH := handler.NewEmailHandler(emailSvc)
	providerH := handler.NewProviderHandler(providerSvc)
	templateH := handler.NewTemplateHandler(templateSvc)
	adminH := handler.NewAdminHandler(emailRepo)

	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Heartbeat("/healthz"))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-User-Role"},
	}))

	// Public email endpoints
	r.Route("/api/v1/email", func(r chi.Router) {
		r.Post("/send", emailH.Send)
		r.Post("/send-template", emailH.SendTemplate)
	})

	// Admin endpoints
	r.Route("/api/v1/admin/email", func(r chi.Router) {
		r.Use(adminRoleMiddleware)

		// Providers
		r.Get("/providers", providerH.List)
		r.Post("/providers", providerH.Create)
		r.Get("/providers/{id}", providerH.Get)
		r.Put("/providers/{id}", providerH.Update)
		r.Delete("/providers/{id}", providerH.Delete)
		r.Post("/providers/{id}/test", providerH.Test)

		// Templates
		r.Get("/templates", templateH.List)
		r.Post("/templates", templateH.Create)
		r.Get("/templates/{id}", templateH.Get)
		r.Put("/templates/{id}", templateH.Update)
		r.Delete("/templates/{id}", templateH.Delete)
		r.Post("/templates/{id}/preview", templateH.Preview)

		// Log
		r.Get("/log", adminH.ListLog)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("email service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down email service...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

// adminRoleMiddleware checks that the caller has an admin role.
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