package storage

// NewR2Provider creates an S3Store configured for Cloudflare R2.
// Endpoint: https://{account_id}.r2.cloudflarestorage.com
// Region: "auto"
// Access Key: R2 token access key ID
// Secret Key: R2 token secret access key
func NewR2Provider(cfg ProviderConfig) (*S3Store, error) {
	s3Cfg := S3Config{
		Endpoint:  cfg.Endpoint,
		Region:    "auto",
		AccessKey: cfg.AccessKey,
		SecretKey: cfg.SecretKey,
	}
	return NewS3Store(s3Cfg)
}