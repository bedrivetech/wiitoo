CREATE TABLE IF NOT EXISTS stream_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    viewer_count INT DEFAULT 0,
    chat_rate FLOAT DEFAULT 0,
    new_followers INT DEFAULT 0,
    new_subscribers INT DEFAULT 0,
    bits_donated FLOAT DEFAULT 0
);
