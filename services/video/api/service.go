package api

import (
	"log/slog"
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/storage"
	svcconfig "github.com/bedrivetech/wiitoo/services/video/internal/config"
	"github.com/bedrivetech/wiitoo/services/video/internal/handler"
	"github.com/bedrivetech/wiitoo/services/video/internal/repository"
	"github.com/bedrivetech/wiitoo/services/video/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	objStore, err := storage.NewS3Store(storage.S3Config{
		Endpoint:  cfg.StorageEndpoint,
		Region:    cfg.StorageRegion,
		AccessKey: cfg.StorageAccessKey,
		SecretKey: cfg.StorageSecretKey,
	})
	if err != nil {
		slog.Error("video: failed to create object store", "error", err)
		panic("video: failed to create object store: " + err.Error())
	}

	// Cloud video pipeline — provider-selected via VIDEO_PROVIDER env var.
	pipeline := service.NewPipelineFromConfig(cfg.VideoProvider, cfg)
	vidRepo := repository.NewVideoRepository(pool)
	vidService := service.NewVideoService(vidRepo, objStore, pipeline, cfg)

	h := handler.NewVideoHandler(vidService)
	adminH := handler.NewAdminHandler(vidRepo)

	// Admin routes — protected by inline X-User-Role check (API gateway pattern)
	r.Route("/api/v1/admin", func(r chi.Router) {
		r.Use(adminRoleMiddleware)
		r.Get("/videos", adminH.ListVideos)
		r.Get("/videos/{id}", adminH.GetVideo)
		r.Patch("/videos/{id}", adminH.UpdateVideo)
		r.Delete("/videos/{id}", adminH.DeleteVideo)
	})

	r.Route("/api/v1/video", func(r chi.Router) {
		r.Post("/upload", h.RequestUpload)
		r.Post("/upload/complete", h.CompleteUpload)
		r.Post("/process", h.StartProcessing)
		r.Post("/{id}/process-callback", h.ProcessCallback)
		r.Get("/{id}", h.GetVideo)
		r.Get("/", h.ListVideos)
		r.Post("/{id}/clip", h.GenerateClip)
		r.Post("/{id}/thumbnail", h.GenerateThumbnail)
	})

	return func() {}
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