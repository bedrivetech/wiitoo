CREATE TABLE IF NOT EXISTS storage_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usage_type TEXT NOT NULL UNIQUE,
    strategy TEXT NOT NULL DEFAULT 'round_robin',
    bucket_ids UUID[] NOT NULL DEFAULT '{}',
    geo_hints JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
