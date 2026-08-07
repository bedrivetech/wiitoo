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
	TranscodeProvider string
	TranscodeAPIKey   string
}

func Load() *Config {
	return &Config{
		Port:              config.FromEnv("PORT", "8082"),
		DatabaseURL:       config.MustEnv("DATABASE_URL"),
		RedisURL:          config.FromEnv("REDIS_URL", "redis://localhost:6379/2"),
		StorageEndpoint:   config.FromEnv("STORAGE_ENDPOINT", ""),
		StorageRegion:     config.FromEnv("STORAGE_REGION", "auto"),
		StorageAccessKey:  config.FromEnv("STORAGE_ACCESS_KEY", ""),
		StorageSecretKey:  config.FromEnv("STORAGE_SECRET_KEY", ""),
		TranscodeProvider: config.FromEnv("TRANSCODE_PROVIDER", "cloudflare"),
		TranscodeAPIKey:   config.FromEnv("TRANSCODE_API_KEY", ""),
	}
}
