package model

import "time"

// StorageBucket represents a storage bucket within a provider.
type StorageBucket struct {
	ID          string            `json:"id"`
	ProviderID  string            `json:"providerId"`
	Name        string            `json:"name"`
	DisplayName string            `json:"displayName"`
	Region      string            `json:"region"`
	Usage       string            `json:"usage"`
	MaxSizeGB   int64             `json:"maxSizeGB"`
	UsedSizeGB  int64             `json:"usedSizeGB"`
	IsActive    bool              `json:"isActive"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// CreateBucketRequest is the request body for adding a new bucket.
type CreateBucketRequest struct {
	ProviderID  string            `json:"providerId"`
	Name        string            `json:"name"`
	DisplayName string            `json:"displayName"`
	Region      string            `json:"region"`
	Usage       string            `json:"usage"`
	MaxSizeGB   int64             `json:"maxSizeGB,omitempty"`
	IsActive    bool              `json:"isActive,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// UpdateBucketRequest is the request body for updating a bucket.
type UpdateBucketRequest struct {
	Name        *string           `json:"name,omitempty"`
	DisplayName *string           `json:"displayName,omitempty"`
	Region      *string           `json:"region,omitempty"`
	Usage       *string           `json:"usage,omitempty"`
	MaxSizeGB   *int64            `json:"maxSizeGB,omitempty"`
	IsActive    *bool             `json:"isActive,omitempty"`
	Metadata    *map[string]string `json:"metadata,omitempty"`
}

// StorageStats holds aggregate storage statistics.
type StorageStats struct {
	TotalProviders int   `json:"totalProviders"`
	ActiveProviders int  `json:"activeProviders"`
	TotalBuckets   int   `json:"totalBuckets"`
	TotalSizeGB    int64 `json:"totalSizeGB"`
	MaxSizeGB      int64 `json:"maxSizeGB"`
	HealthyCount   int   `json:"healthyCount"`
	UnhealthyCount int   `json:"unhealthyCount"`
}