package api

import (
	"log/slog"
	"time"

	"github.com/bedrivetech/wiitoo/services/auth/internal/config"
	"github.com/bedrivetech/wiitoo/services/auth/internal/handler"
	"github.com/bedrivetech/wiitoo/services/auth/internal/middleware"
	"github.com/bedrivetech/wiitoo/services/auth/internal/repository"
	"github.com/bedrivetech/wiitoo/services/auth/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, admin chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := config.Load()

	// Initialize repositories
	userRepo := repository.NewUserRepository(pool)

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
	registerHandler := handler.NewRegisterHandler(authService, otpService, emailSender, emailBuilder, userRepo)
	usernameCheckHandler := handler.NewUsernameCheckHandler(userRepo)
	creatorHandler := handler.NewCreatorHandler(authService, userRepo)
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

	// API routes — scoped under their own Route group so middleware does not leak
	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Use(rateLimiter.RateLimit)

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

		// Username check (no auth required — used during signup)
		r.Get("/username/check", usernameCheckHandler.CheckUsername)

		// Authenticated endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.Authenticate)
			r.Post("/logout", tokenHandler.Logout)
			r.Get("/me", profileHandler.GetProfile)
			r.Patch("/me", profileHandler.UpdateProfile)
			r.Post("/email/change", profileHandler.EmailChange)
			r.Post("/email/change/confirm", profileHandler.EmailChangeConfirm)

			// Creator conversion (viewer → creator, self-service)
			r.Post("/creator/convert", creatorHandler.Convert)
		})
	})

	// Admin routes (protected by shared JWT auth + admin role middleware)
	// User management
	admin.Get("/users", adminHandler.ListUsers)
	admin.Get("/users/{id}", adminHandler.GetUser)
	admin.Patch("/users/{id}", adminHandler.UpdateUser)
	admin.Delete("/users/{id}", adminHandler.DeleteUser)

	// User profile & extended management
	admin.Get("/users/profile/{id}", adminHandler.GetUserProfile)
	admin.Post("/users/{id}/ban", adminHandler.BanUser)
	admin.Post("/users/{id}/unban", adminHandler.UnbanUser)
	admin.Put("/users/{id}/notes", adminHandler.UpdateUserNotes)
	admin.Put("/users/{id}/role", adminHandler.UpdateUserRole)
	admin.Put("/users/{id}/verify", adminHandler.SetCreatorVerified)

	// Bulk operations
	admin.Post("/users/bulk/status", adminHandler.BulkUpdateStatus)
	admin.Post("/users/bulk/role", adminHandler.BulkAssignRole)

	// Export
	admin.Get("/users/export", adminHandler.ExportUsersCSV)

	// Creator verification
	admin.Get("/creator-verification", adminHandler.ListCreatorVerificationRequests)
	admin.Post("/creator-verification/{id}/approve", adminHandler.ApproveCreatorVerification)
	admin.Post("/creator-verification/{id}/reject", adminHandler.RejectCreatorVerification)

	return func() {}
}