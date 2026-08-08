package service

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	ppkg "github.com/bedrivetech/wiitoo/pkg/payment"
	pprovider "github.com/bedrivetech/wiitoo/pkg/payment/provider"
	"github.com/bedrivetech/wiitoo/services/payment/internal/config"
	"github.com/bedrivetech/wiitoo/services/payment/internal/model"
)

type PaymentService struct {
	cfg          *svcconfig.Config
	pool         *pgxpool.Pool
	paddle       ppkg.Provider
	paypal       *pprovider.PayPalProvider
	crypto       ppkg.Provider
}

func NewPaymentService(cfg *svcconfig.Config, pool *pgxpool.Pool) *PaymentService {
	var paddle ppkg.Provider
	if cfg.PaddleAPIKey != "" {
		paddle = pprovider.NewPaddleProvider(cfg.PaddleAPIKey, cfg.PaddleWebhookKey, cfg.PaddleEnv)
	}

	var paypalPay *pprovider.PayPalProvider
	if cfg.PayPalClientID != "" {
		paypalPay = pprovider.NewPayPalProvider(cfg.PayPalClientID, cfg.PayPalSecret, cfg.PayPalEnv)
	}

	var crypto ppkg.Provider
	if cfg.SolanaWallet != "" {
		crypto = pprovider.NewCryptoProvider(pprovider.CryptoConfig{
			WalletAddress: cfg.SolanaWallet,
			SolanaRPC:     cfg.SolanaRPC,
			Network:       "mainnet-beta",
		})
	}

	return &PaymentService{
		cfg:    cfg,
		pool:   pool,
		paddle: paddle,
		paypal: paypalPay,
		crypto: crypto,
	}
}

func (s *PaymentService) CreateCheckout(ctx context.Context, userID string, amount float64, currency, description string) (*ppkg.CheckoutResponse, error) {
	// Use Paddle for fiat checkout
	if s.paddle != nil {
		return s.paddle.CreateCheckout(ctx, ppkg.CheckoutRequest{
			Amount:      amount,
			Currency:    currency,
			Description: description,
			Metadata:    map[string]string{"user_id": userID},
		})
	}
	return nil, fmt.Errorf("no payment provider configured")
}

func (s *PaymentService) CreateSubscription(ctx context.Context, userID string, planID string, provider string) (*ppkg.SubscriptionResponse, error) {
	switch provider {
	case "paddle":
		if s.paddle != nil {
			return s.paddle.CreateSubscription(ctx, ppkg.SubscriptionRequest{
				PlanID:   planID,
				Metadata: map[string]string{"user_id": userID},
			})
		}
	case "paypal":
		if s.paypal != nil {
			return s.paypal.CreateSubscription(ctx, ppkg.SubscriptionRequest{
				PlanID:   planID,
				Metadata: map[string]string{"user_id": userID},
			})
		}
	}
	return nil, fmt.Errorf("subscription provider %s not configured", provider)
}

func (s *PaymentService) CancelSubscription(ctx context.Context, subscriptionID string) error {
	sub, err := s.getSubscription(ctx, subscriptionID)
	if err != nil {
		return err
	}
	switch sub.Provider {
	case "paddle":
		if s.paddle != nil {
			return s.paddle.CancelSubscription(ctx, sub.ProviderSubID)
		}
	case "paypal":
		if s.paypal != nil {
			return s.paypal.CancelSubscription(ctx, sub.ProviderSubID)
		}
	}
	return fmt.Errorf("provider not found")
}

