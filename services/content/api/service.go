package api

import (
	"net/http"

	svcconfig "github.com/bedrivetech/wiitoo/services/content/internal/config"
	"github.com/bedrivetech/wiitoo/services/content/internal/handler"
	"github.com/bedrivetech/wiitoo/services/content/internal/repository"
	"github.com/bedrivetech/wiitoo/services/content/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	contentSvc := service.NewContentService(pool, cfg)
	h := handler.NewContentHandler(contentSvc)
	contentRepo := repository.NewContentRepository(pool)
	adminH := handler.NewAdminHandler(contentRepo)

	// Admin routes — protected by inline X-User-Role check
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