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
