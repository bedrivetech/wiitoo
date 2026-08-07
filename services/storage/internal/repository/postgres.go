package repository

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/fusion-platform/storage/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// StorageRepository handles database operations for storage providers, buckets, and routing.
type StorageRepository struct {
	pool *pgxpool.Pool
}

// NewStorageRepository creates a new StorageRepository.
func NewStorageRepository(pool *pgxpool.Pool) *StorageRepository {
	return &StorageRepository{pool: pool}
}

// ─── Providers ────────────────────────────────────────────────

// ListProviders returns all storage providers.
func (r *StorageRepository) ListProviders(ctx context.Context) ([]model.StorageProvider, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, provider_type, access_key, secret_key, default_region,
		       endpoint, is_active, priority, weight, is_healthy, last_health_check,
		       total_size_gb, created_at, updated_at
		FROM storage_providers
		ORDER BY priority ASC, name ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list providers: %w", err)
	}
	defer rows.Close()

	var providers []model.StorageProvider
	for rows.Next() {
		p, err := scanProvider(rows)
		if err != nil {
			return nil, err
		}
		providers = append(providers, p)
	}
	return providers, nil
}

// ListActiveProviders returns all active storage providers.
func (r *StorageRepository) ListActiveProviders(ctx context.Context) ([]model.StorageProvider, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, provider_type, access_key, secret_key, default_region,
		       endpoint, is_active, priority, weight, is_healthy, last_health_check,
		       total_size_gb, created_at, updated_at
		FROM storage_providers
		WHERE is_active = true
		ORDER BY priority ASC, name ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list active providers: %w", err)
	}
	defer rows.Close()

	var providers []model.StorageProvider
	for rows.Next() {
		p, err := scanProvider(rows)
		if err != nil {
			return nil, err
		}
		providers = append(providers, p)
	}
	return providers, nil
}

// GetProvider returns a single provider by ID.
func (r *StorageRepository) GetProvider(ctx context.Context, id string) (*model.StorageProvider, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, name, provider_type, access_key, secret_key, default_region,
		       endpoint, is_active, priority, weight, is_healthy, last_health_check,
		       total_size_gb, created_at, updated_at
		FROM storage_providers WHERE id = $1
	`, id)

	p, err := scanSingleProvider(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get provider: %w", err)
	}
	return p, nil
}

// CreateProvider inserts a new storage provider.
func (r *StorageRepository) CreateProvider(ctx context.Context, req model.CreateStorageProviderRequest) (*model.StorageProvider, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO storage_providers (name, provider_type, access_key, secret_key, default_region, endpoint, priority, weight)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, name, provider_type, access_key, secret_key, default_region,
		          endpoint, is_active, priority, weight, is_healthy, last_health_check,
		          total_size_gb, created_at, updated_at
	`, req.Name, req.ProviderType, req.AccessKey, req.SecretKey, req.DefaultRegion,
		nullIfEmpty(req.Endpoint), req.Priority, req.Weight)

	p, err := scanSingleProvider(row)
	if err != nil {
		return nil, fmt.Errorf("create provider: %w", err)
	}
	return p, nil
}

