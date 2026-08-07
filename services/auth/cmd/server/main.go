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

	"github.com/bedrivetech/wiitoo/auth/internal/config"
	"github.com/bedrivetech/wiitoo/auth/internal/handler"
	"github.com/bedrivetech/wiitoo/auth/internal/middleware"
	"github.com/bedrivetech/wiitoo/auth/internal/model"
	"github.com/bedrivetech/wiitoo/auth/internal/repository"
	"github.com/bedrivetech/wiitoo/auth/internal/service"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Set up structured logger
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	// Connect to PostgreSQL
	pgPool, err := connectPostgres(cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pgPool.Close()
	slog.Info("connected to PostgreSQL")

	// Connect to Redis
	rdb, err := connectRedis(cfg.RedisURL)
	if err != nil {
		slog.Error("failed to connect to Redis", "error", err)
		os.Exit(1)
	}
	defer rdb.Close()
	slog.Info("connected to Redis")

	// Initialize repositories
	userRepo := repository.NewUserRepository(pgPool)

	// Initialize hasher
	hasher := service.NewHasher()

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg)
	otpService := service.NewOTPServiceWithRedis(rdb, cfg)
	oauthService := service.NewOAuthService(userRepo, authService, cfg)

	// Initialize OAuth providers
	oauthService.InitProviders()

	// Initialize email components
	var emailSender service.EmailSender
	if cfg.EmailProvider == "resend" {
		emailSender = service.NewResendEmailSender(cfg.ResendAPIKey, cfg.FromName, cfg.FromEmail)
		slog.Info("using Resend email provider")
	} else {
		emailSender = service.NewConsoleEmailSender(cfg.FromName, cfg.FromEmail)
		slog.Info("using console email provider (dev mode)")
	}
	emailBuilder := service.NewOTPEmailBuilder(cfg.AppName, cfg.BaseURL)

	// Initialize handlers
	registerHandler := handler.NewRegisterHandler(authService, otpService, emailSender, emailBuilder)
	loginHandler := handler.NewLoginHandler(authService)
	oauthHandler := handler.NewOAuthHandler(oauthService, authService)
	verifyHandler := handler.NewVerifyHandler(authService, otpService, userRepo, emailSender, emailBuilder)
	passwordHandler := handler.NewPasswordHandler(authService, otpService, userRepo, hasher, emailSender, emailBuilder)
	tokenHandler := handler.NewTokenHandler(authService)
	profileHandler := handler.NewProfileHandler(authService, otpService, userRepo, hasher, emailSender, emailBuilder)

	// Admin handler
	adminHandler := handler.NewAdminHandler(userRepo)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)
	rateLimiter := middleware.NewRateLimiter(rdb, cfg.RedisPrefix, 100, 200, time.Minute, time.Minute)

	// Build Chi router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Heartbeat("/healthz"))
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AllowedOrigins},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"},
		AllowCredentials: false,
		MaxAge:           300,
	}))
	r.Use(rateLimiter.RateLimit)

	// API routes
	r.Route("/api/v1/auth", func(r chi.Router) {
		// Public endpoints
		r.Post("/register", registerHandler.Register)
		r.Post("/login", loginHandler.Login)
		r.Post("/verify", verifyHandler.Verify)
		r.Post("/verify/resend", verifyHandler.ResendOTP)
		r.Post("/password/reset", passwordHandler.ResetRequest)
		r.Post("/password/reset/confirm", passwordHandler.ResetConfirm)
		r.Post("/token/refresh", tokenHandler.Refresh)

		// OAuth endpoints
		r.Get("/{provider}/login", oauthHandler.ProviderLogin)
		r.Get("/{provider}/callback", oauthHandler.Callback)

		// Authenticated endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.Authenticate)
			r.Post("/logout", tokenHandler.Logout)
			r.Get("/me", profileHandler.GetProfile)
			r.Patch("/me", profileHandler.UpdateProfile)
			r.Post("/email/change", profileHandler.EmailChange)
			r.Post("/email/change/confirm", profileHandler.EmailChangeConfirm)
		})
	})

	// Admin routes (protected by auth + admin role)
	r.Route("/api/v1/admin", func(r chi.Router) {
		r.Use(authMiddleware.Authenticate)
		r.Use(authMiddleware.RequireRole(model.RoleAdmin))

		// User management
		r.Get("/users", adminHandler.ListUsers)
		r.Get("/users/{id}", adminHandler.GetUser)
		r.Patch("/users/{id}", adminHandler.UpdateUser)
		r.Delete("/users/{id}", adminHandler.DeleteUser)

		// User profile & extended management
		r.Get("/users/profile/{id}", adminHandler.GetUserProfile)
		r.Post("/users/{id}/ban", adminHandler.BanUser)
		r.Post("/users/{id}/unban", adminHandler.UnbanUser)
		r.Put("/users/{id}/notes", adminHandler.UpdateUserNotes)
		r.Put("/users/{id}/role", adminHandler.UpdateUserRole)
		r.Put("/users/{id}/verify", adminHandler.SetCreatorVerified)

		// Bulk operations
		r.Post("/users/bulk/status", adminHandler.BulkUpdateStatus)
		r.Post("/users/bulk/role", adminHandler.BulkAssignRole)

		// Export
		r.Get("/users/export", adminHandler.ExportUsersCSV)

		// Creator verification
		r.Get("/creator-verification", adminHandler.ListCreatorVerificationRequests)
		r.Post("/creator-verification/{id}/approve", adminHandler.ApproveCreatorVerification)
		r.Post("/creator-verification/{id}/reject", adminHandler.RejectCreatorVerification)
	})

	// Create server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		slog.Info("auth service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")
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