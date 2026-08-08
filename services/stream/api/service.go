package api

import (
	svcconfig "github.com/bedrivetech/wiitoo/services/stream/internal/config"
	"github.com/bedrivetech/wiitoo/services/stream/internal/handler"
	"github.com/bedrivetech/wiitoo/services/stream/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, admin chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	streamSvc := service.NewStreamService(cfg, pool)
	h := handler.NewStreamHandler(streamSvc)
	adminH := handler.NewAdminHandler(streamSvc)

	// Admin routes — protected by shared JWT auth + admin role middleware
	admin.Get("/streams", adminH.ListStreams)
	admin.Get("/streams/{id}", adminH.GetStream)
	admin.Post("/streams/{id}/kill", adminH.KillStream)
	admin.Post("/users/{userId}/stream-ban", adminH.BanUserFromStreaming)

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

	return func() {}
}
