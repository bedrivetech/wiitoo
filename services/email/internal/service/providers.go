package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/bedrivetech/wiitoo/services/email/internal/model"
	"github.com/bedrivetech/wiitoo/services/email/internal/repository"
	"github.com/bedrivetech/wiitoo/pkg/email"
)

// ProviderService handles CRUD operations for email providers.
type ProviderService struct {
	repo        *repository.EmailRepository
	emailSvc    *EmailService
}

// NewProviderService creates a new ProviderService.
func NewProviderService(repo *repository.EmailRepository, emailSvc *EmailService) *ProviderService {
	return &ProviderService{
		repo:     repo,
		emailSvc: emailSvc,
	}
}

// ListProviders returns all email providers.
func (s *ProviderService) ListProviders(ctx context.Context) ([]model.EmailProvider, error) {
	return s.repo.ListProviders(ctx)
}

// GetProvider returns a single provider by ID.
func (s *ProviderService) GetProvider(ctx context.Context, id string) (*model.EmailProvider, error) {
	return s.repo.GetProvider(ctx, id)
}

// CreateProvider creates a new email provider and reloads the provider pool.
func (s *ProviderService) CreateProvider(ctx context.Context, req model.CreateProviderRequest) (*model.EmailProvider, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("provider name is required")
	}
	if req.FromEmail == "" {
		return nil, fmt.Errorf("from_email is required")
	}

	// Validate provider type
	switch req.ProviderType {
	case model.ProviderTypeBrevo, model.ProviderTypeSendPulse, model.ProviderTypeSMTP, model.ProviderTypeConsole:
		// valid
	default:
		return nil, fmt.Errorf("invalid provider type: %s", req.ProviderType)
	}

	// Validate required config fields per type
	if err := validateProviderConfig(req.ProviderType, req.Config); err != nil {
		return nil, err
	}

	provider, err := s.repo.CreateProvider(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("create provider: %w", err)
	}

	// Reload provider pool
	if err := s.emailSvc.ReloadProviders(ctx); err != nil {
		slog.Error("failed to reload providers after create", "error", err)
	}

	return provider, nil
}

// UpdateProvider updates an existing provider and reloads the provider pool.
func (s *ProviderService) UpdateProvider(ctx context.Context, id string, req model.UpdateProviderRequest) (*model.EmailProvider, error) {
	provider, err := s.repo.UpdateProvider(ctx, id, req)
	if err != nil {
		return nil, err
	}
	if provider == nil {
		return nil, nil
	}

	// Reload provider pool
	if err := s.emailSvc.ReloadProviders(ctx); err != nil {
		slog.Error("failed to reload providers after update", "error", err)
	}

	return provider, nil
}

// DeleteProvider removes a provider and reloads the pool.
func (s *ProviderService) DeleteProvider(ctx context.Context, id string) error {
	if err := s.repo.DeleteProvider(ctx, id); err != nil {
		return fmt.Errorf("delete provider: %w", err)
	}

	// Reload provider pool
	if err := s.emailSvc.ReloadProviders(ctx); err != nil {
		slog.Error("failed to reload providers after delete", "error", err)
	}

	return nil
}

// TestProvider sends a test email through a specific provider.
func (s *ProviderService) TestProvider(ctx context.Context, id, toEmail string) error {
	provider, err := s.repo.GetProvider(ctx, id)
	if err != nil {
		return fmt.Errorf("get provider for test: %w", err)
	}
	if provider == nil {
		return fmt.Errorf("provider not found")
	}

	sender, err := s.emailSvc.instantiateProvider(*provider)
	if err != nil {
		return fmt.Errorf("instantiate provider for test: %w", err)
	}

	testReq := email.SendRequest{
		To:       toEmail,
		Subject:  "Test email from " + provider.Name,
		TextBody: "This is a test email to verify your email provider configuration.\n\nSent at: " + provider.CreatedAt.String(),
		HTMLBody: "<h2>Test Email</h2><p>This is a test email to verify your email provider configuration.</p>",
	}

	if err := sender.Send(ctx, testReq); err != nil {
		// Mark as unhealthy
		s.repo.UpdateProviderHealth(ctx, id, false)
		return fmt.Errorf("test email failed: %w", err)
	}

	// Mark as healthy
	s.repo.UpdateProviderHealth(ctx, id, true)
	return nil
}

func validateProviderConfig(providerType model.ProviderType, config map[string]any) error {
	switch providerType {
	case model.ProviderTypeBrevo:
		if getConfigString(config, "api_key") == "" {
			return fmt.Errorf("api_key is required for Brevo providers")
		}
	case model.ProviderTypeSendPulse:
		if getConfigString(config, "client_id") == "" {
			return fmt.Errorf("client_id is required for SendPulse providers")
		}
		if getConfigString(config, "secret") == "" {
			return fmt.Errorf("secret is required for SendPulse providers")
		}
	case model.ProviderTypeSMTP:
		if getConfigString(config, "host") == "" {
			return fmt.Errorf("host is required for SMTP providers")
		}
		if getConfigString(config, "port") == "" {
			return fmt.Errorf("port is required for SMTP providers")
		}
	}
	return nil
}