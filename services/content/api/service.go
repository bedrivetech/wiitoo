package api

import (
	svcconfig "github.com/bedrivetech/wiitoo/services/content/internal/config"
	"github.com/bedrivetech/wiitoo/services/content/internal/handler"
	"github.com/bedrivetech/wiitoo/services/content/internal/repository"
	"github.com/bedrivetech/wiitoo/services/content/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, admin chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	contentSvc := service.NewContentService(pool, cfg)
	h := handler.NewContentHandler(contentSvc)
	contentRepo := repository.NewContentRepository(pool)
	adminH := handler.NewAdminHandler(contentRepo)

	// Admin routes — protected by shared JWT auth + admin role middleware
	admin.Get("/categories", adminH.ListCategories)
	admin.Post("/categories", adminH.CreateCategory)
	admin.Get("/categories/{id}", adminH.GetCategory)
	admin.Patch("/categories/{id}", adminH.UpdateCategory)
	admin.Delete("/categories/{id}", adminH.DeleteCategory)
	admin.Get("/reports", adminH.ListReports)
	admin.Patch("/reports/{id}", adminH.ResolveReport)
	admin.Get("/clips", adminH.ListClips)
	admin.Delete("/clips/{id}", adminH.DeleteClip)

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

	return func() {}
}
