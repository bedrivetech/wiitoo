package provider

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/bedrivetech/wiitoo/pkg/payment"
)

// PaddleProvider implements payment.Provider for Paddle (Merchant of Record).
type PaddleProvider struct {
	apiKey     string
	webhookKey string
	baseURL    string
	httpClient *http.Client
}

// NewPaddleProvider creates a new Paddle payment provider.
func NewPaddleProvider(apiKey, webhookKey, environment string) *PaddleProvider {
	baseURL := "https://api.paddle.com"
	if environment == "sandbox" {
		baseURL = "https://sandbox-api.paddle.com"
	}
	return &PaddleProvider{
		apiKey:     apiKey,
		webhookKey: webhookKey,
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (p *PaddleProvider) Name() string { return "paddle" }

func (p *PaddleProvider) CreateCheckout(ctx context.Context, req payment.CheckoutRequest) (*payment.CheckoutResponse, error) {
	body := map[string]any{
		"items": []map[string]any{
			{
				"price": map[string]any{
					"currency_code": req.Currency,
					"unit_price": map[string]any{
						"amount": fmt.Sprintf("%.2f", req.Amount),
						"currency_code": req.Currency,
					},
				},
				"quantity": 1,
			},
		},
		"custom_data": req.Metadata,
	}

	if req.SuccessURL != "" {
		body["success_url"] = req.SuccessURL
	}
	if req.CancelURL != "" {
		body["cancel_url"] = req.CancelURL
	}
	if req.Customer.Email != "" {
		body["customer"] = map[string]any{
			"email":    req.Customer.Email,
			"name":     req.Customer.Name,
		}
	}

	resp, err := p.doRequest(ctx, "POST", "/transactions", body)
	if err != nil {
		return nil, err
	}

	transactionID, _ := resp["id"].(string)
	checkoutURL, _ := resp["urls"].(map[string]any)["checkout"].(string)

	return &payment.CheckoutResponse{
		CheckoutURL:   checkoutURL,
		TransactionID: transactionID,
	}, nil
}

func (p *PaddleProvider) CreateSubscription(ctx context.Context, req payment.SubscriptionRequest) (*payment.SubscriptionResponse, error) {
	body := map[string]any{
		"items": []map[string]any{
			{
				"price_id": req.PlanID,
				"quantity": 1,
			},
		},
		"customer": map[string]any{
			"email": req.Customer.Email,
			"name":  req.Customer.Name,
		},
		"custom_data": req.Metadata,
	}

	if req.SuccessURL != "" {
		body["success_url"] = req.SuccessURL
	}
	if req.CancelURL != "" {
		body["cancel_url"] = req.CancelURL
	}

	resp, err := p.doRequest(ctx, "POST", "/subscriptions", body)
	if err != nil {
		return nil, err
	}

	subID, _ := resp["id"].(string)
	status, _ := resp["status"].(string)

	return &payment.SubscriptionResponse{
		SubscriptionID: subID,
		Status:         status,
	}, nil
}

func (p *PaddleProvider) CancelSubscription(ctx context.Context, subscriptionID string) error {
	_, err := p.doRequest(ctx, "POST", fmt.Sprintf("/subscriptions/%s/cancel", subscriptionID), nil)
	return err
}

func (p *PaddleProvider) ProcessWebhook(ctx context.Context, payload []byte, signature string) (*payment.WebhookEvent, error) {
	// Verify signature
	if !p.verifySignature(payload, signature) {
		return nil, fmt.Errorf("invalid webhook signature")
	}

	var event struct {
		EventType string `json:"event_type"`
		Data      json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, fmt.Errorf("failed to parse webhook: %w", err)
	}

	we := &payment.WebhookEvent{
		EventType: event.EventType,
		Raw:       payload,
	}

	// Parse data based on event type
	switch event.EventType {
	case "transaction.completed":
		var data struct {
			ID     string `json:"id"`
			Amount string `json:"amount"`
			Currency string `json:"currency_code"`
			Status string `json:"status"`
		}
		json.Unmarshal(event.Data, &data)
		we.TransactionID = data.ID
		we.Currency = data.Currency
		we.Status = data.Status

	case "subscription.created", "subscription.updated", "subscription.cancelled":
		var data struct {
			ID     string `json:"id"`
			Status string `json:"status"`
			Items  []struct {
				Price struct {
					ID string `json:"id"`
				} `json:"price"`
			} `json:"items"`
		}
		json.Unmarshal(event.Data, &data)
		we.SubscriptionID = data.ID
		we.Status = data.Status
	}

	return we, nil
}

func (p *PaddleProvider) Refund(ctx context.Context, transactionID string, amount *float64) error {
	body := map[string]any{
		"transaction_id": transactionID,
	}
	if amount != nil {
		body["amount"] = fmt.Sprintf("%.2f", *amount)
	}
	_, err := p.doRequest(ctx, "POST", "/transactions/refund", body)
	return err
}

func (p *PaddleProvider) doRequest(ctx context.Context, method, path string, body any) (map[string]any, error) {
	var reqBody io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request: %w", err)
		}
		reqBody = bytes.NewReader(data)
	}

	req, err := http.NewRequestWithContext(ctx, method, p.baseURL+path, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("paddle API error (%d): %v", resp.StatusCode, result)
	}

	return result, nil
}

func (p *PaddleProvider) verifySignature(payload []byte, signature string) bool {
	if p.webhookKey == "" || signature == "" {
		return false
	}

	mac := hmac.New(sha256.New, []byte(p.webhookKey))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}