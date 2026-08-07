package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"
)

// BrevoConfig holds configuration for the Brevo (Sendinblue) API.
type BrevoConfig struct {
	APIKey    string `json:"api_key"`
	FromName  string `json:"from_name"`
	FromEmail string `json:"from_email"`
}

// BrevoSender implements Sender using the Brevo (Sendinblue) REST API.
type BrevoSender struct {
	config BrevoConfig
	client *http.Client
}

// NewBrevoSender creates a new Brevo email sender.
func NewBrevoSender(cfg BrevoConfig) *BrevoSender {
	return &BrevoSender{
		config: cfg,
		client: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        10,
				IdleConnTimeout:     90 * time.Second,
				DisableCompression:  false,
			},
		},
	}
}

// brevoSendEmailRequest maps to the Brevo SendTransactionalEmail endpoint.
type brevoSendEmailRequest struct {
	Sender      *brevoSender       `json:"sender"`
	To          []brevoRecipient   `json:"to"`
	Subject     string             `json:"subject"`
	TextContent string             `json:"textContent,omitempty"`
	HTMLContent string             `json:"htmlContent,omitempty"`
	ReplyTo     *brevoRecipient    `json:"replyTo,omitempty"`
	Headers     map[string]string  `json:"headers,omitempty"`
	Tags        []string           `json:"tags,omitempty"`
}

type brevoSender struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type brevoRecipient struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

// brevoResponse is the standard Brevo API response envelope.
type brevoResponse struct {
	MessageID string `json:"messageId"`
	Code      string `json:"code"`
	Message   string `json:"message"`
}

func (s *BrevoSender) Send(ctx context.Context, req SendRequest) error {
	payload := brevoSendEmailRequest{
		Sender: &brevoSender{
			Name:  s.config.FromName,
			Email: s.config.FromEmail,
		},
		To: []brevoRecipient{
			{Email: req.To},
		},
		Subject:     req.Subject,
		TextContent: req.TextBody,
		HTMLContent: req.HTMLBody,
	}

	if req.ReplyTo != "" {
		payload.ReplyTo = &brevoRecipient{Email: req.ReplyTo}
	}

	if req.Metadata != nil {
		payload.Headers = req.Metadata
	}

	return s.sendRequest(ctx, payload)
}

func (s *BrevoSender) SendTemplate(ctx context.Context, req TemplateRequest) error {
	payload := brevoSendEmailRequest{
		Sender: &brevoSender{
			Name:  s.config.FromName,
			Email: s.config.FromEmail,
		},
		To: []brevoRecipient{
			{Email: req.To},
		},
		Subject: req.Template,
	}

	if req.ReplyTo != "" {
		payload.ReplyTo = &brevoRecipient{Email: req.ReplyTo}
	}

	if req.Variables != nil {
		payload.Headers = req.Variables
	}

	return s.sendRequest(ctx, payload)
}

func (s *BrevoSender) sendRequest(ctx context.Context, payload brevoSendEmailRequest) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("brevo: failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.brevo.com/v3/smtp/email", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("brevo: failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("api-key", s.config.APIKey)

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("brevo: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		var brevoErr brevoResponse
		if json.Unmarshal(respBody, &brevoErr) == nil {
			return fmt.Errorf("brevo: API error (HTTP %d): %s - %s",
				resp.StatusCode, brevoErr.Code, brevoErr.Message)
		}
		return fmt.Errorf("brevo: HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	slog.Debug("brevo: email sent",
		"to", payload.To,
		"subject", payload.Subject,
		"messageId", string(respBody),
	)

	return nil
}