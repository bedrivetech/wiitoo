CREATE TABLE IF NOT EXISTS storage_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usage_type TEXT NOT NULL UNIQUE,      -- "video", "thumbnail", "backup", "general"
    strategy TEXT NOT NULL DEFAULT 'round_robin',  -- "round_robin", "geo", "capacity"
    bucket_ids UUID[] NOT NULL DEFAULT '{}',       -- ordered list of bucket IDs
    geo_hints JSONB DEFAULT '{}',                  -- region -> bucket_id mapping for geo strategy
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);