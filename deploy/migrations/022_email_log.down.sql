DROP INDEX IF EXISTS idx_email_log_sent_at;
DROP INDEX IF EXISTS idx_email_log_status;
DROP INDEX IF EXISTS idx_email_log_provider;
DROP INDEX IF EXISTS idx_email_log_to_email;
DROP TABLE IF EXISTS email_log CASCADE;