// UpdateProvider updates an existing storage provider.
func (r *StorageRepository) UpdateProvider(ctx context.Context, id string, req model.UpdateStorageProviderRequest) (*model.StorageProvider, error) {
	existing, err := r.GetProvider(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}

	var sets []string
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		sets = append(sets, "name = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.ProviderType != nil {
		sets = append(sets, "provider_type = $"+strconv.Itoa(argIdx))
		args = append(args, *req.ProviderType)
		argIdx++
	}
	if req.AccessKey != nil {
		sets = append(sets, "access_key = $"+strconv.Itoa(argIdx))
		args = append(args, *req.AccessKey)
		argIdx++
	}
	if req.SecretKey != nil {
		sets = append(sets, "secret_key = $"+strconv.Itoa(argIdx))
		args = append(args, *req.SecretKey)
		argIdx++
	}
	if req.DefaultRegion != nil {
		sets = append(sets, "default_region = $"+strconv.Itoa(argIdx))
		args = append(args, *req.DefaultRegion)
		argIdx++
	}
	if req.Endpoint != nil {
		sets = append(sets, "endpoint = $"+strconv.Itoa(argIdx))
		args = append(args, nullIfEmpty(*req.Endpoint))
		argIdx++
	}
	if req.IsActive != nil {
		sets = append(sets, "is_active = $"+strconv.Itoa(argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}
	if req.Priority != nil {
		sets = append(sets, "priority = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Priority)
		argIdx++
	}
	if req.Weight != nil {
		sets = append(sets, "weight = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Weight)
		argIdx++
	}

	sets = append(sets, "updated_at = NOW()")

	if len(args) == 0 {
		return existing, nil
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE storage_providers SET %s
		WHERE id = $%d
		RETURNING id, name, provider_type, access_key, secret_key, default_region,
		          endpoint, is_active, priority, weight, is_healthy, last_health_check,
		          total_size_gb, created_at, updated_at
	`, strings.Join(sets, ", "), argIdx)

	row := r.pool.QueryRow(ctx, query, args...)
	p, err := scanSingleProvider(row)
	if err != nil {
		return nil, fmt.Errorf("update provider: %w", err)
	}
	return p, nil
}

// DeleteProvider deletes a storage provider by ID.
func (r *StorageRepository) DeleteProvider(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM storage_providers WHERE id = $1`, id)
	return err
}

// UpdateProviderHealth updates the health check status of a provider.
func (r *StorageRepository) UpdateProviderHealth(ctx context.Context, id string, isHealthy bool) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE storage_providers SET is_healthy = $1, last_health_check = NOW(), updated_at = NOW()
		WHERE id = $2
	`, isHealthy, id)
	return err
}

// ProviderSetTotalSize updates the total size for a provider aggregated from its buckets.
func (r *StorageRepository) ProviderSetTotalSize(ctx context.Context, id string, sizeGB int64) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE storage_providers SET total_size_gb = $1, updated_at = NOW()
		WHERE id = $2
	`, sizeGB, id)
	return err
}

// ─── Buckets ──────────────────────────────────────────────────

// ListBuckets returns all storage buckets.
func (r *StorageRepository) ListBuckets(ctx context.Context) ([]model.StorageBucket, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, provider_id, name, display_name, region, usage,
		       max_size_gb, used_size_gb, is_active, created_at, updated_at
		FROM storage_buckets
		ORDER BY display_name ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list buckets: %w", err)
	}
	defer rows.Close()

	var buckets []model.StorageBucket
	for rows.Next() {
		b, err := scanBucket(rows)
		if err != nil {
			return nil, err
		}
		buckets = append(buckets, b)
	}
	return buckets, nil
}

// ListBucketsByProvider returns all buckets for a given provider.
func (r *StorageRepository) ListBucketsByProvider(ctx context.Context, providerID string) ([]model.StorageBucket, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, provider_id, name, display_name, region, usage,
		       max_size_gb, used_size_gb, is_active, created_at, updated_at
		FROM storage_buckets WHERE provider_id = $1
		ORDER BY display_name ASC
	`, providerID)
	if err != nil {
		return nil, fmt.Errorf("list buckets by provider: %w", err)
	}
	defer rows.Close()

	var buckets []model.StorageBucket
	for rows.Next() {
		b, err := scanBucket(rows)
		if err != nil {
			return nil, err
		}
		buckets = append(buckets, b)
	}
	return buckets, nil
}

// GetBucket returns a single bucket by ID.
func (r *StorageRepository) GetBucket(ctx context.Context, id string) (*model.StorageBucket, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, provider_id, name, display_name, region, usage,
		       max_size_gb, used_size_gb, is_active, created_at, updated_at
		FROM storage_buckets WHERE id = $1
	`, id)

	b, err := scanSingleBucket(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get bucket: %w", err)
	}
	return b, nil
}

