CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    category VARCHAR(100),
    tags TEXT[],
    stream_key VARCHAR(128) UNIQUE,
    rtmp_url TEXT,
    status VARCHAR(20) DEFAULT 'idle',
    viewer_count INT DEFAULT 0,
    max_viewers INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INT DEFAULT 0,
    vod_key TEXT,
    is_mature BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
