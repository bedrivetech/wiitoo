CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    thumbnail TEXT,
    viewer_count INT DEFAULT 0,
    stream_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
