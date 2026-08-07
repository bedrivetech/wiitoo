// Package database provides shared database connection utilities.
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/bedrivetech/wiitoo/pkg/config"
)

// NewPool creates a new PostgreSQL connection pool from config.
func NewPool(ctx context.Context, cfg config.DatabaseConfig) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	poolCfg.MaxConns = int32(cfg.MaxConns)
	poolCfg.MinConns = int32(cfg.MinConns)
	poolCfg.MaxConnLifetime = cfg.MaxConnLifetime
	poolCfg.MaxConnIdleTime = cfg.MaxConnIdleTime


	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify connectivity
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

// NewPoolFromURL creates a new pool directly from a connection URL.
func NewPoolFromURL(ctx context.Context, databaseURL string, maxConns int) (*pgxpool.Pool, error) {
	cfg := config.DatabaseConfig{
		URL:                 databaseURL,
		MaxConns:            maxConns,
		MinConns:            5,
		MaxConnLifetime:     30 * time.Minute,
		MaxConnIdleTime:     5 * time.Minute,

	}
	return NewPool(ctx, cfg)
}