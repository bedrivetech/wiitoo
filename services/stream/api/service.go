package api

import (
	"net/http"

	svcconfig "github.com/bedrivetech/wiitoo/services/stream/internal/config"
	"github.com/bedrivetech/wiitoo/services/stream/internal/handler"
	"github.com/bedrivetech/wiitoo/services/stream/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	streamSvc := service.NewStreamService(cfg, pool)
	h := handler.NewStreamHandler(streamSvc)
	adminH := handler.NewAdminHandler(streamSvc)

	// Admin routes — protected by inline X-User-Role check
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

	return func() {}
}

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