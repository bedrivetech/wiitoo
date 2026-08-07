package model

import "time"

// StorageProvider represents a configured storage provider stored in the database.
type StorageProvider struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	ProviderType   string     `json:"providerType"` // "wasabi", "backblaze", "idrive", "r2", "s3"
	AccessKey      string     `json:"-"`
	SecretKey      string     `json:"-"`
	DefaultRegion  string     `json:"defaultRegion"`
	Endpoint       *string    `json:"endpoint,omitempty"`
	IsActive       bool       `json:"isActive"`
	Priority       int        `json:"priority"`
	Weight         int        `json:"weight"`
	IsHealthy      bool       `json:"isHealthy"`
	LastHealthCheck *time.Time `json:"lastHealthCheck,omitempty"`
	TotalSizeGB    int64      `json:"totalSizeGB"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

// CreateStorageProviderRequest is the request body for adding a new provider.
type CreateStorageProviderRequest struct {
	Name          string `json:"name"`
	ProviderType  string `json:"providerType"`
	AccessKey     string `json:"accessKey"`
	SecretKey     string `json:"secretKey"`
	DefaultRegion string `json:"defaultRegion"`
	Endpoint      string `json:"endpoint,omitempty"`
	Priority      int    `json:"priority,omitempty"`
	Weight        int    `json:"weight,omitempty"`
}

// UpdateStorageProviderRequest is the request body for updating a provider.
type UpdateStorageProviderRequest struct {
	Name          *string `json:"name,omitempty"`
	ProviderType  *string `json:"providerType,omitempty"`
	AccessKey     *string `json:"accessKey,omitempty"`
	SecretKey     *string `json:"secretKey,omitempty"`
	DefaultRegion *string `json:"defaultRegion,omitempty"`
	Endpoint      *string `json:"endpoint,omitempty"`
	IsActive      *bool   `json:"isActive,omitempty"`
	Priority      *int    `json:"priority,omitempty"`
	Weight        *int    `json:"weight,omitempty"`
}