package model

import "time"

// EmailTemplate represents an email template stored in the database.
type EmailTemplate struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Subject     string    `json:"subject"`
	TextBody    string    `json:"textBody"`
	HTMLBody    string    `json:"htmlBody"`
	Variables   []string  `json:"variables"`
	IsSystem    bool      `json:"isSystem"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CreateTemplateRequest is the request body for creating a new template.
type CreateTemplateRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description,omitempty"`
	Subject     string   `json:"subject"`
	TextBody    string   `json:"textBody"`
	HTMLBody    string   `json:"htmlBody"`
	Variables   []string `json:"variables,omitempty"`
}

// UpdateTemplateRequest is the request body for updating a template.
type UpdateTemplateRequest struct {
	Name        *string   `json:"name,omitempty"`
	Description *string   `json:"description,omitempty"`
	Subject     *string   `json:"subject,omitempty"`
	TextBody    *string   `json:"textBody,omitempty"`
	HTMLBody    *string   `json:"htmlBody,omitempty"`
	Variables   *[]string `json:"variables,omitempty"`
}

// PreviewRequest is the request body for previewing a rendered template.
type PreviewRequest struct {
	Variables map[string]string `json:"variables"`
}

// EmailLogEntry represents a logged email send attempt.
type EmailLogEntry struct {
	ID         string            `json:"id"`
	ToEmail    string            `json:"toEmail"`
	Subject    string            `json:"subject"`
	ProviderID *string           `json:"providerId,omitempty"`
	TemplateID *string           `json:"templateId,omitempty"`
	Status     string            `json:"status"`
	Error      *string           `json:"error,omitempty"`
	Metadata   map[string]string `json:"metadata,omitempty"`
	SentAt     time.Time         `json:"sentAt"`
}

// SendEmailRequest is the request body for sending a transactional email.
type SendEmailRequest struct {
	To       string            `json:"to"`
	Subject  string            `json:"subject"`
	TextBody string            `json:"textBody"`
	HTMLBody string            `json:"htmlBody"`
	ReplyTo  string            `json:"replyTo,omitempty"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

// SendTemplateRequest is the request body for sending a template email.
type SendTemplateRequest struct {
	To        string            `json:"to"`
	Template  string            `json:"template"`
	Variables map[string]string `json:"variables"`
	ReplyTo   string            `json:"replyTo,omitempty"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}