package api

import (
	"context"
	"log/slog"

	"github.com/bedrivetech/wiitoo/pkg/storage"
	svcconfig "github.com/bedrivetech/wiitoo/services/storage/internal/config"
	"github.com/bedrivetech/wiitoo/services/storage/internal/handler"
	"github.com/bedrivetech/wiitoo/services/storage/internal/repository"
	"github.com/bedrivetech/wiitoo/services/storage/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, admin chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	_ = svcconfig.Load() // config loaded from env; used implicitly by service constructors

	// Initialize repository
	storageRepo := repository.NewStorageRepository(pool)

	// Load active providers from database to initialize the storage manager
	dbProviders, err := storageRepo.ListActiveProviders(context.Background())
	if err != nil {
		slog.Warn("storage: failed to load storage providers from DB", "error", err)
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
			slog.Warn("storage: failed to load buckets for provider", "provider", p.Name, "error", err)
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
		panic("storage: failed to initialize storage manager: " + err.Error())
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

	// Public storage endpoints
	r.Route("/api/v1/storage", func(r chi.Router) {
		r.Post("/upload", storageH.Upload)
		r.Get("/download/{bucket}/{key}", storageH.Download)
	})

	// Admin endpoints
	admin.Route("/storage", func(r chi.Router) {
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

	return func() {}
}
