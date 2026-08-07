package storage

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"sync"
	"time"
)

// Manager manages multiple storage providers and routes uploads.
// It implements ObjectStore by delegating to the provider that owns the target bucket.
type Manager struct {
	providers map[string]*managedProvider // provider ID -> provider
	buckets   map[string]*bucketInfo      // bucket ID -> bucket
	router    *UploadRouter
	mu        sync.RWMutex
}

// managedProvider holds runtime state for a provider.
type managedProvider struct {
	config    ProviderConfig
	store     ObjectStore
	healthy   bool
	lastCheck time.Time
}

// bucketInfo maps a bucket ID to its owning provider.
type bucketInfo struct {
	config     BucketConfig
	providerID string
}

// NewManager creates a new Manager from a list of provider configs.
func NewManager(providers []ProviderConfig) (*Manager, error) {
	m := &Manager{
		providers: make(map[string]*managedProvider),
		buckets:   make(map[string]*bucketInfo),
		router:    NewUploadRouter(nil),
	}

	for _, p := range providers {
		if err := m.addProvider(p); err != nil {
			slog.Warn("failed to initialize provider", "name", p.Name, "error", err)
			continue
		}
	}

	return m, nil
}

// NewManagerWithRouter creates a Manager with pre-configured routing rules.
func NewManagerWithRouter(providers []ProviderConfig, rules []RoutingRule) (*Manager, error) {
	m, err := NewManager(providers)
	if err != nil {
		return nil, err
	}
	m.router = NewUploadRouter(rules)
	return m, nil
}

// AddProvider adds or replaces a provider dynamically.
func (m *Manager) AddProvider(cfg ProviderConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.addProvider(cfg)
}

// addProvider is the internal, lock-free version.
func (m *Manager) addProvider(cfg ProviderConfig) error {
	store, err := newStoreFromConfig(cfg)
	if err != nil {
		return fmt.Errorf("failed to create store for provider %s: %w", cfg.Name, err)
	}

	store.SetProviderName(cfg.Name)

	mp := &managedProvider{
		config:    cfg,
		store:     store,
		healthy:   true,
		lastCheck: time.Now(),
	}

	m.providers[cfg.ID] = mp

	// Register buckets
	for _, b := range cfg.Buckets {
		if b.ID != "" {
			m.buckets[b.ID] = &bucketInfo{
				config:     b,
				providerID: cfg.ID,
			}
		}
	}

	slog.Info("added storage provider", "name", cfg.Name, "type", cfg.ProviderType)
	return nil
}

// NewStoreFromConfig creates the appropriate ObjectStore for a given provider config.
func NewStoreFromConfig(cfg ProviderConfig) (*S3Store, error) {
	return newStoreFromConfig(cfg)
}

// newStoreFromConfig creates the appropriate ObjectStore for a given provider config.
func newStoreFromConfig(cfg ProviderConfig) (*S3Store, error) {
	switch cfg.ProviderType {
	case "wasabi":
		return NewWasabiProvider(cfg)
	case "backblaze":
		return NewBackblazeProvider(cfg)
	case "idrive":
		return NewIDriveProvider(cfg)
	case "r2":
		return NewR2Provider(cfg)
	case "s3":
		s3Cfg := S3Config{
			Endpoint:  cfg.Endpoint,
			Region:    cfg.DefaultRegion,
			AccessKey: cfg.AccessKey,
			SecretKey: cfg.SecretKey,
		}
		if s3Cfg.Region == "" {
			s3Cfg.Region = "us-east-1"
		}
		return NewS3Store(s3Cfg)
	default:
		return nil, fmt.Errorf("unsupported provider type: %s", cfg.ProviderType)
	}
}

// RemoveProvider removes a provider and its buckets.
func (m *Manager) RemoveProvider(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.providers, id)

	// Remove all buckets owned by this provider
	for bid, bi := range m.buckets {
		if bi.providerID == id {
			delete(m.buckets, bid)
		}
	}
}

// GetBucket returns the ObjectStore for a specific bucket.
func (m *Manager) GetBucket(ctx context.Context, bucketID string) (ObjectStore, BucketConfig, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	bi, ok := m.buckets[bucketID]
	if !ok {
		return nil, BucketConfig{}, fmt.Errorf("bucket not found: %s", bucketID)
	}

	mp, ok := m.providers[bi.providerID]
	if !ok {
		return nil, BucketConfig{}, fmt.Errorf("provider not found for bucket: %s", bucketID)
	}

	return mp.store, bi.config, nil
}

// GetProvider returns a provider by ID.
func (m *Manager) GetProvider(id string) (ProviderConfig, ObjectStore, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	mp, ok := m.providers[id]
	if !ok {
		return ProviderConfig{}, nil, false
	}
	return mp.config, mp.store, true
}

