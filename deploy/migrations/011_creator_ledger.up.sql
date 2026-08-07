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
