# Current ObjectStore interface
# Needs additions: ProviderName(), HealthCheck()
# Current S3 implementation — needs to support dynamic credentials per provider

# Storage providers to build:
# - Wasabi (s3-compatible, different endpoint)
# - Backblaze B2 (s3-compatible gateway)
# - IDrive e2 (s3-compatible)
# - Cloudflare R2 (s3-compatible, path-style)

# StorageManager — manages multiple providers, routes uploads
# UploadRouter — strategies: round_robin, geo, capacity

# Usage across platform (need to update video service):
# services/video/internal/service/video.go uses ObjectStore