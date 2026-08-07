package svcconfig

import "github.com/bedrivetech/wiitoo/pkg/config"

type Config struct {
	Port             string
	DatabaseURL      string
	RedisURL         string
	PaddleAPIKey     string
	PaddleWebhookKey string
	PaddleEnv        string
	PayPalClientID   string
	PayPalSecret     string
	PayPalEnv        string
	SolanaRPC        string
	SolanaWallet     string
	PayoutThreshold  float64
	PlatformFeePct   float64
}

func Load() *Config {
	return &Config{
		Port:             config.FromEnv("PORT", "8084"),
		DatabaseURL:      config.MustEnv("DATABASE_URL"),
		RedisURL:         config.FromEnv("REDIS_URL", "redis://localhost:6379/4"),
		PaddleAPIKey:     config.FromEnv("PADDLE_API_KEY", ""),
		PaddleWebhookKey: config.FromEnv("PADDLE_WEBHOOK_KEY", ""),
		PaddleEnv:        config.FromEnv("PADDLE_ENV", "sandbox"),
		PayPalClientID:   config.FromEnv("PAYPAL_CLIENT_ID", ""),
		PayPalSecret:     config.FromEnv("PAYPAL_SECRET", ""),
		PayPalEnv:        config.FromEnv("PAYPAL_ENV", "sandbox"),
		SolanaRPC:        config.FromEnv("SOLANA_RPC", "https://api.mainnet-beta.solana.com"),
		SolanaWallet:     config.FromEnv("SOLANA_WALLET", ""),
		PayoutThreshold:  config.FromEnvFloat64("PAYOUT_THRESHOLD", 50.0),
		PlatformFeePct:   config.FromEnvFloat64("PLATFORM_FEE_PCT", 10.0),
	}
}
