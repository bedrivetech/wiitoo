package repository

import (
	"context"
	"time"

	"github.com/fusion-platform/auth/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository handles user CRUD against PostgreSQL.
type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

// Create inserts a new user. Returns the created user.
func (r *UserRepository) Create(ctx context.Context, email, password, username string) (*model.User, error) {
	user := &model.User{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO users (email, password, username)
		 VALUES ($1, $2, $3)
		 RETURNING id, email, password, username, display_name, avatar_url, role, status,
		           email_verified_at, created_at, updated_at`,
		email, password, username,
	).Scan(
		&user.ID, &user.Email, &user.Password, &user.Username,
		&user.DisplayName, &user.AvatarURL, &user.Role, &user.Status,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// FindByEmail looks up a user by email.
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	user := &model.User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password, username, display_name, avatar_url, role, status,
		        email_verified_at, created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(
		&user.ID, &user.Email, &user.Password, &user.Username,
		&user.DisplayName, &user.AvatarURL, &user.Role, &user.Status,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// FindByUsername looks up a user by username.
func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*model.User, error) {
	user := &model.User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password, username, display_name, avatar_url, role, status,
		        email_verified_at, created_at, updated_at
		 FROM users WHERE username = $1`,
		username,
	).Scan(
		&user.ID, &user.Email, &user.Password, &user.Username,
		&user.DisplayName, &user.AvatarURL, &user.Role, &user.Status,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// FindByID looks up a user by primary key.
func (r *UserRepository) FindByID(ctx context.Context, id string) (*model.User, error) {
	user := &model.User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password, username, display_name, avatar_url, role, status,
		        email_verified_at, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(
		&user.ID, &user.Email, &user.Password, &user.Username,
		&user.DisplayName, &user.AvatarURL, &user.Role, &user.Status,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// UpdateProfile updates display_name and/or avatar_url for a user.
func (r *UserRepository) UpdateProfile(ctx context.Context, id string, displayName, avatarURL string) (*model.User, error) {
	user := &model.User{}
	err := r.pool.QueryRow(ctx,
		`UPDATE users SET display_name = $2, avatar_url = $3, updated_at = NOW()
		 WHERE id = $1
		 RETURNING id, email, password, username, display_name, avatar_url, role, status,
		           email_verified_at, created_at, updated_at`,
		id, displayName, avatarURL,
	).Scan(
		&user.ID, &user.Email, &user.Password, &user.Username,
		&user.DisplayName, &user.AvatarURL, &user.Role, &user.Status,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// VerifyEmail marks the user's email as verified and sets status to active.
func (r *UserRepository) VerifyEmail(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET email_verified_at = NOW(), status = 'active', updated_at = NOW()
		 WHERE id = $1`,
		id,
	)
	return err
}

// UpdatePassword updates the user's password hash.
func (r *UserRepository) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET password = $2, updated_at = NOW() WHERE id = $1`,
		id, passwordHash,
	)
	return err
}

// UpdateEmail updates the user's email address and resets email_verified_at.
func (r *UserRepository) UpdateEmail(ctx context.Context, id, email string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET email = $2, email_verified_at = NULL, status = 'pending', updated_at = NOW()
		 WHERE id = $1`,
		id, email,
	)
	return err
}

// --- OAuth Account methods ---

// CreateOAuthAccount links an OAuth account to a user.
func (r *UserRepository) CreateOAuthAccount(ctx context.Context, userID, provider, providerUserID, accessToken, refreshToken string, expiresAt *time.Time) (*model.OAuthAccount, error) {
	acct := &model.OAuthAccount{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token, expires_at)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (provider, provider_user_id) DO UPDATE SET
		   access_token = EXCLUDED.access_token,
		   refresh_token = EXCLUDED.refresh_token,
		   expires_at = EXCLUDED.expires_at
		 RETURNING id, user_id, provider, provider_user_id, access_token, refresh_token, expires_at, created_at`,
		userID, provider, providerUserID, accessToken, refreshToken, expiresAt,
	).Scan(
		&acct.ID, &acct.UserID, &acct.Provider, &acct.ProviderUserID,
		&acct.AccessToken, &acct.RefreshToken, &acct.ExpiresAt, &acct.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return acct, nil
}

// FindOAuthAccount finds an OAuth account by provider + provider user ID.
func (r *UserRepository) FindOAuthAccount(ctx context.Context, provider, providerUserID string) (*model.OAuthAccount, error) {
	acct := &model.OAuthAccount{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, provider, provider_user_id, access_token, refresh_token, expires_at, created_at
		 FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2`,
		provider, providerUserID,
	).Scan(
		&acct.ID, &acct.UserID, &acct.Provider, &acct.ProviderUserID,
		&acct.AccessToken, &acct.RefreshToken, &acct.ExpiresAt, &acct.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return acct, nil
}

// --- Refresh Token methods ---

// SaveRefreshToken stores a hashed refresh token.
func (r *UserRepository) SaveRefreshToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		 VALUES ($1, $2, $3)`,
		userID, tokenHash, expiresAt,
	)
	return err
}

// FindRefreshToken looks up a refresh token by hash.
func (r *UserRepository) FindRefreshToken(ctx context.Context, tokenHash string) (*model.RefreshToken, error) {
	t := &model.RefreshToken{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
		 FROM refresh_tokens WHERE token_hash = $1`,
		tokenHash,
	).Scan(&t.ID, &t.UserID, &t.TokenHash, &t.ExpiresAt, &t.RevokedAt, &t.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return t, nil
}

// RevokeRefreshToken revokes a refresh token.
func (r *UserRepository) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
		tokenHash,
	)
	return err
}

// RevokeAllUserRefreshTokens revokes all refresh tokens for a user.
func (r *UserRepository) RevokeAllUserRefreshTokens(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
		userID,
	)
	return err
}