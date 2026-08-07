package email

import (
	"context"
	"fmt"
	"log/slog"
)

// ConsoleSender implements Sender by logging to stdout.
// Used in development — never in production.
type ConsoleSender struct {
	FromName  string
	FromEmail string
}

func NewConsoleSender(fromName, fromEmail string) *ConsoleSender {
	return &ConsoleSender{FromName: fromName, FromEmail: fromEmail}
}

func (s *ConsoleSender) Send(ctx context.Context, req SendRequest) error {
	slog.Info("📧 EMAIL (console)",
		"from", fmt.Sprintf("%s <%s>", s.FromName, s.FromEmail),
		"to", req.To,
		"subject", req.Subject,
	)
	slog.Info("text body", "body", req.TextBody)
	return nil
}

func (s *ConsoleSender) SendTemplate(ctx context.Context, req TemplateRequest) error {
	slog.Info("📧 EMAIL TEMPLATE (console)",
		"from", fmt.Sprintf("%s <%s>", s.FromName, s.FromEmail),
		"to", req.To,
		"template", req.Template,
		"variables", req.Variables,
	)
	return nil
}