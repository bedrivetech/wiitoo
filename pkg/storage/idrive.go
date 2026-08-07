package storage

// NewIDriveProvider creates an S3Store configured for IDrive e2.
// Endpoint: https://{region}.e2encrpyted.net
// Example regions: us, eu, ap
// Uses path-style by default.
func NewIDriveProvider(cfg ProviderConfig) (*S3Store, error) {
	s3Cfg := S3Config{
		Endpoint:  cfg.Endpoint,
		Region:    cfg.DefaultRegion,
		AccessKey: cfg.AccessKey,
		SecretKey: cfg.SecretKey,
	}
	if s3Cfg.Endpoint == "" {
		s3Cfg.Endpoint = "https://us.e2encrpyted.net"
	}
	if s3Cfg.Region == "" {
		s3Cfg.Region = "us"
	}
	return NewS3Store(s3Cfg)
}