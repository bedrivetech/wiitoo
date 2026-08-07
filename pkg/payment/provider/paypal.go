package provider

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/bedrivetech/wiitoo/pkg/payment"
)

// PayPalProvider implements payment.Provider for PayPal.
// Handles: one-time checkout, subscription creation, payouts.
type PayPalProvider struct {
	clientID     string
	clientSecret string
	baseURL      string
	httpClient   *http.Client
	accessToken  string
	tokenExpires time.Time
}

// NewPayPalProvider creates a new PayPal payment provider.
func NewPayPalProvider(clientID, clientSecret, environment string) *PayPalProvider {
	baseURL := "https://api-m.paypal.com"
	if environment == "sandbox" {
		baseURL = "https://api-m.sandbox.paypal.com"
	}
	return &PayPalProvider{
		clientID:     clientID,
		clientSecret: clientSecret,
		baseURL:      baseURL,
		httpClient:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (p *PayPalProvider) Name() string { return "paypal" }

func (p *PayPalProvider) CreateCheckout(ctx context.Context, req payment.CheckoutRequest) (*payment.CheckoutResponse, error) {
	token, err := p.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	body := map[string]any{
		"intent": "CAPTURE",
		"purchase_units": []map[string]any{
			{
				"reference_id": req.Metadata["order_id"],
				"amount": map[string]any{
					"currency_code": req.Currency,
					"value":         fmt.Sprintf("%.2f", req.Amount),
				},
				"description": req.Description,
				"custom_id":   req.Metadata["user_id"],
			},
		},
	}

	if req.SuccessURL != "" && req.CancelURL != "" {
		body["payment_source"] = map[string]any{
			"paypal": map[string]any{
				"experience_context": map[string]any{
					"payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
					"landing_page":              "LOGIN",
					"user_action":               "PAY_NOW",
					"return_url":                req.SuccessURL,
					"cancel_url":                req.CancelURL,
				},
			},
		}
	}

	resp, err := p.paypalRequest(ctx, token, "POST", "/v2/checkout/orders", body)
	if err != nil {
		return nil, err
	}

	orderID, _ := resp["id"].(string)
	var approveURL string
	if links, ok := resp["links"].([]any); ok {
		for _, link := range links {
			if l, ok := link.(map[string]any); ok {
				if l["rel"] == "payer-action" || l["rel"] == "approve" {
					approveURL, _ = l["href"].(string)
					break
				}
			}
		}
	}

	return &payment.CheckoutResponse{
		CheckoutURL:   approveURL,
		TransactionID: orderID,
		ExpiresAt:     time.Now().Add(3 * time.Hour),
	}, nil
}

func (p *PayPalProvider) CreateSubscription(ctx context.Context, req payment.SubscriptionRequest) (*payment.SubscriptionResponse, error) {
	token, err := p.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	body := map[string]any{
		"plan_id": req.PlanID,
		"subscriber": map[string]any{
			"name": map[string]any{
				"given_name": req.Customer.Name,
			},
			"email_address": req.Customer.Email,
		},
		"custom_id": req.Metadata["user_id"],
	}

	if req.SuccessURL != "" {
		body["application_context"] = map[string]any{
			"return_url": req.SuccessURL,
			"cancel_url": req.CancelURL,
		}
	}

	resp, err := p.paypalRequest(ctx, token, "POST", "/v1/billing/subscriptions", body)
	if err != nil {
		return nil, err
	}

	subID, _ := resp["id"].(string)
	status, _ := resp["status"].(string)

	var approveURL string
	if links, ok := resp["links"].([]any); ok {
		for _, link := range links {
			if l, ok := link.(map[string]any); ok {
				if l["rel"] == "approve" {
					approveURL, _ = l["href"].(string)
					break
				}
			}
		}
	}

	return &payment.SubscriptionResponse{
		SubscriptionID:  subID,
		SubscriptionURL: approveURL,
		Status:          status,
	}, nil
}

func (p *PayPalProvider) CancelSubscription(ctx context.Context, subscriptionID string) error {
	token, err := p.getAccessToken(ctx)
	if err != nil {
		return err
	}

	_, err = p.paypalRequest(ctx, token, "POST",
		fmt.Sprintf("/v1/billing/subscriptions/%s/cancel", subscriptionID),
		map[string]string{"reason": "Requested by customer"},
	)
	return err
}

func (p *PayPalProvider) ProcessWebhook(ctx context.Context, payload []byte, signature string) (*payment.WebhookEvent, error) {
	var event struct {
		EventType string `json:"event_type"`
		Resource  json.RawMessage `json:"resource"`
	}
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, fmt.Errorf("failed to parse PayPal webhook: %w", err)
	}

	we := &payment.WebhookEvent{
		EventType: event.EventType,
		Raw:       payload,
	}

	switch event.EventType {
	case "CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED":
		var resource struct {
			ID     string `json:"id"`
			Amount struct {
				Value    string `json:"value"`
				Currency string `json:"currency_code"`
			} `json:"amount"`
			Status string `json:"status"`
		}
		json.Unmarshal(event.Resource, &resource)
		we.TransactionID = resource.ID
		we.Amount = parsePayPalAmount(resource.Amount.Value)
		we.Currency = resource.Amount.Currency
		we.Status = resource.Status

	case "BILLING.SUBSCRIPTION.CREATED", "BILLING.SUBSCRIPTION.UPDATED", "BILLING.SUBSCRIPTION.CANCELLED":
		var resource struct {
			ID     string `json:"id"`
			Status string `json:"status"`
		}
		json.Unmarshal(event.Resource, &resource)
		we.SubscriptionID = resource.ID
		we.Status = resource.Status
	}

	return we, nil
}

func (p *PayPalProvider) Refund(ctx context.Context, transactionID string, amount *float64) error {
	token, err := p.getAccessToken(ctx)
	if err != nil {
		return err
	}

	body := map[string]any{}
	if amount != nil {
		body["amount"] = map[string]any{
			"value":         fmt.Sprintf("%.2f", *amount),
			"currency_code": "USD",
		}
	}

	_, err = p.paypalRequest(ctx, token, "POST",
		fmt.Sprintf("/v2/payments/captures/%s/refund", transactionID), body)
	return err
}

// SendPayout sends money to a creator via PayPal.
func (p *PayPalProvider) SendPayout(ctx context.Context, req payment.PayoutRequest) (*payment.PayoutResponse, error) {
	token, err := p.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	body := map[string]any{
		"sender_batch_header": map[string]any{
			"sender_batch_id":   req.Metadata["batch_id"],
			"email_subject":     "You've received a payout from Wiitoo",
			"email_message":     "Your earnings are now available.",
		},
		"items": []map[string]any{
			{
				"recipient_type": "EMAIL",
				"amount": map[string]any{
					"value":    fmt.Sprintf("%.2f", req.Amount),
					"currency": req.Currency,
				},
				"receiver": req.RecipientEmail,
				"note":     "Platform payout",
				"sender_item_id": req.Metadata["payout_id"],
			},
		},
	}

	resp, err := p.paypalRequest(ctx, token, "POST", "/v1/payments/payouts", body)
	if err != nil {
		return nil, err
	}

	batchHeader, _ := resp["batch_header"].(map[string]any)
	payoutID, _ := batchHeader["payout_batch_id"].(string)
	status, _ := batchHeader["batch_status"].(string)

	return &payment.PayoutResponse{
		PayoutID: payoutID,
		Status:   status,
	}, nil
}

func (p *PayPalProvider) GetBalance(ctx context.Context) (*payment.Balance, error) {
	token, err := p.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	resp, err := p.paypalRequest(ctx, token, "GET", "/v1/wallet/balances", nil)
	if err != nil {
		return nil, err
	}

	var balance payment.Balance
	if balances, ok := resp["balances"].([]any); ok && len(balances) > 0 {
		if b, ok := balances[0].(map[string]any); ok {
			balance.Available, _ = b["total_balance"].(map[string]any)["value"].(float64)
			balance.Currency, _ = b["total_balance"].(map[string]any)["currency"].(string)
		}
	}

	return &balance, nil
}

func (p *PayPalProvider) getAccessToken(ctx context.Context) (string, error) {
	if p.accessToken != "" && time.Now().Before(p.tokenExpires) {
		return p.accessToken, nil
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")

	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/v1/oauth2/token",
		bytes.NewBufferString(form.Encode()))
	if err != nil {
		return "", err
	}

	req.SetBasicAuth(p.clientID, p.clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get PayPal token: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	p.accessToken = result.AccessToken
	p.tokenExpires = time.Now().Add(time.Duration(result.ExpiresIn-60) * time.Second)

	return p.accessToken, nil
}

func (p *PayPalProvider) paypalRequest(ctx context.Context, token, method, path string, body any) (map[string]any, error) {
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

	req.Header.Set("Authorization", "Bearer "+token)
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
		return nil, fmt.Errorf("paypal API error (%d): %v", resp.StatusCode, result)
	}

	return result, nil
}

func parsePayPalAmount(s string) float64 {
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}