func (s *PaymentService) SendTip(ctx context.Context, fromUserID, toCreatorID string, amount float64, currency, provider string) (*model.Transaction, error) {
	txnID := uuid.New().String()

	_, err := s.pool.Exec(ctx,
		`INSERT INTO transactions (id, user_id, type, provider, amount, currency, fee, net_amount, status, description, created_at)
		 VALUES ($1, $2, 'tip', $3, $4, $5, 0, $4, 'completed', $6, NOW())`,
		txnID, fromUserID, provider, amount, currency, fmt.Sprintf("Tip to %s", toCreatorID))
	if err != nil {
		return nil, fmt.Errorf("failed to record tip: %w", err)
	}

	// Credit the creator's ledger
	gross := amount
	fee := gross * (s.cfg.PlatformFeePct / 100.0)
	net := gross - fee

	_, err = s.pool.Exec(ctx,
		`INSERT INTO creator_ledger (creator_id, balance, lifetime_earnings, pending_payout, updated_at)
		 VALUES ($1, $2, $2, 0, NOW())
		 ON CONFLICT (creator_id) DO UPDATE SET
		   balance = creator_ledger.balance + $2,
		   lifetime_earnings = creator_ledger.lifetime_earnings + $2,
		   updated_at = NOW()`,
		toCreatorID, net)
	if err != nil {
		slog.Error("failed to credit creator ledger", "error", err)
	}

	return &model.Transaction{
		ID:     txnID,
		UserID: fromUserID,
		Type:   "tip",
		Amount: amount,
		Currency: currency,
		Status: "completed",
	}, nil
}

func (s *PaymentService) HandlePaddleWebhook(ctx context.Context, payload []byte, signature string) error {
	event, err := s.paddle.ProcessWebhook(ctx, payload, signature)
	if err != nil {
		return err
	}
	return s.handleWebhookEvent(ctx, event)
}

func (s *PaymentService) HandlePayPalWebhook(ctx context.Context, payload []byte, signature string) error {
	event, err := s.paypal.ProcessWebhook(ctx, payload, signature)
	if err != nil {
		return err
	}
	return s.handleWebhookEvent(ctx, event)
}

func (s *PaymentService) HandleCryptoWebhook(ctx context.Context, payload []byte, signature string) error {
	event, err := s.crypto.ProcessWebhook(ctx, payload, signature)
	if err != nil {
		return err
	}
	return s.handleWebhookEvent(ctx, event)
}

func (s *PaymentService) handleWebhookEvent(ctx context.Context, event *ppkg.WebhookEvent) error {
	switch event.EventType {
	case "transaction.completed", "payment.succeeded":
		slog.Info("payment succeeded", "txn", event.TransactionID, "amount", event.Amount)

	case "subscription.created":
		slog.Info("subscription created", "sub", event.SubscriptionID)

	case "subscription.cancelled":
		slog.Info("subscription cancelled", "sub", event.SubscriptionID)
	}
	return nil
}

func (s *PaymentService) GetBalance(ctx context.Context, creatorID string) (float64, error) {
	var balance float64
	err := s.pool.QueryRow(ctx,
		`SELECT balance FROM creator_ledger WHERE creator_id = $1`, creatorID).Scan(&balance)
	if err != nil {
		return 0, nil // New creator has no entries yet
	}
	return balance, nil
}

func (s *PaymentService) GetTransactions(ctx context.Context, creatorID string, limit, offset int) ([]model.Transaction, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, user_id, type, provider, amount, currency, fee, net_amount, status, description, created_at
		 FROM transactions WHERE user_id = $1 OR description LIKE $2
		 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
		creatorID, fmt.Sprintf("%%to %s%%", creatorID), limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txns []model.Transaction
	for rows.Next() {
		var t model.Transaction
		rows.Scan(&t.ID, &t.UserID, &t.Type, &t.Provider, &t.Amount, &t.Currency, &t.Fee, &t.NetAmount, &t.Status, &t.Description, &t.CreatedAt)
		txns = append(txns, t)
	}
	return txns, nil
}

