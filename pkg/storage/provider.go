package storage

import "time"

// ProviderConfig holds the full configuration for a storage provider.
type ProviderConfig struct {
	ID            string         `json:"id"`
	Name          string         `json:"name"`          // friendly name
	ProviderType  string         `json:"providerType"`  // "wasabi", "backblaze", "idrive", "r2", "s3"
	AccessKey     string         `json:"accessKey"`
	SecretKey     string         `json:"secretKey"`
	DefaultRegion string         `json:"defaultRegion"`
	Endpoint      string         `json:"endpoint"` // custom endpoint (optional)
	Buckets       []BucketConfig `json:"buckets"`
	IsActive      bool           `json:"isActive"`
	Priority      int            `json:"priority"` // lower = higher priority for routing
	Weight        int            `json:"weight"`   // for weighted round-robin
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
}

// BucketConfig describes a bucket within a provider.
type BucketConfig struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`        // actual bucket name in the provider
	DisplayName string            `json:"displayName"` // friendly label
	Region      string            `json:"region"`
	Usage       string            `json:"usage"` // "video", "thumbnail", "backup", "general"
	MaxSizeGB   int64             `json:"maxSizeGB"`
	UsedSizeGB  int64             `json:"usedSizeGB"`
	IsActive    bool              `json:"isActive"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}