// CreateBucket inserts a new storage bucket.
func (r *StorageRepository) CreateBucket(ctx context.Context, req model.CreateBucketRequest) (*model.StorageBucket, error) {
	if req.Region == "" {
		req.Region = "us-east-1"
	}
	if req.Usage == "" {
		req.Usage = "general"
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO storage_buckets (provider_id, name, display_name, region, usage, max_size_gb, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, provider_id, name, display_name, region, usage,
		          max_size_gb, used_size_gb, is_active, created_at, updated_at
	`, req.ProviderID, req.Name, req.DisplayName, req.Region, req.Usage, req.MaxSizeGB, req.IsActive)

	b, err := scanSingleBucket(row)
	if err != nil {
		return nil, fmt.Errorf("create bucket: %w", err)
	}
	return b, nil
}

// UpdateBucket updates an existing storage bucket.
func (r *StorageRepository) UpdateBucket(ctx context.Context, id string, req model.UpdateBucketRequest) (*model.StorageBucket, error) {
	existing, err := r.GetBucket(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}

	var sets []string
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		sets = append(sets, "name = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.DisplayName != nil {
		sets = append(sets, "display_name = $"+strconv.Itoa(argIdx))
		args = append(args, *req.DisplayName)
		argIdx++
	}
	if req.Region != nil {
		sets = append(sets, "region = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Region)
		argIdx++
	}
	if req.Usage != nil {
		sets = append(sets, "usage = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Usage)
		argIdx++
	}
	if req.MaxSizeGB != nil {
		sets = append(sets, "max_size_gb = $"+strconv.Itoa(argIdx))
		args = append(args, *req.MaxSizeGB)
		argIdx++
	}
	if req.IsActive != nil {
		sets = append(sets, "is_active = $"+strconv.Itoa(argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}

	sets = append(sets, "updated_at = NOW()")

	if len(args) == 0 {
		return existing, nil
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE storage_buckets SET %s
		WHERE id = $%d
		RETURNING id, provider_id, name, display_name, region, usage,
		          max_size_gb, used_size_gb, is_active, created_at, updated_at
	`, strings.Join(sets, ", "), argIdx)

	row := r.pool.QueryRow(ctx, query, args...)
	b, err := scanSingleBucket(row)
	if err != nil {
		return nil, fmt.Errorf("update bucket: %w", err)
	}
	return b, nil
}

// DeleteBucket deletes a storage bucket by ID.
func (r *StorageRepository) DeleteBucket(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM storage_buckets WHERE id = $1`, id)
	return err
}

// UpdateBucketUsage updates the used_size_gb for a bucket.
func (r *StorageRepository) UpdateBucketUsage(ctx context.Context, id string, usedSizeGB int64) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE storage_buckets SET used_size_gb = $1, updated_at = NOW()
		WHERE id = $2
	`, usedSizeGB, id)
	return err
}

// ─── Routing Rules ────────────────────────────────────────────

// ListRoutingRules returns all routing rules.
func (r *StorageRepository) ListRoutingRules(ctx context.Context) ([]model.RoutingRule, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, usage_type, strategy, bucket_ids, geo_hints, is_active, created_at, updated_at
		FROM storage_routing_rules
		ORDER BY usage_type ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list routing rules: %w", err)
	}
	defer rows.Close()

	var rules []model.RoutingRule
	for rows.Next() {
		rule, err := scanRoutingRule(rows)
		if err != nil {
			return nil, err
		}
		rules = append(rules, rule)
	}
	return rules, nil
}

// GetRoutingRule returns a routing rule by usage type.
func (r *StorageRepository) GetRoutingRule(ctx context.Context, usage string) (*model.RoutingRule, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, usage_type, strategy, bucket_ids, geo_hints, is_active, created_at, updated_at
		FROM storage_routing_rules WHERE usage_type = $1
	`, usage)

	rule, err := scanSingleRoutingRule(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get routing rule: %w", err)
	}
	return rule, nil
}

// CreateRoutingRule inserts a new routing rule.
func (r *StorageRepository) CreateRoutingRule(ctx context.Context, req model.CreateRoutingRuleRequest) (*model.RoutingRule, error) {
	if req.Strategy == "" {
		req.Strategy = "round_robin"
	}
	if req.BucketIDs == nil {
		req.BucketIDs = []string{}
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO storage_routing_rules (usage_type, strategy, bucket_ids, geo_hints)
		VALUES ($1, $2, $3, $4)
		RETURNING id, usage_type, strategy, bucket_ids, geo_hints, is_active, created_at, updated_at
	`, req.Usage, req.Strategy, req.BucketIDs, req.GeoHints)

	rule, err := scanSingleRoutingRule(row)
	if err != nil {
		return nil, fmt.Errorf("create routing rule: %w", err)
	}
	return rule, nil
}

