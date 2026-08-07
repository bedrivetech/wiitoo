package repository

import (
	"context"
	"strconv"
	"strings"
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

// --- Admin methods ---

// AdminListUsers returns a paginated, filtered list of users.
func (r *UserRepository) AdminListUsers(ctx context.Context, search string, role, status string, limit, offset int) ([]*model.User, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if search != "" {
		where = append(where, "(email ILIKE $"+strconv.Itoa(argIdx)+" OR username ILIKE $"+strconv.Itoa(argIdx)+" OR display_name ILIKE $"+strconv.Itoa(argIdx)+")")
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if role != "" {
		where = append(where, "role = $"+strconv.Itoa(argIdx))
		args = append(args, role)
		argIdx++
	}
	if status != "" {
		where = append(where, "status = $"+strconv.Itoa(argIdx))
		args = append(args, status)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	// Count total
	var total int
	countQuery := "SELECT COUNT(*) FROM users WHERE " + whereClause
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Fetch page
	query := `SELECT id, email, password, username, display_name, avatar_url, role, status,
	          email_verified_at, created_at, updated_at
	          FROM users WHERE ` + whereClause + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		u := &model.User{}
		if err := rows.Scan(&u.ID, &u.Email, &u.Password, &u.Username, &u.DisplayName, &u.AvatarURL, &u.Role, &u.Status, &u.EmailVerifiedAt, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, nil
}

// AdminGetUserWithOAuth returns a user with their OAuth accounts.
func (r *UserRepository) AdminGetUserWithOAuth(ctx context.Context, id string) (*model.User, []*model.OAuthAccount, error) {
	user, err := r.FindByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if user == nil {
		return nil, nil, nil
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, provider, provider_user_id, access_token, refresh_token, expires_at, created_at
		 FROM oauth_accounts WHERE user_id = $1`, id)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var accounts []*model.OAuthAccount
	for rows.Next() {
		a := &model.OAuthAccount{}
		rows.Scan(&a.ID, &a.UserID, &a.Provider, &a.ProviderUserID, &a.AccessToken, &a.RefreshToken, &a.ExpiresAt, &a.CreatedAt)
		accounts = append(accounts, a)
	}
	return user, accounts, nil
}

// AdminUpdateUser updates a user's role, status, and/or display_name by admin.
func (r *UserRepository) AdminUpdateUser(ctx context.Context, id string, role *string, status *string, displayName *string) (*model.User, error) {
	sets := []string{"updated_at = NOW()"}
	args := []any{id}
	argIdx := 2

	if role != nil {
		sets = append(sets, "role = $"+strconv.Itoa(argIdx))
		args = append(args, *role)
		argIdx++
	}
	if status != nil {
		sets = append(sets, "status = $"+strconv.Itoa(argIdx))
		args = append(args, *status)
		argIdx++
	}
	if displayName != nil {
		sets = append(sets, "display_name = $"+strconv.Itoa(argIdx))
		args = append(args, *displayName)
		argIdx++
	}

	setClause := strings.Join(sets, ", ")
	query := `UPDATE users SET ` + setClause + ` WHERE id = $1
	          RETURNING id, email, password, username, display_name, avatar_url, role, status,
	                    email_verified_at, created_at, updated_at`

	user := &model.User{}
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&user.ID, &user.Email, &user.Password, &user.Username, &user.DisplayName, &user.AvatarURL, &user.Role, &user.Status,
		&user.EmailVerifiedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// AdminSoftDelete marks a user as deleted.
func (r *UserRepository) AdminSoftDelete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET status = 'deleted', updated_at = NOW() WHERE id = $1 AND status != 'deleted'`,
		id,
	)
	return err
}

// --- Admin Profile queries ---

// UserFilter for admin search/filter.
type UserFilter struct {
	Search          string
	Role            string
	Status          string
	CreatorVerified *bool
	MinCreatedAt    time.Time
	MaxCreatedAt    time.Time
	Limit           int
	Offset          int
}

// BanRequest contains the fields needed to ban a user.
type BanRequest struct {
	UserID   string
	Reason   string
	BannedBy string
	Duration *int // hours, nil = permanent
	Note     string
}

// ListUsersDetailed returns users with profile info, paginated.
func (r *UserRepository) ListUsersDetailed(ctx context.Context, filter UserFilter) ([]model.UserProfile, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if filter.Search != "" {
		where = append(where, "(u.email ILIKE $"+strconv.Itoa(argIdx)+" OR u.username ILIKE $"+strconv.Itoa(argIdx)+" OR u.display_name ILIKE $"+strconv.Itoa(argIdx)+")")
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}
	if filter.Role != "" {
		where = append(where, "u.role = $"+strconv.Itoa(argIdx))
		args = append(args, filter.Role)
		argIdx++
	}
	if filter.Status != "" {
		where = append(where, "u.status = $"+strconv.Itoa(argIdx))
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.CreatorVerified != nil {
		where = append(where, "u.creator_verified = $"+strconv.Itoa(argIdx))
		args = append(args, *filter.CreatorVerified)
		argIdx++
	}
	if !filter.MinCreatedAt.IsZero() {
		where = append(where, "u.created_at >= $"+strconv.Itoa(argIdx))
		args = append(args, filter.MinCreatedAt)
		argIdx++
	}
	if !filter.MaxCreatedAt.IsZero() {
		where = append(where, "u.created_at <= $"+strconv.Itoa(argIdx))
		args = append(args, filter.MaxCreatedAt)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	// Count total
	var total int
	countQuery := "SELECT COUNT(*) FROM users u WHERE " + whereClause
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}

	query := `SELECT u.id, u.email, u.password, u.username, u.display_name, u.avatar_url, u.role, u.status,
	          u.email_verified_at, u.created_at, u.updated_at,
	          u.login_count, u.last_login_at, u.last_ip, u.notes, u.creator_verified, u.creator_applied_at
	          FROM users u
	          WHERE ` + whereClause + `
	          ORDER BY u.created_at DESC
	          LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []model.UserProfile
	for rows.Next() {
		var up model.UserProfile
		var lastIP, notes string
		var lastLoginAt, creatorAppliedAt *time.Time

		if err := rows.Scan(
			&up.ID, &up.Email, &up.Password, &up.Username, &up.DisplayName, &up.AvatarURL,
			&up.Role, &up.Status, &up.EmailVerifiedAt, &up.CreatedAt, &up.UpdatedAt,
			&up.LoginCount, &lastLoginAt, &lastIP, &notes, &up.CreatorVerified, &creatorAppliedAt,
		); err != nil {
			return nil, 0, err
		}
		up.LastLoginAt = lastLoginAt
		up.LastIP = lastIP
		up.Notes = notes
		up.CreatorAppliedAt = creatorAppliedAt
		up.EmailVerified = up.IsEmailVerified()
		users = append(users, up)
	}

	if users == nil {
		users = []model.UserProfile{}
	}

	return users, total, nil
}

// GetUserProfile returns full profile for a single user.
func (r *UserRepository) GetUserProfile(ctx context.Context, id string) (*model.UserProfile, error) {
	query := `SELECT u.id, u.email, u.password, u.username, u.display_name, u.avatar_url, u.role, u.status,
	          u.email_verified_at, u.created_at, u.updated_at,
	          u.login_count, u.last_login_at, u.last_ip, u.notes, u.creator_verified, u.creator_applied_at
	          FROM users u WHERE u.id = $1`

	var up model.UserProfile
	var lastIP, notes string
	var lastLoginAt, creatorAppliedAt *time.Time

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&up.ID, &up.Email, &up.Password, &up.Username, &up.DisplayName, &up.AvatarURL,
		&up.Role, &up.Status, &up.EmailVerifiedAt, &up.CreatedAt, &up.UpdatedAt,
		&up.LoginCount, &lastLoginAt, &lastIP, &notes, &up.CreatorVerified, &creatorAppliedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	up.LastLoginAt = lastLoginAt
	up.LastIP = lastIP
	up.Notes = notes
	up.CreatorAppliedAt = creatorAppliedAt
	up.EmailVerified = up.IsEmailVerified()

	// Fetch ban history
	banHistory, err := r.GetBanHistory(ctx, id)
	if err != nil {
		// Non-fatal; return profile without ban history
		banHistory = []model.BanEntry{}
	}
	up.BanHistory = banHistory

	return &up, nil
}

// GetBanHistory returns all bans for a user.
func (r *UserRepository) GetBanHistory(ctx context.Context, userID string) ([]model.BanEntry, error) {
	query := `SELECT id, user_id, reason, banned_by, duration_hours, note, active, created_at, removed_at
	          FROM user_ban_history WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []model.BanEntry
	for rows.Next() {
		var e model.BanEntry
		var userID string
		if err := rows.Scan(&e.ID, &userID, &e.Reason, &e.BannedBy, &e.Duration, &e.Note, &e.Active, &e.CreatedAt, &e.RemovedAt); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}

	if entries == nil {
		entries = []model.BanEntry{}
	}

	return entries, nil
}

// BanUser creates a ban/suspension record.
func (r *UserRepository) BanUser(ctx context.Context, req BanRequest) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_ban_history (user_id, reason, banned_by, duration_hours, note)
		 VALUES ($1, $2, $3, $4, $5)`,
		req.UserID, req.Reason, req.BannedBy, req.Duration, req.Note,
	)
	if err != nil {
		return err
	}

	// Also set user status to suspended
	_, err = r.pool.Exec(ctx,
		`UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id = $1 AND status != 'deleted'`,
		req.UserID,
	)
	return err
}

// UnbanUser lifts an active ban.
func (r *UserRepository) UnbanUser(ctx context.Context, userID, removedBy string) error {
	// Deactivate all active bans for this user
	_, err := r.pool.Exec(ctx,
		`UPDATE user_ban_history SET active = false, removed_at = NOW()
		 WHERE user_id = $1 AND active = true`,
		userID,
	)
	if err != nil {
		return err
	}

	// Set user status back to active (unless deleted)
	_, err = r.pool.Exec(ctx,
		`UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1 AND status = 'suspended'`,
		userID,
	)
	return err
}

// UpdateUserNotes updates admin notes on a user.
func (r *UserRepository) UpdateUserNotes(ctx context.Context, userID, notes string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET notes = $2, updated_at = NOW() WHERE id = $1`,
		userID, notes,
	)
	return err
}

// SetCreatorVerified updates creator verification status.
func (r *UserRepository) SetCreatorVerified(ctx context.Context, userID string, verified bool) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET creator_verified = $2, updated_at = NOW() WHERE id = $1`,
		userID, verified,
	)
	return err
}

// GetCreatorVerificationRequests lists verification requests with optional status filter.
type CreatorVerificationRequest struct {
	ID         string     `json:"id"`
	UserID     string     `json:"userId"`
	Status     string     `json:"status"`
	Documents  []byte     `json:"documents,omitempty"`
	Notes      string     `json:"notes,omitempty"`
	ReviewedBy *string    `json:"reviewedBy,omitempty"`
	ReviewedAt *time.Time `json:"reviewedAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	UserEmail    string   `json:"userEmail,omitempty"`
	UserUsername string   `json:"userUsername,omitempty"`
}

func (r *UserRepository) GetCreatorVerificationRequests(ctx context.Context, status string, limit, offset int) ([]CreatorVerificationRequest, int, error) {
	where := "1=1"
	args := []any{}
	argIdx := 1

	if status != "" {
		where = "cvr.status = $" + strconv.Itoa(argIdx)
		args = append(args, status)
		argIdx++
	}

	// Count
	var total int
	countQuery := "SELECT COUNT(*) FROM creator_verification_requests cvr WHERE " + where
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	query := `SELECT cvr.id, cvr.user_id, cvr.status, cvr.documents, cvr.notes,
	          cvr.reviewed_by, cvr.reviewed_at, cvr.created_at, cvr.updated_at,
	          u.email, u.username
	          FROM creator_verification_requests cvr
	          JOIN users u ON u.id = cvr.user_id
	          WHERE ` + where + `
	          ORDER BY cvr.created_at DESC
	          LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var requests []CreatorVerificationRequest
	for rows.Next() {
		var req CreatorVerificationRequest
		var reviewedBy *string
		var reviewedAt *time.Time
		if err := rows.Scan(
			&req.ID, &req.UserID, &req.Status, &req.Documents, &req.Notes,
			&reviewedBy, &reviewedAt, &req.CreatedAt, &req.UpdatedAt,
			&req.UserEmail, &req.UserUsername,
		); err != nil {
			return nil, 0, err
		}
		req.ReviewedBy = reviewedBy
		req.ReviewedAt = reviewedAt
		requests = append(requests, req)
	}

	if requests == nil {
		requests = []CreatorVerificationRequest{}
	}

	return requests, total, nil
}

// ApproveCreatorVerification approves a creator application.
func (r *UserRepository) ApproveCreatorVerification(ctx context.Context, requestID, reviewerID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE creator_verification_requests
		 SET status = 'approved', reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
		 WHERE id = $1 AND status = 'pending'`,
		requestID, reviewerID,
	)
	if err != nil {
		return err
	}

	// Also set user's creator_verified = true and role = creator
	_, err = r.pool.Exec(ctx,
		`UPDATE users SET creator_verified = true, role = 'creator', updated_at = NOW()
		 WHERE id = (SELECT user_id FROM creator_verification_requests WHERE id = $1)`,
		requestID,
	)
	return err
}

// RejectCreatorVerification rejects a creator application.
func (r *UserRepository) RejectCreatorVerification(ctx context.Context, requestID, reviewerID, reason string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE creator_verification_requests
		 SET status = 'rejected', notes = $3, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
		 WHERE id = $1 AND status = 'pending'`,
		requestID, reviewerID, reason,
	)
	return err
}

// ExportUsers returns user data for CSV export (all fields).
func (r *UserRepository) ExportUsers(ctx context.Context, filter UserFilter) ([]model.UserProfile, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if filter.Search != "" {
		where = append(where, "(u.email ILIKE $"+strconv.Itoa(argIdx)+" OR u.username ILIKE $"+strconv.Itoa(argIdx)+" OR u.display_name ILIKE $"+strconv.Itoa(argIdx)+")")
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}
	if filter.Role != "" {
		where = append(where, "u.role = $"+strconv.Itoa(argIdx))
		args = append(args, filter.Role)
		argIdx++
	}
	if filter.Status != "" {
		where = append(where, "u.status = $"+strconv.Itoa(argIdx))
		args = append(args, filter.Status)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	query := `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, u.role, u.status,
	          u.email_verified_at, u.created_at, u.updated_at,
	          u.login_count, u.last_login_at, u.last_ip, u.notes, u.creator_verified, u.creator_applied_at
	          FROM users u
	          WHERE ` + whereClause + `
	          ORDER BY u.created_at DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.UserProfile
	for rows.Next() {
		var up model.UserProfile
		var lastIP, notes string
		var lastLoginAt, creatorAppliedAt *time.Time

		if err := rows.Scan(
			&up.ID, &up.Email, &up.Username, &up.DisplayName, &up.AvatarURL,
			&up.Role, &up.Status, &up.EmailVerifiedAt, &up.CreatedAt, &up.UpdatedAt,
			&up.LoginCount, &lastLoginAt, &lastIP, &notes, &up.CreatorVerified, &creatorAppliedAt,
		); err != nil {
			return nil, err
		}
		up.LastLoginAt = lastLoginAt
		up.LastIP = lastIP
		up.Notes = notes
		up.CreatorAppliedAt = creatorAppliedAt
		up.EmailVerified = up.IsEmailVerified()
		users = append(users, up)
	}

	if users == nil {
		users = []model.UserProfile{}
	}

	return users, nil
}

// BulkUpdateStatus updates status for multiple users at once.
func (r *UserRepository) BulkUpdateStatus(ctx context.Context, userIDs []string, status string, reason string) error {
	if len(userIDs) == 0 {
		return nil
	}

	// Build $1, $2, ... placeholders
	args := make([]any, 0, len(userIDs)+2)
	placeholders := make([]string, len(userIDs))
	for i, id := range userIDs {
		placeholders[i] = "$" + strconv.Itoa(i+1)
		args = append(args, id)
	}
	args = append(args, status)

	query := `UPDATE users SET status = $` + strconv.Itoa(len(userIDs)+1) + `, updated_at = NOW() WHERE id IN (` + strings.Join(placeholders, ",") + `)`
	_, err := r.pool.Exec(ctx, query, args...)
	if err != nil {
		return err
	}

	// If status is suspended, add ban history entries
	if status == "suspended" && reason != "" {
		for _, userID := range userIDs {
			_, err := r.pool.Exec(ctx,
				`INSERT INTO user_ban_history (user_id, reason, banned_by, note)
				 VALUES ($1, $2, $3, $4)`,
				userID, reason, "system", "Bulk action",
			)
			if err != nil {
				return err
			}
		}
	}

	return err
}

// BulkAssignRole assigns a role to multiple users at once.
func (r *UserRepository) BulkAssignRole(ctx context.Context, userIDs []string, role string) error {
	if len(userIDs) == 0 {
		return nil
	}

	placeholders := make([]string, len(userIDs))
	args := make([]any, 0, len(userIDs)+1)
	for i, id := range userIDs {
		placeholders[i] = "$" + strconv.Itoa(i+1)
		args = append(args, id)
	}
	args = append(args, role)

	query := `UPDATE users SET role = $` + strconv.Itoa(len(userIDs)+1) + `, updated_at = NOW() WHERE id IN (` + strings.Join(placeholders, ",") + `)`
	_, err := r.pool.Exec(ctx, query, args...)
	return err
}