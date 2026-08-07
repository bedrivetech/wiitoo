CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id VARCHAR(255),
    user_id UUID REFERENCES users(id),
    filename VARCHAR(255),
    content_type VARCHAR(100),
    size_bytes BIGINT DEFAULT 0,
    storage_key TEXT,
    hls_url TEXT,
    thumbnail TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    duration FLOAT DEFAULT 0,
    category VARCHAR(100),
    tags TEXT[],
    is_mature BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);
