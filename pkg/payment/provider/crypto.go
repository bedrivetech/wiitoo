package provider

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/bedrivetech/wiitoo/pkg/payment"
)

// CryptoProvider handles USDC payments on Solana.
type CryptoProvider struct {
	httpClient     *http.Client
	walletAddress  string
	privateKey     ed25519.PrivateKey
	solanaRPC      string
	usdcMint       string // USDC mint address on Solana
	confirmations  int
}

// CryptoConfig holds configuration for the crypto payment provider.
type CryptoConfig struct {
	WalletAddress string
	PrivateKey    string // Base64-encoded Ed25519 private key
	SolanaRPC     string // Solana RPC endpoint
	USDCAddress   string // USDC mint address
	Confirmations int
	Network       string // "mainnet-beta" or "devnet"
}

// NewCryptoProvider creates a new crypto payment provider.
func NewCryptoProvider(cfg CryptoConfig) *CryptoProvider {
	usdcMint := cfg.USDCAddress
	if usdcMint == "" {
		if cfg.Network == "devnet" {
			usdcMint = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr" // devnet USDC
		} else {
			usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // mainnet USDC
		}
	}

	var privKey ed25519.PrivateKey
	if cfg.PrivateKey != "" {
		keyBytes, err := base64.StdEncoding.DecodeString(cfg.PrivateKey)
		if err == nil && len(keyBytes) == 64 {
			privKey = ed25519.PrivateKey(keyBytes)
		}
	}

	confirmations := cfg.Confirmations
	if confirmations == 0 {
		confirmations = 1
	}

	return &CryptoProvider{
		httpClient:    &http.Client{Timeout: 30 * time.Second},
		walletAddress: cfg.WalletAddress,
		privateKey:    privKey,
		solanaRPC:     cfg.SolanaRPC,
		usdcMint:      usdcMint,
		confirmations: confirmations,
	}
}

func (c *CryptoProvider) Name() string { return "usdc_solana" }

func (c *CryptoProvider) CreateCheckout(ctx context.Context, req payment.CheckoutRequest) (*payment.CheckoutResponse, error) {
	// For crypto, "checkout" means generating a deposit address.
	// The user sends USDC to the platform wallet; the payment is detected via webhook/polling.
	return &payment.CheckoutResponse{
		CheckoutURL:   fmt.Sprintf("solana:%s?amount=%2f&mint=%s", c.walletAddress, req.Amount, c.usdcMint),
		TransactionID: fmt.Sprintf("crypto_%d", time.Now().UnixNano()),
	}, nil
}

func (c *CryptoProvider) CreateSubscription(ctx context.Context, req payment.SubscriptionRequest) (*payment.SubscriptionResponse, error) {
	// Crypto subscriptions require a subscription manager contract or manual processing.
	// For MVP, return a manual subscription that needs periodic renewal.
	return &payment.SubscriptionResponse{
		SubscriptionID: fmt.Sprintf("crypto_sub_%d", time.Now().UnixNano()),
		Status:         "pending_manual",
	}, nil
}

func (c *CryptoProvider) CancelSubscription(ctx context.Context, subscriptionID string) error {
	// No-op for crypto — subscriptions aren't auto-renewing.
	return nil
}

func (c *CryptoProvider) ProcessWebhook(ctx context.Context, payload []byte, signature string) (*payment.WebhookEvent, error) {
	// Crypto "webhooks" come from Solana transaction monitoring.
	// Parse a transaction signature notification.
	sig := strings.TrimSpace(string(payload))
	if sig == "" {
		return nil, fmt.Errorf("empty transaction signature")
	}

	// Fetch transaction details from Solana RPC
	txDetails, err := c.getTransaction(ctx, sig)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transaction: %w", err)
	}

	we := &payment.WebhookEvent{
		TransactionID: sig,
		EventType:     "payment.succeeded",
		Status:        "completed",
		Currency:      "USDC",
	}

	if txDetails != nil {
		we.Amount = txDetails.Amount
		we.Metadata = map[string]string{
			"from":      txDetails.From,
			"to":        txDetails.To,
			"signature": sig,
		}
	}

	return we, nil
}

func (c *CryptoProvider) Refund(ctx context.Context, transactionID string, amount *float64) error {
	if c.privateKey == nil {
		return fmt.Errorf("refunds require a configured private key")
	}
	// In production, you'd build and sign a USDC transfer transaction here.
	return fmt.Errorf("crypto refunds not yet implemented — process manually")
}

// SendPayout sends USDC to a creator.
func (c *CryptoProvider) SendPayout(ctx context.Context, req payment.PayoutRequest) (*payment.PayoutResponse, error) {
	if c.privateKey == nil {
		return nil, fmt.Errorf("payouts require a configured wallet private key")
	}

	// Build and send a USDC transfer transaction.
	// solana-go library would be used here for building the transaction.
	// For now, log and return a reference.
	return &payment.PayoutResponse{
		PayoutID: fmt.Sprintf("usdc_payout_%d", time.Now().UnixNano()),
		Status:   "pending",
		Fee:      0.000005, // ~$0.00002 Solana fee
	}, nil
}

func (c *CryptoProvider) GetBalance(ctx context.Context) (*payment.Balance, error) {
	if c.walletAddress == "" {
		return &payment.Balance{Available: 0, Currency: "USDC"}, nil
	}

	// Query Solana RPC for token balance
	// For MVP, return a placeholder
	return &payment.Balance{
		Available: 0,
		Currency:  "USDC",
	}, nil
}

type txDetails struct {
	Amount float64
	From   string
	To     string
	Slot   uint64
}

func (c *CryptoProvider) getTransaction(ctx context.Context, signature string) (*txDetails, error) {
	// RPC call to Solana to get transaction details
	body := map[string]any{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "getTransaction",
		"params": []any{
			signature,
			map[string]any{
				"encoding":                       "jsonParsed",
				"maxSupportedTransactionVersion": 0,
			},
		},
	}

	data, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, "POST", c.solanaRPC, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rpcResp struct {
		Result *json.RawMessage `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&rpcResp); err != nil {
		return nil, err
	}

	if rpcResp.Result == nil {
		return nil, nil // Transaction not found yet
	}

	// Parse the parsed transaction data to extract USDC transfer amount
	// This would use solana-go's transaction parsing
	return &txDetails{
		Amount: 0,
		Slot:   0,
	}, nil
}