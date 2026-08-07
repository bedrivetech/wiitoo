package svcconfig

import "github.com/fusion-platform/pkg/config"

type Config struct {
	Port              string
	DatabaseURL       string
	RedisURL          string
	StorageEndpoint   string
	StorageRegion     string
	StorageAccessKey  string
	StorageSecretKey  string
	StorageBucket     string
	PublicURL         string

	// Video pipeline provider: "gcore" or "cloudflare" (default)
	VideoProvider string

	// Gcore Video Cloud (used when VideoProvider == "gcore")
	GcoreAPIKey string

	// Cloudflare Stream (used when VideoProvider == "cloudflare")
	CloudflareAccountID string
	CloudflareAPIToken  string
}

func Load() *Config {
	return &Config{
		Port:               config.FromEnv("PORT", "8082"),
		DatabaseURL:        config.MustEnv("DATABASE_URL"),
		RedisURL:           config.FromEnv("REDIS_URL", "redis://localhost:6379/2"),
		StorageEndpoint:    config.FromEnv("STORAGE_ENDPOINT", ""),
		StorageRegion:      config.FromEnv("STORAGE_REGION", "auto"),
		StorageAccessKey:   config.FromEnv("STORAGE_ACCESS_KEY", ""),
		StorageSecretKey:   config.FromEnv("STORAGE_SECRET_KEY", ""),
		StorageBucket:      config.FromEnv("STORAGE_BUCKET", "fusion-platform"),
		PublicURL:          config.FromEnv("PUBLIC_URL", "http://localhost:8082"),
		VideoProvider:      config.FromEnv("VIDEO_PROVIDER", "cloudflare"),
		GcoreAPIKey:        config.FromEnv("GCORE_API_KEY", ""),
		CloudflareAccountID: config.FromEnv("CF_ACCOUNT_ID", ""),
		CloudflareAPIToken:  config.FromEnv("CF_API_TOKEN", ""),
	}
}