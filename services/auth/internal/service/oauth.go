package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/fusion-platform/auth/internal/config"
	"github.com/fusion-platform/auth/internal/model"
	"github.com/fusion-platform/auth/internal/repository"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/twitch"
)

// OAuthService handles social login via Goth.
type OAuthService struct {
	repo *repository.UserRepository
	auth *AuthService
	cfg  *config.Config
}

func NewOAuthService(repo *repository.UserRepository, auth *AuthService, cfg *config.Config) *OAuthService {
	return &OAuthService{
		repo: repo,
		auth: auth,
		cfg:  cfg,
	}
}

// InitProviders registers OAuth providers with Goth.
func (s *OAuthService) InitProviders() {
	goth.UseProviders(
		google.New(s.cfg.GoogleClientID, s.cfg.GoogleClientSecret, s.cfg.GoogleRedirectURL, "email", "profile"),
		twitch.New(s.cfg.TwitchClientID, s.cfg.TwitchClientSecret, s.cfg.TwitchRedirectURL, "user:read:email"),
	)
	slog.Info("OAuth providers initialized", "providers", []string{"google", "twitch"})
}

// GetProviderURL returns the auth URL for the given provider.
func (s *OAuthService) GetProviderURL(provider string) (string, error) {
	// gothic handles this via session — this is a placeholder for the middleware-driven flow.
	return "", nil
}

// HandleCallback processes the OAuth callback from a provider.
// If the user already exists (linked OAuth), log them in.
// If the OAuth account is new but the email matches an existing user, link accounts.
// Otherwise, create a new user.
func (s *OAuthService) HandleCallback(ctx context.Context, provider string, gothUser goth.User) (*model.AuthResponse, error) {
	// Check if OAuth account already exists
	existingOAuth, err := s.repo.FindOAuthAccount(ctx, provider, gothUser.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to find OAuth account: %w", err)
	}

	if existingOAuth != nil {
		// Existing link — log in as that user
		user, err := s.repo.FindByID(ctx, existingOAuth.UserID)
		if err != nil {
			return nil, fmt.Errorf("failed to find user: %w", err)
		}
		if user == nil {
			return nil, serviceError(model.ErrCodeUserNotFound, "Linked user not found")
		}

		// Update tokens
		_, err = s.repo.CreateOAuthAccount(ctx, user.ID, provider, gothUser.UserID,
			gothUser.AccessToken, gothUser.RefreshToken, &gothUser.ExpiresAt)
		if err != nil {
			slog.Warn("failed to update OAuth tokens", "error", err)
		}

		return s.auth.GenerateTokens(ctx, user)
	}

	// No existing link — try to find user by email
	if gothUser.Email != "" {
		existingUser, err := s.repo.FindByEmail(ctx, gothUser.Email)
		if err != nil {
			return nil, fmt.Errorf("failed to find user by email: %w", err)
		}

		if existingUser != nil {
			// Link OAuth to existing user
			_, err = s.repo.CreateOAuthAccount(ctx, existingUser.ID, provider, gothUser.UserID,
				gothUser.AccessToken, gothUser.RefreshToken, &gothUser.ExpiresAt)
			if err != nil {
				return nil, fmt.Errorf("failed to link OAuth account: %w", err)
			}

			// Auto-verify email if not verified
			if !existingUser.IsEmailVerified() {
				if err := s.repo.VerifyEmail(ctx, existingUser.ID); err != nil {
					slog.Warn("failed to auto-verify email after OAuth link", "error", err)
				}
			}

			return s.auth.GenerateTokens(ctx, existingUser)
		}
	}

	// Create new user
	username := generateUsername(gothUser)
	displayName := gothUser.Name
	if displayName == "" {
		displayName = gothUser.NickName
	}
	if displayName == "" {
		displayName = username
	}

	// Generate a random password (user will need to use OAuth to log in)
	randomPass, _ := generateRandomDigits(32)

	user, err := s.repo.Create(ctx, gothUser.Email, randomPass, username)
	if err != nil {
		return nil, fmt.Errorf("failed to create user from OAuth: %w", err)
	}

	// Link OAuth account
	_, err = s.repo.CreateOAuthAccount(ctx, user.ID, provider, gothUser.UserID,
		gothUser.AccessToken, gothUser.RefreshToken, &gothUser.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed to save OAuth account: %w", err)
	}

	// Auto-verify email (trust OAuth provider's verification)
	if err := s.repo.VerifyEmail(ctx, user.ID); err != nil {
		slog.Warn("failed to auto-verify email after OAuth creation", "error", err)
	}

	// Update display name
	_, err = s.repo.UpdateProfile(ctx, user.ID, displayName, gothUser.AvatarURL)
	if err != nil {
		slog.Warn("failed to update profile from OAuth", "error", err)
	}

	user, err = s.repo.FindByID(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve created user: %w", err)
	}

	return s.auth.GenerateTokens(ctx, user)
}

func generateUsername(gothUser goth.User) string {
	if gothUser.NickName != "" {
		return gothUser.NickName
	}
	if gothUser.Name != "" {
		return sanitizeUsername(gothUser.Name)
	}
	// Fallback to email prefix
	for i, c := range gothUser.Email {
		if c == '@' {
			return sanitizeUsername(gothUser.Email[:i])
		}
	}
	return fmt.Sprintf("user_%s", gothUser.UserID[:8])
}

func sanitizeUsername(name string) string {
	// Basic sanitization: lowercase, replace spaces with underscores
	result := make([]byte, 0, len(name))
	for _, c := range []byte(name) {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_' || c == '-' {
			result = append(result, c)
		} else if c >= 'A' && c <= 'Z' {
			result = append(result, c+32) // to lowercase
		} else if c == ' ' {
			result = append(result, '_')
		}
	}
	if len(result) == 0 {
		return "user"
	}
	return string(result)
}

// Helper to access goth user from context via gothic.
// The actual gothic middleware handles session and user extraction.
func (s *OAuthService) GetGothUser(ctx context.Context) (goth.User, error) {
	return gothic.CompleteUserAuth(nil, nil) // requires http.ResponseWriter and *http.Request
}