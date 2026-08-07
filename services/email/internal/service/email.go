package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/fusion-platform/email/internal/model"
	"github.com/fusion-platform/email/internal/repository"
	"github.com/fusion-platform/pkg/email"
)

// EmailService handles sending emails through configured providers.
type EmailService struct {
	repo       *repository.EmailRepository
	multi      *email.MultiProvider
	mu         sync.RWMutex
	providerMap map[string]*model.EmailProvider // providerID -> provider
}

// NewEmailService creates a new EmailService, loading active providers from the database.
func NewEmailService(ctx context.Context, repo *repository.EmailRepository) (*EmailService, error) {
	svc := &EmailService{
		repo:        repo,
		multi:       email.NewMultiProvider(email.StrategyPrimaryFallback),
		providerMap: make(map[string]*model.EmailProvider),
	}

	if err := svc.loadProviders(ctx); err != nil {
		slog.Warn("failed to load email providers on startup", "error", err)
	}

	return svc, nil
}

// loadProviders loads all active providers from the database and instantiates them.
func (s *EmailService) loadProviders(ctx context.Context) error {
	providers, err := s.repo.ListActiveProviders(ctx)
	if err != nil {
		return fmt.Errorf("load providers: %w", err)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Clear existing senders and rebuild
	for _, ws := range s.multi.Senders() {
		s.multi.RemoveSender(ws.Name)
	}
	s.providerMap = make(map[string]*model.EmailProvider)

	for _, p := range providers {
		sender, err := s.instantiateProvider(p)
		if err != nil {
			slog.Error("failed to instantiate provider", "name", p.Name, "type", p.ProviderType, "error", err)
			continue
		}

		s.multi.AddSender(p.Name, sender, p.Weight)
		s.providerMap[p.ID] = &p
		slog.Info("loaded email provider", "name", p.Name, "type", p.ProviderType)
	}

	return nil
}

// instantiateProvider creates the appropriate Sender for a provider type.
func (s *EmailService) instantiateProvider(p model.EmailProvider) (email.Sender, error) {
	switch p.ProviderType {
	case model.ProviderTypeConsole:
		return email.NewConsoleSender(p.FromName, p.FromEmail), nil

	case model.ProviderTypeSMTP:
		cfg := email.SMTPConfig{
			Host:      getConfigString(p.Config, "host"),
			Port:      getConfigString(p.Config, "port"),
			Username:  getConfigString(p.Config, "username"),
			Password:  getConfigString(p.Config, "password"),
			FromName:  p.FromName,
			FromEmail: p.FromEmail,
			UseTLS:    getConfigBool(p.Config, "use_tls"),
		}
		return email.NewSMTPSender(cfg), nil

	case model.ProviderTypeBrevo:
		cfg := email.BrevoConfig{
			APIKey:    getConfigString(p.Config, "api_key"),
			FromName:  p.FromName,
			FromEmail: p.FromEmail,
		}
		return email.NewBrevoSender(cfg), nil

	case model.ProviderTypeSendPulse:
		cfg := email.SendPulseConfig{
			ClientID:  getConfigString(p.Config, "client_id"),
			Secret:    getConfigString(p.Config, "secret"),
			FromName:  p.FromName,
			FromEmail: p.FromEmail,
		}
		return email.NewSendPulseSender(cfg), nil

	default:
		return nil, fmt.Errorf("unknown provider type: %s", p.ProviderType)
	}
}

// SendEmail sends a transactional email using the configured strategy.
func (s *EmailService) SendEmail(ctx context.Context, req model.SendEmailRequest) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sendReq := email.SendRequest{
		To:       req.To,
		Subject:  req.Subject,
		TextBody: req.TextBody,
		HTMLBody: req.HTMLBody,
		ReplyTo:  req.ReplyTo,
		Metadata: req.Metadata,
	}

	err := s.multi.Send(ctx, sendReq)

	// Log the attempt
	status := "sent"
	var errStr *string
	if err != nil {
		status = "failed"
		errMsg := err.Error()
		errStr = &errMsg
	}

	logEntry := model.EmailLogEntry{
		ToEmail:  req.To,
		Subject:  req.Subject,
		Status:   status,
		Error:    errStr,
		Metadata: req.Metadata,
		SentAt:   time.Now(),
	}

	if logErr := s.repo.LogEmail(ctx, logEntry); logErr != nil {
		slog.Error("failed to log email", "error", logErr)
	}

	return err
}

// SendTemplate sends a template-based email.
func (s *EmailService) SendTemplate(ctx context.Context, req model.SendTemplateRequest) error {
	// Look up the template
	tmpl, err := s.repo.GetTemplateByName(ctx, req.Template)
	if err != nil || tmpl == nil {
		return fmt.Errorf("template not found: %s", req.Template)
	}

	// Validate variables
	for _, v := range tmpl.Variables {
		if _, ok := req.Variables[v]; !ok {
			return fmt.Errorf("missing required variable: %s", v)
		}
	}

	// Render template
	subject := renderTemplateString(tmpl.Subject, req.Variables)
	textBody := renderTemplateString(tmpl.TextBody, req.Variables)
	htmlBody := renderTemplateString(tmpl.HTMLBody, req.Variables)

	sendReq := email.SendRequest{
		To:       req.To,
		Subject:  subject,
		TextBody: textBody,
		HTMLBody: htmlBody,
		ReplyTo:  req.ReplyTo,
		Metadata: req.Metadata,
	}

	s.mu.RLock()
	err = s.multi.Send(ctx, sendReq)
	s.mu.RUnlock()

	// Log the attempt
	status := "sent"
	var errStr *string
	if err != nil {
		status = "failed"
		errMsg := err.Error()
		errStr = &errMsg
	}

	logEntry := model.EmailLogEntry{
		ToEmail:    req.To,
		Subject:    subject,
		Status:     status,
		Error:      errStr,
		TemplateID: &tmpl.ID,
		Metadata:   req.Metadata,
		SentAt:     time.Now(),
	}

	if logErr := s.repo.LogEmail(ctx, logEntry); logErr != nil {
		slog.Error("failed to log email", "error", logErr)
	}

	return err
}

// ReloadProviders reloads all active providers from the database.
func (s *EmailService) ReloadProviders(ctx context.Context) error {
	return s.loadProviders(ctx)
}

// GetStrategy returns the current strategy.
func (s *EmailService) GetStrategy() email.Strategy {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return email.StrategyPrimaryFallback
}

// ─── Helpers ───────────────────────────────────────────────────

func getConfigString(config map[string]any, key string) string {
	if config == nil {
		return ""
	}
	if v, ok := config[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func getConfigBool(config map[string]any, key string) bool {
	if config == nil {
		return false
	}
	if v, ok := config[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
		if s, ok := v.(string); ok {
			return strings.ToLower(s) == "true"
		}
	}
	return false
}

func renderTemplateString(tmpl string, vars map[string]string) string {
	result := tmpl
	for k, v := range vars {
		result = strings.ReplaceAll(result, "{{"+k+"}}", v)
	}
	return result
}