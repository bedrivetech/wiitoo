-- queries.sql: sqlc query definitions for the auth service.
-- Run: cd sqlc && sqlc generate

-- name: CreateUser :one
INSERT INTO users (email, password, username)
VALUES ($1, $2, $3)
RETURNING *;

-- name: FindUserByEmail :one
SELECT * FROM users WHERE email = $1 LIMIT 1;

-- name: FindUserByUsername :one
SELECT * FROM users WHERE username = $1 LIMIT 1;

-- name: FindUserByID :one
SELECT * FROM users WHERE id = $1 LIMIT 1;

-- name: UpdateUserProfile :one
UPDATE users SET display_name = $2, avatar_url = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: VerifyUserEmail :exec
UPDATE users SET email_verified_at = NOW(), status = 'active', updated_at = NOW()
WHERE id = $1;

-- name: UpdateUserPassword :exec
UPDATE users SET password = $2, updated_at = NOW() WHERE id = $1;

-- name: UpdateUserEmail :exec
UPDATE users SET email = $2, email_verified_at = NULL, status = 'pending', updated_at = NOW()
WHERE id = $1;

-- name: CreateOAuthAccount :one
INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (provider, provider_user_id) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    expires_at = EXCLUDED.expires_at
RETURNING *;

-- name: FindOAuthAccount :one
SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2 LIMIT 1;

-- name: FindOAuthAccountsByUserID :many
SELECT * FROM oauth_accounts WHERE user_id = $1;

-- name: CreateRefreshToken :exec
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3);

-- name: FindRefreshTokenByHash :one
SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1;

-- name: RevokeRefreshToken :exec
UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL;

-- name: RevokeAllUserRefreshTokens :exec
UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL;