CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT UNIQUE NOT NULL,
    password          TEXT NOT NULL,
    username          TEXT UNIQUE NOT NULL,
    display_name      TEXT NOT NULL DEFAULT '',
    avatar_url        TEXT NOT NULL DEFAULT '',
    role              TEXT NOT NULL DEFAULT 'viewer',
    status            TEXT NOT NULL DEFAULT 'pending',
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
