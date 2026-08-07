#!/bin/bash
# Database initialization script — creates all databases and extensions
set -e

psql -U fusion -d postgres -c "CREATE DATABASE fusion;"

# Connect to fusion and create extensions
psql -U fusion -d fusion << 'SQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Auth service tables (already in migration)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video service tables
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

-- Stream service tables
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

-- Chat service tables
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

-- Payment service tables
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    plan_id VARCHAR(50),
    provider VARCHAR(20),
    provider_sub_id VARCHAR(255),
    status VARCHAR(20),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20),
    provider VARCHAR(20),
    provider_txn_id VARCHAR(255),
    amount FLOAT,
    currency VARCHAR(10) DEFAULT 'USD',
    fee FLOAT DEFAULT 0,
    net_amount FLOAT,
    status VARCHAR(20),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_ledger (
    creator_id UUID PRIMARY KEY REFERENCES users(id),
    balance FLOAT DEFAULT 0,
    lifetime_earnings FLOAT DEFAULT 0,
    pending_payout FLOAT DEFAULT 0,
    payout_method VARCHAR(20) DEFAULT 'paypal',
    payout_email VARCHAR(255),
    payout_address TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id),
    amount FLOAT,
    fee FLOAT DEFAULT 0,
    net_amount FLOAT,
    method VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    provider_ref VARCHAR(255),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content service tables
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

CREATE TABLE IF NOT EXISTS category_followers (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, category_id)
);

CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id),
    content_id UUID,
    content_type VARCHAR(20),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification service tables
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    body TEXT,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_follows BOOLEAN DEFAULT TRUE,
    email_subs BOOLEAN DEFAULT TRUE,
    email_tips BOOLEAN DEFAULT TRUE,
    email_payouts BOOLEAN DEFAULT TRUE,
    push_follows BOOLEAN DEFAULT TRUE,
    push_subs BOOLEAN DEFAULT TRUE,
    push_tips BOOLEAN DEFAULT TRUE,
    push_stream_starts BOOLEAN DEFAULT TRUE
);

-- Seed some categories
INSERT INTO categories (id, name, slug, description) VALUES
    (uuid_generate_v4(), 'Just Chatting', 'just-chatting', 'Hang out and chat with streamers'),
    (uuid_generate_v4(), 'Music', 'music', 'Live music performances and production'),
    (uuid_generate_v4(), 'Gaming', 'gaming', 'Video game live streams'),
    (uuid_generate_v4(), 'Creative', 'creative', 'Art, design, and creative processes'),
    (uuid_generate_v4(), 'Sports', 'sports', 'Live sports and discussion'),
    (uuid_generate_v4(), 'Tech', 'tech', 'Technology and coding live streams'),
    (uuid_generate_v4(), 'Education', 'education', 'Learning and educational content'),
    (uuid_generate_v4(), 'IRL', 'irl', 'In real life — daily vlogging and adventures')
ON CONFLICT (slug) DO NOTHING;
SQL

echo "Database initialized successfully"