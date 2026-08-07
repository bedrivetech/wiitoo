package service

import (
	"context"
	"fmt"
	"time"

	"github.com/fusion-platform/auth/internal/config"
	"github.com/fusion-platform/auth/internal/model"
	"github.com/fusion-platform/auth/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles user registration, login, and JWT management.
type AuthService struct {
	repo   *repository.UserRepository
	cfg    *config.Config
	hasher *Hasher
}

func NewAuthService(repo *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		repo:   repo,
		cfg:    cfg,
		hasher: NewHasher(),
	}
}

// Register creates a new user account. Returns the user and a challenge message.
func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (*model.User, error) {
	if err := s.validateRegistration(ctx, req); err != nil {
		return nil, err
	}

	hash, err := s.hasher.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user, err := s.repo.Create(ctx, req.Email, hash, req.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

// Login authenticates a user with email and password.
func (s *AuthService) Login(ctx context.Context, email, password string) (*model.User, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, serviceError(model.ErrCodeInvalidCredentials, "Invalid email or password")
	}

	if user.Status == model.StatusSuspended {
		return nil, serviceError(model.ErrCodeUserSuspended, "Account has been suspended")
	}
	if user.Status == model.StatusDeleted {
		return nil, serviceError(model.ErrCodeUserDeleted, "Account has been deleted")
	}

	if !s.hasher.CheckPassword(user.Password, password) {
		return nil, serviceError(model.ErrCodeInvalidCredentials, "Invalid email or password")
	}

	return user, nil
}

// GenerateTokens creates access and refresh token pair.
func (s *AuthService) GenerateTokens(ctx context.Context, user *model.User) (*model.AuthResponse, error) {
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshTokenRaw, err := s.generateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Hash and store refresh token
	refreshHash, err := s.hasher.HashToken(refreshTokenRaw)
	if err != nil {
		return nil, fmt.Errorf("failed to hash refresh token: %w", err)
	}

	err = s.repo.SaveRefreshToken(ctx, user.ID, refreshHash, time.Now().Add(s.cfg.RefreshTokenTTL))
	if err != nil {
		return nil, fmt.Errorf("failed to save refresh token: %w", err)
	}

	return &model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshTokenRaw,
		User:         *user,
	}, nil
}

// RefreshTokens validates a refresh token and issues a new token pair.
func (s *AuthService) RefreshTokens(ctx context.Context, refreshTokenRaw string) (*model.TokenRefreshResponse, error) {
	refreshHash, err := s.hasher.HashToken(refreshTokenRaw)
	if err != nil {
		return nil, serviceError(model.ErrCodeInvalidToken, "Invalid refresh token")
	}

	stored, err := s.repo.FindRefreshToken(ctx, refreshHash)
	if err != nil {
		return nil, fmt.Errorf("failed to find refresh token: %w", err)
	}
	if stored == nil {
		return nil, serviceError(model.ErrCodeInvalidToken, "Refresh token not found")
	}
	if stored.RevokedAt != nil {
		return nil, serviceError(model.ErrCodeInvalidToken, "Refresh token has been revoked")
	}
	if time.Now().After(stored.ExpiresAt) {
		return nil, serviceError(model.ErrCodeExpiredToken, "Refresh token has expired")
	}

	// Revoke old token (rotation)
	if err := s.repo.RevokeRefreshToken(ctx, refreshHash); err != nil {
		return nil, fmt.Errorf("failed to revoke old refresh token: %w", err)
	}

	user, err := s.repo.FindByID(ctx, stored.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, serviceError(model.ErrCodeUserNotFound, "User not found")
	}

	newAccessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshRaw, err := s.generateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	newRefreshHash, err := s.hasher.HashToken(newRefreshRaw)
	if err != nil {
		return nil, fmt.Errorf("failed to hash new refresh token: %w", err)
	}

	if err := s.repo.SaveRefreshToken(ctx, user.ID, newRefreshHash, time.Now().Add(s.cfg.RefreshTokenTTL)); err != nil {
		return nil, fmt.Errorf("failed to save new refresh token: %w", err)
	}

	return &model.TokenRefreshResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshRaw,
	}, nil
}

// Logout revokes all refresh tokens for the user.
func (s *AuthService) Logout(ctx context.Context, userID string) error {
	return s.repo.RevokeAllUserRefreshTokens(ctx, userID)
}

// VerifyAccessToken parses and validates an access token, returning the claims.
func (s *AuthService) VerifyAccessToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

// UpdateProfile updates a user's display name and/or avatar URL.
func (s *AuthService) UpdateProfile(ctx context.Context, userID string, req model.UpdateProfileRequest) (*model.User, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, serviceError(model.ErrCodeUserNotFound, "User not found")
	}

	displayName := user.DisplayName
	avatarURL := user.AvatarURL
	if req.DisplayName != nil {
		displayName = *req.DisplayName
	}
	if req.AvatarURL != nil {
		avatarURL = *req.AvatarURL
	}

	updated, err := s.repo.UpdateProfile(ctx, userID, displayName, avatarURL)
	if err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return updated, nil
}

// GetUser retrieves a user by ID.
func (s *AuthService) GetUser(ctx context.Context, userID string) (*model.User, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, serviceError(model.ErrCodeUserNotFound, "User not found")
	}
	return user, nil
}

// --- internal helpers ---

func (s *AuthService) validateRegistration(ctx context.Context, req model.RegisterRequest) error {
	if req.Email == "" || req.Password == "" || req.Username == "" {
		return serviceError(model.ErrCodeValidationError, "Email, password, and username are required")
	}

	if len(req.Password) < 8 {
		return serviceError(model.ErrCodeWeakPassword, "Password must be at least 8 characters")
	}

	if len(req.Username) < 3 || len(req.Username) > 30 {
		return serviceError(model.ErrCodeValidationError, "Username must be between 3 and 30 characters")
	}

	existing, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return fmt.Errorf("failed to check email: %w", err)
	}
	if existing != nil {
		return serviceError(model.ErrCodeEmailTaken, "Email is already registered")
	}

	existingU, err := s.repo.FindByUsername(ctx, req.Username)
	if err != nil {
		return fmt.Errorf("failed to check username: %w", err)
	}
	if existingU != nil {
		return serviceError(model.ErrCodeUsernameTaken, "Username is already taken")
	}

	return nil
}

func (s *AuthService) generateAccessToken(user *model.User) (string, error) {
	now := time.Now()
	claims := Claims{
		Sub:  user.ID,
		Role: string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.AccessTokenTTL)),
			Issuer:    "fusion-platform",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *AuthService) generateRefreshToken() (string, error) {
	return uuid.New().String() + "-" + uuid.New().String(), nil
}

// Hasher provides password and token hashing utilities.
type Hasher struct {
	cost int
}

func NewHasher() *Hasher {
	return &Hasher{cost: bcrypt.DefaultCost}
}

func (h *Hasher) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), h.cost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func (h *Hasher) CheckPassword(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (h *Hasher) HashToken(token string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// Claims represents the JWT access token claims.
type Claims struct {
	Sub  string `json:"sub"`
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// serviceError creates a model.APIError formatted as a standard error.
func serviceError(code, message string) error {
	return &model.APIError{Code: code, Message: message}
}