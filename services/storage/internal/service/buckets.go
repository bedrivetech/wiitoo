package service

import (
	"context"
	"fmt"

	"github.com/bedrivetech/wiitoo/services/storage/internal/model"
	"github.com/bedrivetech/wiitoo/services/storage/internal/repository"
)

// BucketService handles CRUD operations for storage buckets.
type BucketService struct {
	repo *repository.StorageRepository
}

// NewBucketService creates a new BucketService.
func NewBucketService(repo *repository.StorageRepository) *BucketService {
	return &BucketService{repo: repo}
}

// ListBuckets returns all storage buckets.
func (s *BucketService) ListBuckets(ctx context.Context) ([]model.StorageBucket, error) {
	return s.repo.ListBuckets(ctx)
}

// ListBucketsByProvider returns all buckets for a given provider.
func (s *BucketService) ListBucketsByProvider(ctx context.Context, providerID string) ([]model.StorageBucket, error) {
	return s.repo.ListBucketsByProvider(ctx, providerID)
}

// GetBucket returns a single bucket by ID.
func (s *BucketService) GetBucket(ctx context.Context, id string) (*model.StorageBucket, error) {
	return s.repo.GetBucket(ctx, id)
}

// CreateBucket creates a new bucket.
func (s *BucketService) CreateBucket(ctx context.Context, req model.CreateBucketRequest) (*model.StorageBucket, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("bucket name is required")
	}
	if req.DisplayName == "" {
		return nil, fmt.Errorf("display name is required")
	}
	if req.ProviderID == "" {
		return nil, fmt.Errorf("provider is required")
	}

	// Verify provider exists
	provider, err := s.repo.GetProvider(ctx, req.ProviderID)
	if err != nil {
		return nil, fmt.Errorf("get provider: %w", err)
	}
	if provider == nil {
		return nil, fmt.Errorf("provider not found: %s", req.ProviderID)
	}

	return s.repo.CreateBucket(ctx, req)
}

// UpdateBucket updates an existing bucket.
func (s *BucketService) UpdateBucket(ctx context.Context, id string, req model.UpdateBucketRequest) (*model.StorageBucket, error) {
	return s.repo.UpdateBucket(ctx, id, req)
}

// DeleteBucket removes a bucket.
func (s *BucketService) DeleteBucket(ctx context.Context, id string) error {
	return s.repo.DeleteBucket(ctx, id)
}

// SyncBucketUsage syncs the used_size_gb for a bucket.
func (s *BucketService) SyncBucketUsage(ctx context.Context, id string) (*model.StorageBucket, error) {
	bucket, err := s.repo.GetBucket(ctx, id)
	if err != nil {
		return nil, err
	}
	if bucket == nil {
		return nil, fmt.Errorf("bucket not found: %s", id)
	}

	// For now, we use a mock update. In production, this would call the
	// provider API to get actual usage, then update.
	// For simplicity, just return the bucket as-is.
	if err := s.repo.UpdateBucketUsage(ctx, id, bucket.UsedSizeGB); err != nil {
		return nil, err
	}

	return s.repo.GetBucket(ctx, id)
}