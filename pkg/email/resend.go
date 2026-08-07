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

// ResendConfig holds configuration for the Resend API.
type ResendConfig struct {
	APIKey    string `json:"api_key"`
	FromName  string `json:"from_name"`
	FromEmail string `json:"from_email"`
}

// ResendSender implements Sender using the Resend REST API.
type ResendSender struct {
	config ResendConfig
	client *http.Client
}

// NewResendSender creates a new Resend email sender.
func NewResendSender(cfg ResendConfig) *ResendSender {
	return &ResendSender{
		config: cfg,
		client: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:    10,
				IdleConnTimeout: 90 * time.Second,
			},
		},
	}
}

// resendSendRequest maps to the Resend emails send endpoint.
type resendSendRequest struct {
	From    string            `json:"from"`
	To      []string          `json:"to"`
	Subject string            `json:"subject"`
	Text    string            `json:"text,omitempty"`
	HTML    string            `json:"html,omitempty"`
	ReplyTo string            `json:"reply_to,omitempty"`
	Tags    []resendTag       `json:"tags,omitempty"`
}

type resendTag struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// resendResponse is the Resend API response envelope.
type resendResponse struct {
	ID      string `json:"id"`
	From    string `json:"from,omitempty"`
	To      string `json:"to,omitempty"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
	StatusCode int `json:"statusCode,omitempty"`
	Name    string `json:"name,omitempty"`
}

func (s *ResendSender) Send(ctx context.Context, req SendRequest) error {
	from := fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail)

	payload := resendSendRequest{
		From:    from,
		To:      []string{req.To},
		Subject: req.Subject,
		Text:    req.TextBody,
		HTML:    req.HTMLBody,
	}

	if req.ReplyTo != "" {
		payload.ReplyTo = req.ReplyTo
	}

	if req.Metadata != nil {
		for k, v := range req.Metadata {
			payload.Tags = append(payload.Tags, resendTag{Name: k, Value: v})
		}
	}

	return s.sendRequest(ctx, payload)
}

func (s *ResendSender) SendTemplate(ctx context.Context, req TemplateRequest) error {
	from := fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail)

	payload := resendSendRequest{
		From:    from,
		To:      []string{req.To},
		Subject: req.Template,
	}

	return s.sendRequest(ctx, payload)
}

func (s *ResendSender) sendRequest(ctx context.Context, payload resendSendRequest) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("resend: failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("resend: failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.config.APIKey)

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("resend: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		var resendErr resendResponse
		if json.Unmarshal(respBody, &resendErr) == nil && resendErr.Error != "" {
			return fmt.Errorf("resend: API error (HTTP %d): %s",
				resp.StatusCode, resendErr.Error)
		}
		return fmt.Errorf("resend: HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	slog.Debug("resend: email sent",
		"to", payload.To,
		"subject", payload.Subject,
	)

	return nil
}