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