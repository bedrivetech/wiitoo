package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Server
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration

	// Database
	DatabaseURL string

	// Redis
	RedisURL    string
	RedisPrefix string

	// JWT
	JWTSecret           string
	AccessTokenTTL      time.Duration
	RefreshTokenTTL     time.Duration
	RefreshTokenSecret  string

	// CORS
	AllowedOrigins string

	// OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	TwitchClientID     string
	TwitchClientSecret string
	TwitchRedirectURL  string

	// OTP
	OTPDefaultTTL time.Duration
	OTPMaxAttempts int
	OTPMaxPerHour  int
	OTPResendCooldown time.Duration

	// Email
	EmailProvider string // "console" or "resend"
	ResendAPIKey  string
	FromEmail     string
	FromName      string

	// App
	BaseURL string
	AppName string
}

func Load() *Config {
	return &Config{
		Port:              getEnv("PORT", "8080"),
		ReadTimeout:       getDuration("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:      getDuration("WRITE_TIMEOUT", 30*time.Second),
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://fusion:fusion@localhost:5432/fusion?sslmode=disable"),
		RedisURL:          getEnv("REDIS_URL", "redis://localhost:6379/0"),
		RedisPrefix:       getEnv("REDIS_PREFIX", "fusion:auth:"),
		JWTSecret:         getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		AccessTokenTTL:    getDuration("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL:   getDuration("REFRESH_TOKEN_TTL", 7*24*time.Hour),
		RefreshTokenSecret: getEnv("REFRESH_TOKEN_SECRET", "dev-refresh-secret-change-in-production"),
		AllowedOrigins:    getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		GoogleClientID:    getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL: getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/google/callback"),
		TwitchClientID:    getEnv("TWITCH_CLIENT_ID", ""),
		TwitchClientSecret: getEnv("TWITCH_CLIENT_SECRET", ""),
		TwitchRedirectURL: getEnv("TWITCH_REDIRECT_URL", "http://localhost:8080/api/v1/auth/twitch/callback"),
		OTPDefaultTTL:     getDuration("OTP_DEFAULT_TTL", 10*time.Minute),
		OTPMaxAttempts:    getInt("OTP_MAX_ATTEMPTS", 3),
		OTPMaxPerHour:     getInt("OTP_MAX_PER_HOUR", 5),
		OTPResendCooldown: getDuration("OTP_RESEND_COOLDOWN", 60*time.Second),
		EmailProvider:     getEnv("EMAIL_PROVIDER", "console"),
		ResendAPIKey:      getEnv("RESEND_API_KEY", ""),
		FromEmail:         getEnv("FROM_EMAIL", "noreply@fusionplatform.com"),
		FromName:          getEnv("FROM_NAME", "Fusion Platform"),
		BaseURL:           getEnv("BASE_URL", "http://localhost:8080"),
		AppName:           getEnv("APP_NAME", "Fusion Platform"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		d, err := time.ParseDuration(v)
		if err == nil {
			return d
		}
	}
	return fallback
}

func getInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		i, err := strconv.Atoi(v)
		if err == nil {
			return i
		}
	}
	return fallback
}