func (s *PaymentService) ProcessPayout(ctx context.Context, creatorID string) (*model.Payout, error) {
	balance, err := s.GetBalance(ctx, creatorID)
	if err != nil {
		return nil, err
	}
	if balance < s.cfg.PayoutThreshold {
		return nil, fmt.Errorf("balance %.2f below payout threshold %.2f", balance, s.cfg.PayoutThreshold)
	}

	// Deduct from ledger
	_, err = s.pool.Exec(ctx,
		`UPDATE creator_ledger SET balance = 0, pending_payout = balance, updated_at = NOW() WHERE creator_id = $1`,
		creatorID)
	if err != nil {
		return nil, err
	}

	payout := &model.Payout{
		ID:        uuid.New().String(),
		CreatorID: creatorID,
		Amount:    balance,
		Fee:       0,
		NetAmount: balance,
		Method:    "paypal",
		Status:    "pending",
		PeriodStart: time.Now().Add(-30 * 24 * time.Hour),
		PeriodEnd:   time.Now(),
		CreatedAt:   time.Now(),
	}

	_, err = s.pool.Exec(ctx,
		`INSERT INTO payouts (id, creator_id, amount, fee, net_amount, method, status, period_start, period_end, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		payout.ID, payout.CreatorID, payout.Amount, payout.Fee, payout.NetAmount,
		payout.Method, payout.Status, payout.PeriodStart, payout.PeriodEnd, payout.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Send payout via PayPal
	if s.paypal != nil {
		resp, err := s.paypal.SendPayout(ctx, ppkg.PayoutRequest{
			RecipientID: creatorID,
			Amount:      balance,
			Currency:    "USD",
			Metadata:    map[string]string{"payout_id": payout.ID},
		})
		if err != nil {
			slog.Error("payout failed", "error", err)
			payout.Status = "failed"
		} else {
			payout.Status = resp.Status
			payout.ProviderRef = resp.PayoutID
			now := time.Now()
			payout.ProcessedAt = &now
		}
	} else {
		payout.Status = "pending_manual"
	}

	return payout, nil
}

func (s *PaymentService) ListPlans() []ppkg.Plan {
	return []ppkg.Plan{ppkg.PlanWiitoo, ppkg.PlanWiitooPlus, ppkg.PlanCreator}
}

func (s *PaymentService) getSubscription(ctx context.Context, id string) (*model.Subscription, error) {
	sub := &model.Subscription{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, user_id, plan_id, provider, provider_sub_id, status, current_period_start, current_period_end, canceled_at, created_at
		 FROM subscriptions WHERE id = $1`, id).Scan(
		&sub.ID, &sub.UserID, &sub.PlanID, &sub.Provider, &sub.ProviderSubID, &sub.Status,
		&sub.CurrentPeriodStart, &sub.CurrentPeriodEnd, &sub.CanceledAt, &sub.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}
	return sub, nil
}

// --- Admin methods ---

