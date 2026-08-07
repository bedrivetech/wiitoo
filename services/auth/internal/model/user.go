package model

import "time"

// UserRole represents the role of a user in the platform.
type UserRole string

const (
	RoleViewer   UserRole = "viewer"
	RoleCreator  UserRole = "creator"
	RoleModerator UserRole = "moderator"
	RoleAdmin    UserRole = "admin"
)

// UserStatus represents the current status of a user account.
type UserStatus string

const (
	StatusPending  UserStatus = "pending"
	StatusActive   UserStatus = "active"
	StatusSuspended UserStatus = "suspended"
	StatusDeleted  UserStatus = "deleted"
)

// User represents a user in the system.
type User struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	Password        string     `json:"-"` // never expose in JSON
	Username        string     `json:"username"`
	DisplayName     string     `json:"display_name"`
	AvatarURL       string     `json:"avatar_url"`
	Role            UserRole   `json:"role"`
	Status          UserStatus `json:"status"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// IsActive returns true if the user account is active.
func (u *User) IsActive() bool {
	return u.Status == StatusActive
}

// IsEmailVerified returns true if the user has verified their email.
func (u *User) IsEmailVerified() bool {
	return u.EmailVerifiedAt != nil && !u.EmailVerifiedAt.IsZero()
}

// HasRole checks if the user has at least the given role.
func (u *User) HasRole(role UserRole) bool {
	roles := map[UserRole]int{
		RoleViewer:   0,
		RoleCreator:  1,
		RoleModerator: 2,
		RoleAdmin:    3,
	}
	return roles[u.Role] >= roles[role]
}

// OAuthAccount represents a linked OAuth provider account.
type OAuthAccount struct {
	ID             string     `json:"id"`
	UserID         string     `json:"user_id"`
	Provider       string     `json:"provider"`
	ProviderUserID string     `json:"provider_user_id"`
	AccessToken    string     `json:"-"`
	RefreshToken   string     `json:"-"`
	ExpiresAt      *time.Time `json:"expires_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

// RefreshToken represents a stored refresh token.
type RefreshToken struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	TokenHash string    `json:"-"` // bcrypt hash of the refresh token
	ExpiresAt time.Time `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// --- API Request/Response types ---

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Username string `json:"username"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type VerifyRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type ResendRequest struct {
	Email string `json:"email"`
}

type PasswordResetRequest struct {
	Email string `json:"email"`
}

type PasswordResetConfirmRequest struct {
	Email       string `json:"email"`
	Code        string `json:"code"`
	NewPassword string `json:"new_password"`
}

type TokenRefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type UpdateProfileRequest struct {
	DisplayName *string `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

type EmailChangeRequest struct {
	Email string `json:"email"`
}

type EmailChangeConfirmRequest struct {
	Email       string `json:"email"`
	OldEmailCode string `json:"old_email_code"`
	NewEmailCode string `json:"new_email_code"`
}

// --- API Response types ---

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

type OTPChallengeResponse struct {
	Message string `json:"message"`
	ExpiresIn int   `json:"expires_in_seconds"`
}

type TokenRefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *APIError) Error() string {
	return e.Code + ": " + e.Message
}

// UserProfile extends User with admin-relevant metadata.
type UserProfile struct {
	User
	LoginCount       int        `json:"loginCount"`
	LastLoginAt      *time.Time `json:"lastLoginAt"`
	LastIP           string     `json:"lastIP"`
	EmailVerified    bool       `json:"emailVerified"`
	TwoFactorEnabled bool       `json:"twoFactorEnabled"`
	BanHistory       []BanEntry `json:"banHistory,omitempty"`
	Notes            string     `json:"notes,omitempty"` // admin notes
	CreatorVerified  bool       `json:"creatorVerified"` // KYC passed
	CreatorAppliedAt *time.Time `json:"creatorAppliedAt"`
	TotalStreams     int        `json:"totalStreams"`
	TotalFollowers   int        `json:"totalFollowers"`
	TotalEarned      float64    `json:"totalEarned"`
}

// BanEntry tracks suspension/bans on a user account.
type BanEntry struct {
	ID        string     `json:"id"`
	Reason    string     `json:"reason"`
	BannedBy  string     `json:"bannedBy"` // admin user ID
	Duration  *int       `json:"duration"` // hours, nil = permanent
	Note      string     `json:"note"`
	Active    bool       `json:"active"`
	CreatedAt time.Time  `json:"createdAt"`
	RemovedAt *time.Time `json:"removedAt"` // when ban was lifted
}

// CreatorVerificationRequest represents a creator application.
type CreatorVerificationRequest struct {
	ID         string     `json:"id"`
	UserID     string     `json:"userId"`
	Status     string     `json:"status"` // pending, approved, rejected
	Documents  []byte     `json:"documents,omitempty"`
	Notes      string     `json:"notes,omitempty"`
	ReviewedBy *string    `json:"reviewedBy,omitempty"`
	ReviewedAt *time.Time `json:"reviewedAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	// Joined fields
	UserEmail    string `json:"userEmail,omitempty"`
	UserUsername string `json:"userUsername,omitempty"`
}

// Standard error codes
const (
	ErrCodeInvalidCredentials   = "INVALID_CREDENTIALS"
	ErrCodeEmailTaken           = "EMAIL_TAKEN"
	ErrCodeUsernameTaken        = "USERNAME_TAKEN"
	ErrCodeInvalidOTP           = "INVALID_OTP"
	ErrCodeOTPExpired           = "OTP_EXPIRED"
	ErrCodeOTPRateLimit         = "OTP_RATE_LIMITED"
	ErrCodeInvalidToken         = "INVALID_TOKEN"
	ErrCodeExpiredToken         = "EXPIRED_TOKEN"
	ErrCodeUserNotFound         = "USER_NOT_FOUND"
	ErrCodeUserSuspended        = "USER_SUSPENDED"
	ErrCodeUserDeleted          = "USER_DELETED"
	ErrCodeValidationError      = "VALIDATION_ERROR"
	ErrCodeUnauthorized         = "UNAUTHORIZED"
	ErrCodeRateLimited          = "RATE_LIMITED"
	ErrCodeInternalError        = "INTERNAL_ERROR"
	ErrCodeEmailNotVerified     = "EMAIL_NOT_VERIFIED"
	ErrCodeWeakPassword         = "WEAK_PASSWORD"
	ErrCodeOAuthProviderError   = "OAUTH_PROVIDER_ERROR"
	ErrCodeInvalidRequestBody   = "INVALID_REQUEST_BODY"
	ErrCodeChangeEmailMismatch  = "EMAIL_CHANGE_MISMATCH"
)