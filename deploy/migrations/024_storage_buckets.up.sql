CREATE TABLE IF NOT EXISTS storage_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES storage_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'us-east-1',
    usage TEXT NOT NULL DEFAULT 'general',
    max_size_gb BIGINT NOT NULL DEFAULT 0,
    used_size_gb BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_buckets_provider ON storage_buckets(provider_id);
CREATE INDEX IF NOT EXISTS idx_storage_buckets_usage ON storage_buckets(usage);