// AdminListTransactions returns all transactions with optional filters.
func (s *PaymentService) AdminListTransactions(ctx context.Context, userID, status, method string, limit, offset int) ([]model.Transaction, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if userID != "" {
		where = append(where, "user_id = $"+strconv.Itoa(argIdx))
		args = append(args, userID)
		argIdx++
	}
	if status != "" {
		where = append(where, "status = $"+strconv.Itoa(argIdx))
		args = append(args, status)
		argIdx++
	}
	if method != "" {
		where = append(where, "provider = $"+strconv.Itoa(argIdx))
		args = append(args, method)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM transactions WHERE "+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, user_id, type, provider, provider_txn_id, amount, currency, fee, net_amount, status, description, created_at
	          FROM transactions WHERE ` + whereClause + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var txns []model.Transaction
	for rows.Next() {
		var t model.Transaction
		rows.Scan(&t.ID, &t.UserID, &t.Type, &t.Provider, &t.ProviderTxnID, &t.Amount, &t.Currency, &t.Fee, &t.NetAmount, &t.Status, &t.Description, &t.CreatedAt)
		txns = append(txns, t)
	}
	return txns, total, nil
}

// AdminGetTransaction returns a single transaction by ID.
func (s *PaymentService) AdminGetTransaction(ctx context.Context, id string) (*model.Transaction, error) {
	t := &model.Transaction{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, user_id, type, provider, provider_txn_id, amount, currency, fee, net_amount, status, description, created_at
		 FROM transactions WHERE id = $1`, id).Scan(
		&t.ID, &t.UserID, &t.Type, &t.Provider, &t.ProviderTxnID, &t.Amount, &t.Currency, &t.Fee, &t.NetAmount, &t.Status, &t.Description, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return t, nil
}

// AdminListPayouts returns all payout history.
func (s *PaymentService) AdminListPayouts(ctx context.Context, limit, offset int) ([]model.Payout, int, error) {
	var total int
	if err := s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM payouts").Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := s.pool.Query(ctx,
		`SELECT id, creator_id, amount, fee, net_amount, method, status, provider_ref, period_start, period_end, processed_at, created_at
		 FROM payouts ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var payouts []model.Payout
	for rows.Next() {
		var p model.Payout
		rows.Scan(&p.ID, &p.CreatorID, &p.Amount, &p.Fee, &p.NetAmount, &p.Method, &p.Status, &p.ProviderRef, &p.PeriodStart, &p.PeriodEnd, &p.ProcessedAt, &p.CreatedAt)
		payouts = append(payouts, p)
	}
	return payouts, total, nil
}

// AdminTriggerPayout creates a manual payout for a creator.
func (s *PaymentService) AdminTriggerPayout(ctx context.Context, creatorID string, amount float64) (*model.Payout, error) {
	existingBalance, _ := s.GetBalance(ctx, creatorID)

	// Deduct from ledger if there's balance
	if existingBalance >= amount {
		_, err := s.pool.Exec(ctx,
			`UPDATE creator_ledger SET balance = balance - $2, pending_payout = pending_payout + $2, updated_at = NOW() WHERE creator_id = $1`,
			creatorID, amount)
		if err != nil {
			return nil, err
		}
	}

	payout := &model.Payout{
		ID:          uuid.New().String(),
		CreatorID:   creatorID,
		Amount:      amount,
		Fee:         0,
		NetAmount:   amount,
		Method:      "manual",
		Status:      "pending_manual",
		PeriodStart: time.Now().Add(-30 * 24 * time.Hour),
		PeriodEnd:   time.Now(),
		CreatedAt:   time.Now(),
	}

	_, err := s.pool.Exec(ctx,
		`INSERT INTO payouts (id, creator_id, amount, fee, net_amount, method, status, period_start, period_end, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		payout.ID, payout.CreatorID, payout.Amount, payout.Fee, payout.NetAmount,
		payout.Method, payout.Status, payout.PeriodStart, payout.PeriodEnd, payout.CreatedAt)
	if err != nil {
		return nil, err
	}

	return payout, nil
}

// AdminListSubscriptions returns all subscriptions with optional status filter.
func (s *PaymentService) AdminListSubscriptions(ctx context.Context, status string, limit, offset int) ([]model.Subscription, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if status != "" {
		where = append(where, "status = $"+strconv.Itoa(argIdx))
		args = append(args, status)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM subscriptions WHERE "+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, user_id, plan_id, provider, provider_sub_id, status, current_period_start, current_period_end, canceled_at, created_at
	          FROM subscriptions WHERE ` + whereClause + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var subs []model.Subscription
	for rows.Next() {
		var sub model.Subscription
		rows.Scan(&sub.ID, &sub.UserID, &sub.PlanID, &sub.Provider, &sub.ProviderSubID, &sub.Status,
			&sub.CurrentPeriodStart, &sub.CurrentPeriodEnd, &sub.CanceledAt, &sub.CreatedAt)
		subs = append(subs, sub)
	}
	return subs, total, nil
}

// AdminIssueRefund marks a transaction as refunded.
func (s *PaymentService) AdminIssueRefund(ctx context.Context, transactionID, reason string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE transactions SET status = 'refunded', description = CASE WHEN $2 != '' THEN $2 ELSE description END WHERE id = $1 AND status = 'completed'`,
		transactionID, reason)
	return err
}
