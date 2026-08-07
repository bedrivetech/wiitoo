package svcconfig

import "github.com/fusion-platform/pkg/config"

type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
	RedisPrefix string
}

func Load() *Config {
	return &Config{
		Port:        config.FromEnv("PORT", "8088"),
		DatabaseURL: config.MustEnv("DATABASE_URL"),
		RedisURL:    config.FromEnv("REDIS_URL", "redis://localhost:6379/8"),
		RedisPrefix: config.FromEnv("REDIS_PREFIX", "storage"),
	}
}