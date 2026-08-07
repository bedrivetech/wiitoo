package svcconfig

import "github.com/fusion-platform/pkg/config"

type Config struct {
	Port              string
	DatabaseURL       string
	RedisURL          string
	RTMPListenAddr    string
	MediaMTXAPI       string
	SimulcastEnabled  bool
}

func Load() *Config {
	return &Config{
		Port:             config.FromEnv("PORT", "8085"),
		DatabaseURL:      config.MustEnv("DATABASE_URL"),
		RedisURL:         config.FromEnv("REDIS_URL", "redis://localhost:6379/5"),
		RTMPListenAddr:   config.FromEnv("RTMP_LISTEN", ":1935"),
		MediaMTXAPI:      config.FromEnv("MEDIAMTX_API", "http://localhost:9997"),
		SimulcastEnabled: config.FromEnvBool("SIMULCAST_ENABLED", true),
	}
}
