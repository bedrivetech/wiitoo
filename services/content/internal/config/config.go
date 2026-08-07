package svcconfig

import "github.com/fusion-platform/pkg/config"

type Config struct {
	Port             string
	DatabaseURL      string
	RedisURL         string
	StorageEndpoint  string
	StorageRegion    string
	StorageAccessKey string
	StorageSecretKey string
	OllamaURL        string
}

func Load() *Config {
	return &Config{
		Port:             config.FromEnv("PORT", "8086"),
		DatabaseURL:      config.MustEnv("DATABASE_URL"),
		RedisURL:         config.FromEnv("REDIS_URL", "redis://localhost:6379/6"),
		StorageEndpoint:  config.FromEnv("STORAGE_ENDPOINT", ""),
		StorageRegion:    config.FromEnv("STORAGE_REGION", "auto"),
		StorageAccessKey: config.FromEnv("STORAGE_ACCESS_KEY", ""),
		StorageSecretKey: config.FromEnv("STORAGE_SECRET_KEY", ""),
		OllamaURL:        config.FromEnv("OLLAMA_URL", "http://localhost:11434"),
	}
}
