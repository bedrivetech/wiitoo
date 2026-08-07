CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    username VARCHAR(50),
    display_name VARCHAR(100),
    body TEXT,
    is_highlighted BOOLEAN DEFAULT FALSE,
    tip_amount FLOAT DEFAULT 0,
    badges TEXT[],
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_stream ON chat_messages(stream_id, sent_at DESC);
