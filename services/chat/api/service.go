package api

import (
	"net/http"

	svcconfig "github.com/bedrivetech/wiitoo/services/chat/internal/config"
	"github.com/bedrivetech/wiitoo/services/chat/internal/handler"
	"github.com/bedrivetech/wiitoo/services/chat/internal/repository"
	"github.com/bedrivetech/wiitoo/services/chat/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	chatSvc := service.NewChatService(cfg.RedisURL, pool, cfg)
	h := handler.NewChatHandler(chatSvc)
	chatRepo := repository.NewChatRepository(pool)
	adminH := handler.NewAdminHandler(chatRepo)

	// Admin routes — protected by inline X-User-Role check
	r.Route("/api/v1/admin", func(r chi.Router) {
		r.Use(adminRoleMiddleware)
		r.Get("/messages", adminH.ListMessages)
		r.Delete("/messages/{id}", adminH.DeleteMessage)
		r.Post("/users/{userId}/chat-ban", adminH.BanUserFromChat)
		r.Post("/streams/{streamId}/purge", adminH.PurgeStreamMessages)
	})

	r.Route("/api/v1/chat", func(r chi.Router) {
		r.Get("/ws/{streamId}", h.WebSocket)
		r.Get("/messages/{streamId}", h.GetHistory)
		r.Post("/messages/{streamId}", h.SendMessage)
		r.Post("/timeout", h.Timeout)
		r.Post("/ban", h.Ban)
		r.Get("/emotes", h.ListEmotes)
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