// UpdateRoutingRule updates a routing rule for a given usage type.
func (r *StorageRepository) UpdateRoutingRule(ctx context.Context, usage string, req model.UpdateRoutingRuleRequest) (*model.RoutingRule, error) {
	existing, err := r.GetRoutingRule(ctx, usage)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}

	var sets []string
	args := []any{}
	argIdx := 1

	if req.Strategy != nil {
		sets = append(sets, "strategy = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Strategy)
		argIdx++
	}
	if req.BucketIDs != nil {
		sets = append(sets, "bucket_ids = $"+strconv.Itoa(argIdx))
		args = append(args, *req.BucketIDs)
		argIdx++
	}
	if req.GeoHints != nil {
		sets = append(sets, "geo_hints = $"+strconv.Itoa(argIdx))
		args = append(args, *req.GeoHints)
		argIdx++
	}
	if req.IsActive != nil {
		sets = append(sets, "is_active = $"+strconv.Itoa(argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}

	sets = append(sets, "updated_at = NOW()")

	if len(args) == 0 {
		return existing, nil
	}

	args = append(args, usage)
	query := fmt.Sprintf(`
		UPDATE storage_routing_rules SET %s
		WHERE usage_type = $%d
		RETURNING id, usage_type, strategy, bucket_ids, geo_hints, is_active, created_at, updated_at
	`, strings.Join(sets, ", "), argIdx)

	row := r.pool.QueryRow(ctx, query, args...)
	rule, err := scanSingleRoutingRule(row)
	if err != nil {
		return nil, fmt.Errorf("update routing rule: %w", err)
	}
	return rule, nil
}

// DeleteRoutingRule deletes a routing rule by usage type.
func (r *StorageRepository) DeleteRoutingRule(ctx context.Context, usage string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM storage_routing_rules WHERE usage_type = $1`, usage)
	return err
}

// ─── Stats ────────────────────────────────────────────────────

// GetStorageStats returns aggregate storage statistics.
func (r *StorageRepository) GetStorageStats(ctx context.Context) (*model.StorageStats, error) {
	stats := &model.StorageStats{}

	row := r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*)::int AS total_providers,
			COUNT(*) FILTER (WHERE is_active)::int AS active_providers,
			COUNT(*) FILTER (WHERE is_healthy)::int AS healthy_count,
			COUNT(*) FILTER (WHERE NOT is_healthy)::int AS unhealthy_count,
			COALESCE(SUM(total_size_gb), 0) AS total_size_gb
		FROM storage_providers
	`)
	if err := row.Scan(&stats.TotalProviders, &stats.ActiveProviders, &stats.HealthyCount,
		&stats.UnhealthyCount, &stats.TotalSizeGB); err != nil {
		return nil, fmt.Errorf("get provider stats: %w", err)
	}

	row2 := r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*)::int AS total_buckets,
			COALESCE(SUM(max_size_gb), 0) AS max_size_gb
		FROM storage_buckets
	`)
	if err := row2.Scan(&stats.TotalBuckets, &stats.MaxSizeGB); err != nil {
		return nil, fmt.Errorf("get bucket stats: %w", err)
	}

	return stats, nil
}

// ─── Scan helpers ─────────────────────────────────────────────

type providerRow interface {
	Scan(dest ...any) error
}

func scanProvider(row providerRow) (model.StorageProvider, error) {
	var p model.StorageProvider
	var endpoint *string
	var lastHealthCheck *time.Time

	err := row.Scan(&p.ID, &p.Name, &p.ProviderType, &p.AccessKey, &p.SecretKey,
		&p.DefaultRegion, &endpoint, &p.IsActive, &p.Priority, &p.Weight,
		&p.IsHealthy, &lastHealthCheck, &p.TotalSizeGB, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return p, fmt.Errorf("scan provider: %w", err)
	}

	p.Endpoint = endpoint
	p.LastHealthCheck = lastHealthCheck
	return p, nil
}

func scanSingleProvider(row pgx.Row) (*model.StorageProvider, error) {
	p, err := scanProvider(row)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

type bucketRow interface {
	Scan(dest ...any) error
}

func scanBucket(row bucketRow) (model.StorageBucket, error) {
	var b model.StorageBucket
	err := row.Scan(&b.ID, &b.ProviderID, &b.Name, &b.DisplayName, &b.Region,
		&b.Usage, &b.MaxSizeGB, &b.UsedSizeGB, &b.IsActive, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return b, fmt.Errorf("scan bucket: %w", err)
	}
	return b, nil
}

func scanSingleBucket(row pgx.Row) (*model.StorageBucket, error) {
	b, err := scanBucket(row)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

type routingRuleRow interface {
	Scan(dest ...any) error
}

func scanRoutingRule(row routingRuleRow) (model.RoutingRule, error) {
	var r model.RoutingRule
	var geoHints map[string]string

	err := row.Scan(&r.ID, &r.Usage, &r.Strategy, &r.BucketIDs, &geoHints,
		&r.IsActive, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		return r, fmt.Errorf("scan routing rule: %w", err)
	}

	r.GeoHints = geoHints
	return r, nil
}

func scanSingleRoutingRule(row pgx.Row) (*model.RoutingRule, error) {
	r, err := scanRoutingRule(row)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func nullIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}