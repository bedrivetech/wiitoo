package api

import (
	svcconfig "github.com/bedrivetech/wiitoo/services/notification/internal/config"
	"github.com/bedrivetech/wiitoo/services/notification/internal/handler"
	"github.com/bedrivetech/wiitoo/services/notification/internal/repository"
	"github.com/bedrivetech/wiitoo/services/notification/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, admin chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	notifSvc := service.NewNotificationService(pool, cfg)
	h := handler.NewNotificationHandler(notifSvc)
	notifRepo := repository.NewNotificationRepository(pool)
	adminH := handler.NewAdminHandler(notifRepo)

	// Admin routes — protected by shared JWT auth + admin role middleware
	admin.Get("/templates", adminH.ListTemplates)
	admin.Post("/templates", adminH.CreateTemplate)
	admin.Get("/templates/{id}", adminH.GetTemplate)
	admin.Patch("/templates/{id}", adminH.UpdateTemplate)
	admin.Delete("/templates/{id}", adminH.DeleteTemplate)

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
