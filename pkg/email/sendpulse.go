package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

// SendPulseConfig holds configuration for the SendPulse API.
type SendPulseConfig struct {
	ClientID  string `json:"client_id"`
	Secret    string `json:"secret"`
	FromName  string `json:"from_name"`
	FromEmail string `json:"from_email"`
}

// SendPulseSender implements Sender using the SendPulse REST API with OAuth2.
type SendPulseSender struct {
	config    SendPulseConfig
	client    *http.Client
	mu        sync.Mutex
	accessToken string
	tokenExpiry  time.Time
}

// NewSendPulseSender creates a new SendPulse email sender.
func NewSendPulseSender(cfg SendPulseConfig) *SendPulseSender {
	return &SendPulseSender{
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

// sendPulseTokenResponse is the OAuth2 token response from SendPulse.
type sendPulseTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// sendPulseEmailRequest maps to the SendPulse SMTP email endpoint.
type sendPulseEmailRequest struct {
	Email   sendPulseEmailData `json:"email"`
	From    sendPulseAddress   `json:"from"`
	To      sendPulseAddress   `json:"to"`
	Subject string             `json:"subject"`
	Text    string             `json:"text,omitempty"`
	HTML    string             `json:"html,omitempty"`
}

type sendPulseAddress struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type sendPulseEmailData struct {
	HTML string `json:"html"`
	Text string `json:"text"`
}

// sendPulseResponse is the generic SendPulse API response.
type sendPulseResponse struct {
	Result        bool   `json:"result"`
	ErrorCode     int    `json:"error_code,omitempty"`
	ErrorMessage  string `json:"error_message,omitempty"`
	ID            string `json:"id,omitempty"`
}

func (s *SendPulseSender) getAccessToken(ctx context.Context) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Return cached token if still valid (with 5 min buffer)
	if s.accessToken != "" && time.Now().Before(s.tokenExpiry.Add(-5*time.Minute)) {
		return s.accessToken, nil
	}

	payload := map[string]string{
		"grant_type": "client_credentials",
		"client_id":  s.config.ClientID,
		"client_secret": s.config.Secret,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("sendpulse: failed to marshal token request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.sendpulse.com/oauth/access_token", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("sendpulse: failed to create token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("sendpulse: token request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("sendpulse: token error (HTTP %d): %s",
			resp.StatusCode, string(respBody))
	}

	var tokenResp sendPulseTokenResponse
	if err := json.Unmarshal(respBody, &tokenResp); err != nil {
		return "", fmt.Errorf("sendpulse: failed to parse token response: %w", err)
	}

	s.accessToken = tokenResp.AccessToken
	s.tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)

	return s.accessToken, nil
}

func (s *SendPulseSender) Send(ctx context.Context, req SendRequest) error {
	payload := sendPulseEmailRequest{
		Email: sendPulseEmailData{
			HTML: req.HTMLBody,
			Text: req.TextBody,
		},
		From: sendPulseAddress{
			Name:  s.config.FromName,
			Email: s.config.FromEmail,
		},
		To: sendPulseAddress{
			Name:  req.To,
			Email: req.To,
		},
		Subject: req.Subject,
	}

	return s.sendWithRetry(ctx, payload)
}

func (s *SendPulseSender) SendTemplate(ctx context.Context, req TemplateRequest) error {
	payload := sendPulseEmailRequest{
		Email: sendPulseEmailData{
			HTML: fmt.Sprintf("<html><body>Template: %s<br>Variables: %v</body></html>",
				req.Template, req.Variables),
			Text: fmt.Sprintf("Template: %s\nVariables: %v", req.Template, req.Variables),
		},
		From: sendPulseAddress{
			Name:  s.config.FromName,
			Email: s.config.FromEmail,
		},
		To: sendPulseAddress{
			Name:  req.To,
			Email: req.To,
		},
		Subject: req.Template,
	}

	return s.sendWithRetry(ctx, payload)
}

func (s *SendPulseSender) sendWithRetry(ctx context.Context, payload sendPulseEmailRequest) error {
	token, err := s.getAccessToken(ctx)
	if err != nil {
		return err
	}

	err = s.sendRequest(ctx, token, payload)
	if err != nil && isSendPulseTokenExpired(err) {
		s.mu.Lock()
		s.accessToken = ""
		s.tokenExpiry = time.Time{}
		s.mu.Unlock()

		// Retry with new token
		token, err = s.getAccessToken(ctx)
		if err != nil {
			return err
		}
		return s.sendRequest(ctx, token, payload)
	}

	return err
}

func (s *SendPulseSender) sendRequest(ctx context.Context, token string, payload sendPulseEmailRequest) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("sendpulse: failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.sendpulse.com/smtp/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("sendpulse: failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("sendpulse: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		return fmt.Errorf("sendpulse: token expired (HTTP 401)")
	}

	if resp.StatusCode >= 400 {
		var spResp sendPulseResponse
		if json.Unmarshal(respBody, &spResp) == nil {
			return fmt.Errorf("sendpulse: API error (HTTP %d): %s",
				resp.StatusCode, spResp.ErrorMessage)
		}
		return fmt.Errorf("sendpulse: HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	slog.Debug("sendpulse: email sent",
		"to", payload.To.Email,
		"subject", payload.Subject,
	)

	return nil
}

func isSendPulseTokenExpired(err error) bool {
	return err != nil && containsString(err.Error(), "token expired")
}

func containsString(s, substr string) bool {
	return len(s) >= len(substr) && containsStringHelper(s, substr)
}

func containsStringHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}