#!/bin/bash
# Database initialization script — creates all databases and extensions
set -e

psql -U fusion -d postgres -c "CREATE DATABASE fusion;" 2>/dev/null || true

# Connect to fusion and create extensions
psql -U fusion -d fusion << 'SQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ====================================================================
-- Auth service tables
-- ====================================================================

CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT UNIQUE NOT NULL,
    password          TEXT NOT NULL, -- bcrypt hash
    username          TEXT UNIQUE NOT NULL,
    display_name      TEXT NOT NULL DEFAULT '',
    avatar_url        TEXT NOT NULL DEFAULT '',
    role              TEXT NOT NULL DEFAULT 'viewer', -- viewer, creator, moderator, admin
    status            TEXT NOT NULL DEFAULT 'pending', -- pending, active, suspended, deleted
    email_verified_at TIMESTAMPTZ,
    login_count       INTEGER NOT NULL DEFAULT 0,
    last_login_at     TIMESTAMPTZ,
    last_ip           TEXT NOT NULL DEFAULT '',
    notes             TEXT NOT NULL DEFAULT '',
    creator_verified  BOOLEAN NOT NULL DEFAULT false,
    creator_applied_at TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_ban_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    banned_by UUID NOT NULL REFERENCES users(id),
    duration_hours INTEGER,
    note TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_ban_history_user ON user_ban_history(user_id);

CREATE TABLE IF NOT EXISTS creator_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    documents JSONB,
    notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creator_verification_status ON creator_verification_requests(status);

-- ====================================================================
-- Video service tables
-- ====================================================================

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

-- ====================================================================
-- Stream service tables
-- ====================================================================

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

-- ====================================================================
-- Chat service tables
-- ====================================================================

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

-- ====================================================================
-- Payment service tables
-- ====================================================================

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

-- ====================================================================
-- Content service tables
-- ====================================================================

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

-- ====================================================================
-- Notification service tables
-- ====================================================================

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

-- ====================================================================
-- Email service tables
-- ====================================================================

CREATE TABLE IF NOT EXISTS email_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    config JSONB NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    weight INTEGER NOT NULL DEFAULT 1,
    last_health_check TIMESTAMP WITH TIME ZONE,
    is_healthy BOOLEAN NOT NULL DEFAULT true,
    from_name TEXT NOT NULL DEFAULT 'Fusion Platform',
    from_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_providers_active ON email_providers (is_active, is_healthy);
CREATE INDEX IF NOT EXISTS idx_email_providers_priority ON email_providers (priority);

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    subject TEXT NOT NULL,
    text_body TEXT NOT NULL,
    html_body TEXT NOT NULL,
    variables TEXT[] NOT NULL DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates (name);

CREATE TABLE IF NOT EXISTS email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    provider_id UUID REFERENCES email_providers(id) ON DELETE SET NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    error TEXT,
    metadata JSONB,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log (status);
CREATE INDEX IF NOT EXISTS idx_email_log_provider ON email_log (provider_id);
CREATE INDEX IF NOT EXISTS idx_email_log_to_email ON email_log (to_email);

-- ====================================================================
-- Storage service tables
-- ====================================================================

CREATE TABLE IF NOT EXISTS storage_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    access_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    default_region TEXT NOT NULL DEFAULT 'us-east-1',
    endpoint TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    weight INTEGER NOT NULL DEFAULT 1,
    is_healthy BOOLEAN NOT NULL DEFAULT true,
    last_health_check TIMESTAMP WITH TIME ZONE,
    total_size_gb BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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

-- ====================================================================
-- Seed some categories
-- ====================================================================

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