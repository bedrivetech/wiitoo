// Package config provides shared configuration loading for all services.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// FromEnv loads a string value from an environment variable with a default.
func FromEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// FromEnvInt loads an int value from an environment variable with a default.
func FromEnvInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if n, err := strconv.Atoi(val); err == nil {
			return n
		}
	}
	return defaultVal
}

// FromEnvDuration loads a duration from an environment variable with a default.
func FromEnvDuration(key string, defaultVal time.Duration) time.Duration {
	if val := os.Getenv(key); val != "" {
		if d, err := time.ParseDuration(val); err == nil {
			return d
		}
	}
	return defaultVal
}

// FromEnvBool loads a boolean from an environment variable with a default.
func FromEnvBool(key string, defaultVal bool) bool {
	if val := os.Getenv(key); val != "" {
		switch strings.ToLower(val) {
		case "true", "1", "yes", "on":
			return true
		case "false", "0", "no", "off":
			return false
		}
	}
	return defaultVal
}

// FromEnvInt64 loads a 64-bit int from an environment variable with a default.
func FromEnvInt64(key string, defaultVal int64) int64 {
	if val := os.Getenv(key); val != "" {
		if n, err := strconv.ParseInt(val, 10, 64); err == nil {
			return n
		}
	}
	return defaultVal
}

// FromEnvFloat64 loads a float64 from an environment variable with a default.
func FromEnvFloat64(key string, defaultVal float64) float64 {
	if val := os.Getenv(key); val != "" {
		if f, err := strconv.ParseFloat(val, 64); err == nil {
			return f
		}
	}
	return defaultVal
}

// FromEnvSlice loads a comma-separated list from an environment variable.
func FromEnvSlice(key string, defaultVal []string) []string {
	if val := os.Getenv(key); val != "" {
		parts := strings.Split(val, ",")
		result := make([]string, len(parts))
		for i, p := range parts {
			result[i] = strings.TrimSpace(p)
		}
		return result
	}
	return defaultVal
}

// MustEnv returns the value of an environment variable or panics.
func MustEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		panic(fmt.Sprintf("required environment variable %s is not set", key))
	}
	return val
}

// DatabaseConfig holds database connection settings.
type DatabaseConfig struct {
	URL             string
	MaxConns        int
	MinConns        int
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration
	HealthCheckInterval time.Duration
}

// RedisConfig holds Redis connection settings.
type RedisConfig struct {
	URL    string
	Prefix string
}

// ServerConfig holds HTTP server settings.
type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
	AllowedOrigins string
}

// StorageConfig holds object storage settings.
type StorageConfig struct {
	Endpoint  string
	Region    string
	AccessKey string
	SecretKey string
	Bucket    string
}

// LoadServerConfig loads server configuration from environment.
func LoadServerConfig() ServerConfig {
	return ServerConfig{
		Port:           FromEnv("PORT", "8080"),
		ReadTimeout:    FromEnvDuration("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:   FromEnvDuration("WRITE_TIMEOUT", 30*time.Second),
		IdleTimeout:    FromEnvDuration("IDLE_TIMEOUT", 60*time.Second),
		AllowedOrigins: FromEnv("ALLOWED_ORIGINS", "*"),
	}
}

// LoadDatabaseConfig loads database configuration from environment.
func LoadDatabaseConfig() DatabaseConfig {
	return DatabaseConfig{
		URL:                 MustEnv("DATABASE_URL"),
		MaxConns:            FromEnvInt("DB_MAX_CONNS", 25),
		MinConns:            FromEnvInt("DB_MIN_CONNS", 5),
		MaxConnLifetime:     FromEnvDuration("DB_MAX_CONN_LIFETIME", 30*time.Minute),
		MaxConnIdleTime:     FromEnvDuration("DB_MAX_CONN_IDLE_TIME", 5*time.Minute),
		HealthCheckInterval: FromEnvDuration("DB_HEALTHCHECK_INTERVAL", 30*time.Second),
	}
}

// LoadRedisConfig loads Redis configuration from environment.
func LoadRedisConfig() RedisConfig {
	return RedisConfig{
		URL:    FromEnv("REDIS_URL", "redis://localhost:6379/0"),
		Prefix: FromEnv("REDIS_PREFIX", ""),
	}
}

// LoadStorageConfig loads object storage configuration from environment.
func LoadStorageConfig(prefix string) StorageConfig {
	p := strings.ToUpper(prefix)
	if p != "" && !strings.HasSuffix(p, "_") {
		p = p + "_"
	}
	return StorageConfig{
		Endpoint:  FromEnv(p+"STORAGE_ENDPOINT", ""),
		Region:    FromEnv(p+"STORAGE_REGION", "auto"),
		AccessKey: FromEnv(p+"STORAGE_ACCESS_KEY", ""),
		SecretKey: FromEnv(p+"STORAGE_SECRET_KEY", ""),
		Bucket:    FromEnv(p+"STORAGE_BUCKET", ""),
	}
}