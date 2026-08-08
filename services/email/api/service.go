package api

import (
	"context"
	"net/http"

	svcconfig "github.com/bedrivetech/wiitoo/services/email/internal/config"
	"github.com/bedrivetech/wiitoo/services/email/internal/handler"
	"github.com/bedrivetech/wiitoo/services/email/internal/repository"
	"github.com/bedrivetech/wiitoo/services/email/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	_ = svcconfig.Load() // config loaded from env; used implicitly by service constructors

	// Initialize repository
	emailRepo := repository.NewEmailRepository(pool)

	// Initialize email service (loads providers from DB)
	emailSvc, err := service.NewEmailService(context.Background(), emailRepo)
	if err != nil {
		panic("email: failed to initialize email service: " + err.Error())
	}

	// Initialize supporting services
	providerSvc := service.NewProviderService(emailRepo, emailSvc)
	templateSvc := service.NewTemplateService(emailRepo)

	// Initialize handlers
	emailH := handler.NewEmailHandler(emailSvc)
	providerH := handler.NewProviderHandler(providerSvc)
	templateH := handler.NewTemplateHandler(templateSvc)
	adminH := handler.NewAdminHandler(emailRepo)

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