package model

import "time"

type Subscription struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	PlanID         string    `json:"planId"`
	Provider       string    `json:"provider"` // paddle, paypal
	ProviderSubID  string    `json:"providerSubId"`
	Status         string    `json:"status"` // active, trialing, past_due, cancelled, expired
	CurrentPeriodStart time.Time `json:"currentPeriodStart"`
	CurrentPeriodEnd   time.Time `json:"currentPeriodEnd"`
	CanceledAt     *time.Time `json:"canceledAt,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
}

type Transaction struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	Type        string    `json:"type"` // subscription, tip, payout
	Provider    string    `json:"provider"` // paddle, paypal, usdc_solana
	ProviderTxnID string  `json:"providerTxnId"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	Fee         float64   `json:"fee"`
	NetAmount   float64   `json:"netAmount"`
	Status      string    `json:"status"` // completed, pending, failed, refunded
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

type CreatorLedger struct {
	CreatorID     string    `json:"creatorId"`
	Balance       float64   `json:"balance"`
	LifetimeEarnings float64 `json:"lifetimeEarnings"`
	PendingPayout float64   `json:"pendingPayout"`
	PayoutMethod  string    `json:"payoutMethod"` // paypal, usdc, bank
	PayoutEmail   string    `json:"payoutEmail,omitempty"`
	PayoutAddress string    `json:"payoutAddress,omitempty"` // crypto wallet
	UpdatedAt     time.Time `json:"updatedAt"`
}

type Payout struct {
	ID            string    `json:"id"`
	CreatorID     string    `json:"creatorId"`
	Amount        float64   `json:"amount"`
	Fee           float64   `json:"fee"`
	NetAmount     float64   `json:"netAmount"`
	Method        string    `json:"method"`
	Status        string    `json:"status"` // pending, processing, completed, failed
	ProviderRef   string    `json:"providerRef,omitempty"`
	PeriodStart   time.Time `json:"periodStart"`
	PeriodEnd     time.Time `json:"periodEnd"`
	ProcessedAt   *time.Time `json:"processedAt,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
}
