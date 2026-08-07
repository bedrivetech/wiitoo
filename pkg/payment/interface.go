// Package payment provides interfaces for payment processing, subscriptions, and payouts.
// Provider-agnostic: Paddle, PayPal, and crypto implementations.
package payment

import (
	"context"
	"time"
)

// Provider is the interface for payment processing.
// Implementations: PaddleProvider, PayPalProvider, CryptoProvider.
type Provider interface {
	// Name returns the provider name ("paddle", "paypal", "usdc").
	Name() string

	// CreateCheckout creates a checkout session and returns a payment URL.
	CreateCheckout(ctx context.Context, req CheckoutRequest) (*CheckoutResponse, error)

	// CreateSubscription creates a recurring subscription.
	CreateSubscription(ctx context.Context, req SubscriptionRequest) (*SubscriptionResponse, error)

	// CancelSubscription cancels an active subscription.
	CancelSubscription(ctx context.Context, subscriptionID string) error

	// ProcessWebhook handles an incoming webhook from the provider.
	ProcessWebhook(ctx context.Context, payload []byte, signature string) (*WebhookEvent, error)

	// Refund processes a refund for a transaction.
	Refund(ctx context.Context, transactionID string, amount *float64) error
}

// PayoutProvider is the interface for sending money to creators.
type PayoutProvider interface {
	// Name returns the provider name ("paypal", "usdc", "bank").
	Name() string

	// SendPayout sends a payout to a creator.
	SendPayout(ctx context.Context, req PayoutRequest) (*PayoutResponse, error)

	// GetBalance returns the current balance available for payouts.
	GetBalance(ctx context.Context) (*Balance, error)
}

// CheckoutRequest creates a one-time payment.
type CheckoutRequest struct {
	Amount      float64
	Currency    string // "USD", "EUR", etc.
	Description string
	Metadata    map[string]string
	SuccessURL  string
	CancelURL   string
	Customer    CustomerInfo
}

// CheckoutResponse is the result of creating a checkout.
type CheckoutResponse struct {
	CheckoutURL    string `json:"checkoutUrl"`
	TransactionID  string `json:"transactionId"`
	ExpiresAt     time.Time `json:"expiresAt"`
}

// SubscriptionRequest creates a recurring subscription.
type SubscriptionRequest struct {
	PlanID         string
	CustomerID     string
	Currency       string
	Metadata       map[string]string
	SuccessURL     string
	CancelURL      string
	Proration      bool
	Customer       CustomerInfo
}

// SubscriptionResponse is the result of creating a subscription.
type SubscriptionResponse struct {
	SubscriptionURL string `json:"subscriptionUrl"`
	SubscriptionID  string `json:"subscriptionId"`
	Status          string `json:"status"` // "active", "trialing", "past_due", "paused"
}

// PayoutRequest sends money to a creator.
type PayoutRequest struct {
	RecipientID    string
	Amount         float64
	Currency       string
	PayoutMethod   string          // "paypal", "usdc_solana", "bank"
	RecipientEmail string          // For PayPal
	RecipientAddr  string          // For crypto (wallet address)
	Metadata       map[string]string
}

// PayoutResponse is the result of a payout.
type PayoutResponse struct {
	PayoutID    string `json:"payoutId"`
	Status      string `json:"status"` // "pending", "completed", "failed"
	EstimatedAt time.Time `json:"estimatedAt"`
	Fee         float64 `json:"fee"`
}

// Balance represents an account balance.
type Balance struct {
	Available float64 `json:"available"`
	Pending   float64 `json:"pending"`
	Currency  string  `json:"currency"`
}

// WebhookEvent is a normalized webhook event from any payment provider.
type WebhookEvent struct {
	EventType      string // "payment.succeeded", "subscription.created", "subscription.cancelled", "payout.completed"
	TransactionID  string
	SubscriptionID string
	CustomerID     string
	Amount         float64
	Currency       string
	Status         string
	Metadata       map[string]string
	Raw            []byte
}

// CustomerInfo describes a customer for payment purposes.
type CustomerInfo struct {
	ID        string
	Email     string
	Name      string
	Country   string // ISO 3166-1 alpha-2
}

// Plan defines a subscription tier.
type Plan struct {
	ID          string
	Name        string
	Description string
	Price       float64
	Currency    string
	Interval    string // "month", "year"
	Features    []string
}

// Standard plans for the platform.
var (
	PlanWiitoo    = Plan{ID: "plan_fusion", Name: "Wiitoo", Price: 5.00, Currency: "USD", Interval: "month"}
	PlanWiitooPlus = Plan{ID: "plan_wiitoo_plus", Name: "Wiitoo+", Price: 12.00, Currency: "USD", Interval: "month"}
	PlanCreator   = Plan{ID: "plan_creator", Name: "Creator", Price: 20.00, Currency: "USD", Interval: "month"}
)

// Ledger manages creator balances.
type Ledger interface {
	// Credit adds funds to a creator's balance.
	Credit(ctx context.Context, creatorID string, amount float64, reason string, refID string) error

	// Debit removes funds from a creator's balance.
	Debit(ctx context.Context, creatorID string, amount float64, reason string, refID string) error

	// Balance returns the current balance for a creator.
	Balance(ctx context.Context, creatorID string) (float64, error)

	// Transactions returns the transaction history for a creator.
	Transactions(ctx context.Context, creatorID string, limit, offset int) ([]Transaction, error)

	// PendingPayouts returns all creators eligible for payout (balance >= threshold).
	PendingPayouts(ctx context.Context, threshold float64) ([]PayoutEligible, error)
}

// Transaction represents a single ledger entry.
type Transaction struct {
	ID        string    `json:"id"`
	CreatorID string    `json:"creatorId"`
	Amount    float64   `json:"amount"` // positive = credit, negative = debit
	Reason    string    `json:"reason"`
	RefID     string    `json:"refId"`
	CreatedAt time.Time `json:"createdAt"`
}

// PayoutEligible represents a creator ready for payout.
type PayoutEligible struct {
	CreatorID string  `json:"creatorId"`
	Balance   float64 `json:"balance"`
	Email     string  `json:"email"`
	PayoutMethod string `json:"payoutMethod"`
}