// ListProviders returns all provider configs.
func (m *Manager) ListProviders() []ProviderConfig {
	m.mu.RLock()
	defer m.mu.RUnlock()

	confs := make([]ProviderConfig, 0, len(m.providers))
	for _, mp := range m.providers {
		confs = append(confs, mp.config)
	}
	return confs
}

// HealthCheck checks all providers and updates health status.
func (m *Manager) HealthCheck(ctx context.Context) map[string]error {
	m.mu.RLock()
	providers := make(map[string]*managedProvider)
	for id, mp := range m.providers {
		providers[id] = mp
	}
	m.mu.RUnlock()

	results := make(map[string]error)

	for id, mp := range providers {
		err := mp.store.HealthCheck(ctx)
		m.mu.Lock()
		if mp, ok := m.providers[id]; ok {
			mp.healthy = err == nil
			mp.lastCheck = time.Now()
		}
		m.mu.Unlock()

		if err != nil {
			results[id] = err
		}
	}

	return results
}

// ProviderName returns "storage-manager" as the provider name.
func (m *Manager) ProviderName() string {
	return "storage-manager"
}

// HealthCheck on Manager performs health checks on all providers.
func (m *Manager) HealthCheckAll(ctx context.Context) map[string]error {
	return m.HealthCheck(ctx)
}

// ─── ObjectStore implementation (delegating) ──────────────────

func (m *Manager) findProviderForBucket(ctx context.Context, bucket string) (ObjectStore, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// First, try direct bucket ID lookup
	if bi, ok := m.buckets[bucket]; ok {
		if mp, ok := m.providers[bi.providerID]; ok {
			return mp.store, nil
		}
	}

	// Fall back to searching by actual bucket name across all providers
	for _, mp := range m.providers {
		for _, b := range mp.config.Buckets {
			if b.Name == bucket {
				return mp.store, nil
			}
		}
	}

	return nil, fmt.Errorf("no provider found for bucket: %s", bucket)
}

// Upload stores data at the given key in the given bucket.
func (m *Manager) Upload(ctx context.Context, bucket, key string, r io.Reader, opts ...UploadOption) error {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return err
	}
	return store.Upload(ctx, bucket, key, r, opts...)
}

// Download retrieves data for the given key.
func (m *Manager) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return nil, err
	}
	return store.Download(ctx, bucket, key)
}

// Delete removes the object at the given key.
func (m *Manager) Delete(ctx context.Context, bucket, key string) error {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return err
	}
	return store.Delete(ctx, bucket, key)
}

// Exists checks if an object exists at the given key.
func (m *Manager) Exists(ctx context.Context, bucket, key string) (bool, error) {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return false, err
	}
	return store.Exists(ctx, bucket, key)
}

// List returns objects with the given prefix.
func (m *Manager) List(ctx context.Context, bucket, prefix string, opts ...ListOption) ([]ObjectInfo, error) {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return nil, err
	}
	return store.List(ctx, bucket, prefix, opts...)
}

// PresignedURL generates a time-limited URL for direct upload/download.
func (m *Manager) PresignedURL(ctx context.Context, bucket, key string, ttl time.Duration, method string) (string, error) {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return "", err
	}
	return store.PresignedURL(ctx, bucket, key, ttl, method)
}

// Copy copies an object from source to destination within the same store.
func (m *Manager) Copy(ctx context.Context, srcBucket, srcKey, dstBucket, dstKey string) error {
	store, err := m.findProviderForBucket(ctx, srcBucket)
	if err != nil {
		return err
	}
	return store.Copy(ctx, srcBucket, srcKey, dstBucket, dstKey)
}

// MultipartUpload starts a multipart upload and returns an upload ID.
func (m *Manager) MultipartUpload(ctx context.Context, bucket, key string, opts ...UploadOption) (string, error) {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return "", err
	}
	return store.MultipartUpload(ctx, bucket, key, opts...)
}

// MultipartPart uploads a part of a multipart upload.
func (m *Manager) MultipartPart(ctx context.Context, bucket, key, uploadID string, partNum int, r io.Reader) (string, error) {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return "", err
	}
	return store.MultipartPart(ctx, bucket, key, uploadID, partNum, r)
}

// MultipartComplete completes a multipart upload.
func (m *Manager) MultipartComplete(ctx context.Context, bucket, key, uploadID string, parts []MultipartPart) error {
	store, err := m.findProviderForBucket(ctx, bucket)
	if err != nil {
		return err
	}
	return store.MultipartComplete(ctx, bucket, key, uploadID, parts)
}