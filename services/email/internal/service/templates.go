package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/bedrivetech/wiitoo/services/email/internal/model"
	"github.com/bedrivetech/wiitoo/services/email/internal/repository"
)

// TemplateService handles CRUD and rendering for email templates.
type TemplateService struct {
	repo *repository.EmailRepository
}

// NewTemplateService creates a new TemplateService.
func NewTemplateService(repo *repository.EmailRepository) *TemplateService {
	return &TemplateService{repo: repo}
}

// ListTemplates returns all email templates.
func (s *TemplateService) ListTemplates(ctx context.Context) ([]model.EmailTemplate, error) {
	return s.repo.ListTemplates(ctx)
}

// GetTemplate returns a single template by ID.
func (s *TemplateService) GetTemplate(ctx context.Context, id string) (*model.EmailTemplate, error) {
	return s.repo.GetTemplate(ctx, id)
}

// CreateTemplate creates a new email template.
func (s *TemplateService) CreateTemplate(ctx context.Context, req model.CreateTemplateRequest) (*model.EmailTemplate, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("template name is required")
	}
	if req.Subject == "" {
		return nil, fmt.Errorf("template subject is required")
	}
	if req.TextBody == "" && req.HTMLBody == "" {
		return nil, fmt.Errorf("template must have at least a text body or HTML body")
	}

	// Extract variables from template content if not provided
	if req.Variables == nil {
		req.Variables = extractVariables(req.Subject, req.TextBody, req.HTMLBody)
	}

	return s.repo.CreateTemplate(ctx, req)
}

// UpdateTemplate updates an existing template.
func (s *TemplateService) UpdateTemplate(ctx context.Context, id string, req model.UpdateTemplateRequest) (*model.EmailTemplate, error) {
	return s.repo.UpdateTemplate(ctx, id, req)
}

// DeleteTemplate deletes a template.
func (s *TemplateService) DeleteTemplate(ctx context.Context, id string) error {
	return s.repo.DeleteTemplate(ctx, id)
}

// PreviewTemplate renders a template with sample variables.
func (s *TemplateService) PreviewTemplate(ctx context.Context, id string, variables map[string]string) (*model.EmailTemplate, error) {
	tmpl, err := s.repo.GetTemplate(ctx, id)
	if err != nil {
		return nil, err
	}
	if tmpl == nil {
		return nil, fmt.Errorf("template not found")
	}

	// Render subject and body with provided variables
	rendered := *tmpl
	rendered.Subject = renderTemplateString(tmpl.Subject, variables)
	rendered.TextBody = renderTemplateString(tmpl.TextBody, variables)
	rendered.HTMLBody = renderTemplateString(tmpl.HTMLBody, variables)

	return &rendered, nil
}

// extractVariables finds all {{variable}} patterns in template content.
func extractVariables(subject, textBody, htmlBody string) []string {
	seen := make(map[string]bool)
	extractFrom := subject + " " + textBody + " " + htmlBody

	parts := strings.Split(extractFrom, "{{")
	for _, part := range parts[1:] {
		if idx := strings.Index(part, "}}"); idx > 0 {
			varName := strings.TrimSpace(part[:idx])
			if varName != "" {
				seen[varName] = true
			}
		}
	}

	var result []string
	for v := range seen {
		result = append(result, v)
	}
	return result
}