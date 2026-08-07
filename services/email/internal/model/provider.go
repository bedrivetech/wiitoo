package model

import "time"

// ProviderType enumerates supported email provider types.
type ProviderType string

const (
	ProviderTypeBrevo     ProviderType = "brevo"
	ProviderTypeSendPulse ProviderType = "sendpulse"
	ProviderTypeSMTP      ProviderType = "smtp"
	ProviderTypeConsole   ProviderType = "console"
)

// EmailProvider represents a configured email provider stored in the database.
type EmailProvider struct {
	ID             string       `json:"id"`
	Name           string       `json:"name"`
	ProviderType   ProviderType `json:"providerType"`
	Config         map[string]any `json:"config"`
	Priority       int          `json:"priority"`
	IsActive       bool         `json:"isActive"`
	Weight         int          `json:"weight"`
	LastHealthCheck *time.Time  `json:"lastHealthCheck,omitempty"`
	IsHealthy      bool         `json:"isHealthy"`
	FromName       string       `json:"fromName"`
	FromEmail      string       `json:"fromEmail"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
}

// CreateProviderRequest is the request body for adding a new provider.
type CreateProviderRequest struct {
	Name         string         `json:"name"`
	ProviderType ProviderType   `json:"providerType"`
	Config       map[string]any `json:"config"`
	Priority     int            `json:"priority,omitempty"`
	Weight       int            `json:"weight,omitempty"`
	FromName     string         `json:"fromName"`
	FromEmail    string         `json:"fromEmail"`
}

// UpdateProviderRequest is the request body for updating a provider.
type UpdateProviderRequest struct {
	Name         *string         `json:"name,omitempty"`
	ProviderType *ProviderType   `json:"providerType,omitempty"`
	Config       *map[string]any `json:"config,omitempty"`
	Priority     *int            `json:"priority,omitempty"`
	IsActive     *bool           `json:"isActive,omitempty"`
	Weight       *int            `json:"weight,omitempty"`
	FromName     *string         `json:"fromName,omitempty"`
	FromEmail    *string         `json:"fromEmail,omitempty"`
}

// TestEmailRequest is the request body for sending a test email.
type TestEmailRequest struct {
	To string `json:"to"`
}