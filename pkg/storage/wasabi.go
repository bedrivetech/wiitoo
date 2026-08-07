package storage

// NewWasabiProvider creates an S3Store configured for Wasabi.
// Wasabi endpoints: https://s3.wasabisys.com, https://s3.us-east-1.wasabisys.com, etc.
// Default region: us-east-1. Path-style by default.
func NewWasabiProvider(cfg ProviderConfig) (*S3Store, error) {
	s3Cfg := S3Config{
		Endpoint:  cfg.Endpoint,
		Region:    cfg.DefaultRegion,
		AccessKey: cfg.AccessKey,
		SecretKey: cfg.SecretKey,
	}
	if s3Cfg.Endpoint == "" {
		s3Cfg.Endpoint = "https://s3.wasabisys.com"
	}
	if s3Cfg.Region == "" {
		s3Cfg.Region = "us-east-1"
	}
	return NewS3Store(s3Cfg)
}