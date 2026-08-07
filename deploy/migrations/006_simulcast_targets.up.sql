CREATE TABLE IF NOT EXISTS simulcast_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    rtmp_url TEXT,
    stream_key TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stream_id, platform)
);
