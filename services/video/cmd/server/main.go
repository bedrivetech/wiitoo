package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fusion-platform/pkg/config"
	"github.com/fusion-platform/pkg/database"
	"github.com/fusion-platform/pkg/storage"
	"github.com/fusion-platform/pkg/queue"
	"github.com/fusion-platform/video/internal/config"
	"github.com/fusion-platform/video/internal/handler"
	"github.com/fusion-platform/video/internal/repository"
	"github.com/fusion-platform/video/internal/service"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := svcconfig.Load()
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	pgPool, err := database.NewPoolFromURL(context.Background(), cfg.DatabaseURL, 25)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pgPool.Close()

	objStore, err := storage.NewS3Store(storage.S3Config{
		Endpoint:  cfg.StorageEndpoint,
		Region:    cfg.StorageRegion,
		AccessKey: cfg.StorageAccessKey,
		SecretKey: cfg.StorageSecretKey,
	})
	if err != nil {
		slog.Error("failed to create object store", "error", err)
		os.Exit(1)
	}

	taskQueue := service.NewVideoTaskQueue(cfg.RedisURL)
	transcoder := service.NewCloudTranscoder(cfg.TranscodeProvider, cfg.TranscodeAPIKey)
	vidRepo := repository.NewVideoRepository(pgPool)
	vidService := service.NewVideoService(vidRepo, objStore, transcoder, taskQueue, cfg)

	h := handler.NewVideoHandler(vidService)

	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Heartbeat("/healthz"))
	r.Use(cors.Handler(cors.Options{AllowedOrigins: []string{"*"}, AllowedMethods: []string{"GET","POST","PATCH","PUT","DELETE","OPTIONS"}, AllowedHeaders: []string{"Accept","Authorization","Content-Type"}}))

	r.Route("/api/v1/video", func(r chi.Router) {
		r.Post("/upload", h.RequestUpload)
		r.Post("/upload/complete", h.CompleteUpload)
		r.Post("/transcode", h.Transcode)
		r.Get("/{id}", h.GetVideo)
		r.Get("/", h.ListVideos)
		r.Post("/{id}/clip", h.GenerateClip)
		r.Post("/{id}/thumbnail", h.GenerateThumbnail)
		r.Get("/presets", h.ListPresets)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("video service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down video service...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}
