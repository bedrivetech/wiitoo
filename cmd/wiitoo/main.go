package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	middlewarepkg "github.com/bedrivetech/wiitoo/pkg/middleware"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/go-chi/chi/v5"

	authapi "github.com/bedrivetech/wiitoo/services/auth/api"
	chatapi "github.com/bedrivetech/wiitoo/services/chat/api"
	contentapi "github.com/bedrivetech/wiitoo/services/content/api"
	emailapi "github.com/bedrivetech/wiitoo/services/email/api"
	notificationapi "github.com/bedrivetech/wiitoo/services/notification/api"
	paymentapi "github.com/bedrivetech/wiitoo/services/payment/api"
	storageapi "github.com/bedrivetech/wiitoo/services/storage/api"
	streamapi "github.com/bedrivetech/wiitoo/services/stream/api"
	videoapi "github.com/bedrivetech/wiitoo/services/video/api"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	databaseURL := envOrDefault("DATABASE_URL", "postgres://wiitoo:wiitoo_change_me@localhost:5432/wiitoo?sslmode=disable")
	redisURL := envOrDefault("REDIS_URL", "redis://localhost:6379/0")
	port := envOrDefault("PORT", "8080")
	allowedOrigins := envOrDefault("ALLOWED_ORIGINS", "*")

	// Connect to PostgreSQL
	pool, err := connectPostgres(databaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("connected to PostgreSQL")

	// Connect to Redis
	rdb, err := connectRedis(redisURL)
	if err != nil {
		slog.Error("failed to connect to Redis", "error", err)
		os.Exit(1)
	}
	defer rdb.Close()
	slog.Info("connected to Redis")

	// Root router with global middleware
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Heartbeat("/healthz"))
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{allowedOrigins},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-User-Role", "X-Webhook-Signature"},
		ExposedHeaders:   []string{"Link", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Create shared admin sub-router with JWT auth + admin role check.
	// Each service registers its admin routes on this router using relative paths.
	adminMW := middlewarepkg.NewAdminMiddleware()
	adminRouter := chi.NewRouter()
	adminRouter.Use(adminMW.Handler)
	r.Mount("/api/v1/admin", adminRouter)

	// Mount all service routes onto the shared router.
	// Each service's Setup function adds its own Route groups and middleware.
	cleanups := []func(){}
	cleanups = append(cleanups, authapi.Setup(r, adminRouter, pool, rdb))
	cleanups = append(cleanups, videoapi.Setup(r, adminRouter, pool, rdb))
	cleanups = append(cleanups, streamapi.Setup(r, adminRouter, pool, rdb))
	cleanups = append(cleanups, chatapi.Setup(r, adminRouter, pool, rdb))
	cleanups = append(cleanups, paymentapi.Setup(r, adminRouter, pool, rdb))
	cleanups = append(cleanups, contentapi.Setup(r, adminRouter, pool, rdb))
	cleanups = append(cleanups, notificationapi.Setup(r, adminRouter, pool, rdb))
	cleanups = append(cleanups, emailapi.Setup(r, adminRouter, pool, rdb))
	cleanups = append(cleanups, storageapi.Setup(r, adminRouter, pool, rdb))

	slog.Info("all services registered", "count", len(cleanups))

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		slog.Info("wiitoo monolith starting", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down wiitoo monolith...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
		os.Exit(1)
	}
	slog.Info("server stopped")
}

func connectPostgres(databaseURL string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

func connectRedis(redisURL string) (*redis.Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	return rdb, nil
}

func envOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}