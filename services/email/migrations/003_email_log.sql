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