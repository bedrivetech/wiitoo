package storage

// NewBackblazeProvider creates an S3Store configured for Backblaze B2.
// Endpoint: https://s3.{region}.backblazeb2.com
// Uses application key ID as access key, application key as secret key.
func NewBackblazeProvider(cfg ProviderConfig) (*S3Store, error) {
	s3Cfg := S3Config{
		Endpoint:  cfg.Endpoint,
		Region:    cfg.DefaultRegion,
		AccessKey: cfg.AccessKey,
		SecretKey: cfg.SecretKey,
	}
	if s3Cfg.Endpoint == "" {
		s3Cfg.Endpoint = "https://s3.us-west-004.backblazeb2.com"
	}
	if s3Cfg.Region == "" {
		s3Cfg.Region = "us-west-004"
	}
	return NewS3Store(s3Cfg)
}