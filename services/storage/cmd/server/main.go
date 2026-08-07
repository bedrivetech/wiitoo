package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fusion-platform/pkg/database"
	"github.com/fusion-platform/pkg/storage"
	svcconfig "github.com/fusion-platform/storage/internal/config"
	"github.com/fusion-platform/storage/internal/handler"
	"github.com/fusion-platform/storage/internal/repository"
	"github.com/fusion-platform/storage/internal/service"
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
	storageRepo := repository.NewStorageRepository(pgPool)

	// Load active providers from database to initialize the storage manager
	dbProviders, err := storageRepo.ListActiveProviders(context.Background())
	if err != nil {
		slog.Warn("failed to load storage providers from DB", "error", err)
		dbProviders = nil
	}

	// Convert DB providers to storage.ProviderConfig
	var providerCfgs []storage.ProviderConfig
	for _, p := range dbProviders {
		pCfg := storage.ProviderConfig{
			ID:            p.ID,
			Name:          p.Name,
			ProviderType:  p.ProviderType,
			AccessKey:     p.AccessKey,
			SecretKey:     p.SecretKey,
			DefaultRegion: p.DefaultRegion,
			IsActive:      p.IsActive,
			Priority:      p.Priority,
			Weight:        p.Weight,
		}
		if p.Endpoint != nil {
			pCfg.Endpoint = *p.Endpoint
		}

		// Load buckets for this provider
		buckets, err := storageRepo.ListBucketsByProvider(context.Background(), p.ID)
		if err != nil {
			slog.Warn("failed to load buckets for provider", "provider", p.Name, "error", err)
		} else {
			for _, b := range buckets {
				pCfg.Buckets = append(pCfg.Buckets, storage.BucketConfig{
					ID:          b.ID,
					Name:        b.Name,
					DisplayName: b.DisplayName,
					Region:      b.Region,
					Usage:       b.Usage,
					MaxSizeGB:   b.MaxSizeGB,
					UsedSizeGB:  b.UsedSizeGB,
					IsActive:    b.IsActive,
				})
			}
		}

		providerCfgs = append(providerCfgs, pCfg)
	}

	// Initialize storage manager
	mgr, err := storage.NewManager(providerCfgs)
	if err != nil {
		slog.Error("failed to initialize storage manager", "error", err)
		os.Exit(1)
	}

	// Initialize services
	providerSvc := service.NewProviderService(storageRepo, mgr)
	bucketSvc := service.NewBucketService(storageRepo)
	routingSvc := service.NewRoutingService(storageRepo)

	// Initialize handlers
	providerH := handler.NewProviderHandler(providerSvc)
	bucketH := handler.NewBucketHandler(bucketSvc)
	routingH := handler.NewRoutingHandler(routingSvc)
	adminH := handler.NewAdminHandler(storageRepo)
	storageH := handler.NewStorageHandler(bucketSvc)

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

	// Public storage endpoints
	r.Route("/api/v1/storage", func(r chi.Router) {
		r.Post("/upload", storageH.Upload)
		r.Get("/download/{bucket}/{key}", storageH.Download)
	})

	// Admin endpoints
	r.Route("/api/v1/admin/storage", func(r chi.Router) {
		r.Use(adminRoleMiddleware)

		// Providers
		r.Get("/providers", providerH.List)
		r.Post("/providers", providerH.Create)
		r.Get("/providers/{id}", providerH.Get)
		r.Put("/providers/{id}", providerH.Update)
		r.Delete("/providers/{id}", providerH.Delete)
		r.Post("/providers/{id}/test", providerH.Test)

		// Buckets
		r.Get("/buckets", bucketH.List)
		r.Post("/buckets", bucketH.Create)
		r.Get("/buckets/{id}", bucketH.Get)
		r.Put("/buckets/{id}", bucketH.Update)
		r.Delete("/buckets/{id}", bucketH.Delete)
		r.Post("/buckets/{id}/sync", bucketH.Sync)

		// Routing
		r.Get("/routing", routingH.List)
		r.Post("/routing", routingH.Create)
		r.Put("/routing/{usage}", routingH.Update)
		r.Delete("/routing/{usage}", routingH.Delete)

		// Health & Stats
		r.Get("/health", adminH.Health)
		r.Get("/stats", adminH.Stats)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("storage service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down storage service...")
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