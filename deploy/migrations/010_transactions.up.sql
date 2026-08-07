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
