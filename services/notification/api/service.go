package api

import (
	"net/http"

	svcconfig "github.com/bedrivetech/wiitoo/services/notification/internal/config"
	"github.com/bedrivetech/wiitoo/services/notification/internal/handler"
	"github.com/bedrivetech/wiitoo/services/notification/internal/repository"
	"github.com/bedrivetech/wiitoo/services/notification/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	notifSvc := service.NewNotificationService(pool, cfg)
	h := handler.NewNotificationHandler(notifSvc)
	notifRepo := repository.NewNotificationRepository(pool)
	adminH := handler.NewAdminHandler(notifRepo)

	// Admin routes — protected by inline X-User-Role check
	r.Route("/api/v1/admin", func(r chi.Router) {
		r.Use(adminRoleMiddleware)
		r.Get("/templates", adminH.ListTemplates)
		r.Post("/templates", adminH.CreateTemplate)
		r.Get("/templates/{id}", adminH.GetTemplate)
		r.Patch("/templates/{id}", adminH.UpdateTemplate)
		r.Delete("/templates/{id}", adminH.DeleteTemplate)
	})

	r.Route("/api/v1/notifications", func(r chi.Router) {
		r.Get("/{userId}", h.ListNotifications)
		r.Post("/{userId}/read", h.MarkRead)
		r.Post("/{userId}/read-all", h.MarkAllRead)
		r.Get("/{userId}/unread-count", h.UnreadCount)
		r.Post("/send", h.SendNotification)
		r.Post("/preferences", h.UpdatePreferences)
		r.Get("/preferences/{userId}", h.GetPreferences)
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