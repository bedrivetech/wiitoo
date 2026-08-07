// Package storage provides a provider-agnostic object storage interface.
// Implementations: S3, Cloudflare R2, GCS, MinIO, Backblaze B2.
package storage

import (
	"context"
	"io"
	"time"
)

// ObjectStore is the interface for all object storage operations.
// All platform microservices depend on this interface, never on a specific provider.
type ObjectStore interface {
	// Upload stores data at the given key in the given bucket.
	Upload(ctx context.Context, bucket, key string, r io.Reader, opts ...UploadOption) error

	// Download retrieves data for the given key.
	Download(ctx context.Context, bucket, key string) (io.ReadCloser, error)

	// Delete removes the object at the given key.
	Delete(ctx context.Context, bucket, key string) error

	// Exists checks if an object exists at the given key.
	Exists(ctx context.Context, bucket, key string) (bool, error)

	// List returns objects with the given prefix.
	List(ctx context.Context, bucket, prefix string, opts ...ListOption) ([]ObjectInfo, error)

	// PresignedURL generates a time-limited URL for direct upload/download.
	PresignedURL(ctx context.Context, bucket, key string, ttl time.Duration, method string) (string, error)

	// Copy copies an object from source to destination within the same store.
	Copy(ctx context.Context, srcBucket, srcKey, dstBucket, dstKey string) error

	// MultipartUpload starts a multipart upload and returns an upload ID.
	MultipartUpload(ctx context.Context, bucket, key string, opts ...UploadOption) (string, error)

	// MultipartPart uploads a part of a multipart upload.
	MultipartPart(ctx context.Context, bucket, key, uploadID string, partNum int, r io.Reader) (string, error)

	// MultipartComplete completes a multipart upload.
	MultipartComplete(ctx context.Context, bucket, key, uploadID string, parts []MultipartPart) error

	// ProviderName returns the friendly name of this provider.
	ProviderName() string

	// HealthCheck checks whether the provider is reachable and operational.
	HealthCheck(ctx context.Context) error
}

// Region describes a storage region for a provider.
type Region struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Endpoint string `json:"endpoint"`
	Location string `json:"location"` // geo hint: "us-east", "eu-west", "ap-southeast"
}

// ObjectInfo describes a stored object.
type ObjectInfo struct {
	Key          string    `json:"key"`
	Size         int64     `json:"size"`
	ETag         string    `json:"etag"`
	LastModified time.Time `json:"lastModified"`
	ContentType  string    `json:"contentType,omitempty"`
}

// MultipartPart represents a completed part in a multipart upload.
type MultipartPart struct {
	PartNum   int    `json:"partNum"`
	ETag      string `json:"etag"`
	SizeBytes int64  `json:"sizeBytes,omitempty"`
}

// UploadOptions configures an upload operation.
type UploadOptions struct {
	ContentType     string
	ContentEncoding string
	CacheControl    string
	Metadata        map[string]string
}

// UploadOption is a functional option for Upload.
type UploadOption func(*UploadOptions)

// WithContentType sets the content type.
func WithContentType(ct string) UploadOption {
	return func(o *UploadOptions) { o.ContentType = ct }
}

// WithContentEncoding sets the content encoding.
func WithContentEncoding(ce string) UploadOption {
	return func(o *UploadOptions) { o.ContentEncoding = ce }
}

// WithCacheControl sets the cache control header.
func WithCacheControl(cc string) UploadOption {
	return func(o *UploadOptions) { o.CacheControl = cc }
}

// WithMetadata sets user-defined metadata.
func WithMetadata(m map[string]string) UploadOption {
	return func(o *UploadOptions) { o.Metadata = m }
}

// ListOptions configures a List operation.
type ListOptions struct {
	MaxKeys int32
	StartAfter string
}

// ListOption is a functional option for List.
type ListOption func(*ListOptions)

// WithMaxKeys sets the maximum number of keys to return.
func WithMaxKeys(n int32) ListOption {
	return func(o *ListOptions) { o.MaxKeys = n }
}

// WithStartAfter starts listing after the given key.
func WithStartAfter(s string) ListOption {
	return func(o *ListOptions) { o.StartAfter = s }
}