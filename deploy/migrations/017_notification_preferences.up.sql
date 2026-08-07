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
