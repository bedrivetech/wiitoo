package api

import (
	svcconfig "github.com/bedrivetech/wiitoo/services/payment/internal/config"
	"github.com/bedrivetech/wiitoo/services/payment/internal/handler"
	"github.com/bedrivetech/wiitoo/services/payment/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, admin chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	paySvc := service.NewPaymentService(cfg, pool)
	h := handler.NewPaymentHandler(paySvc)
	adminH := handler.NewAdminHandler(paySvc)

	// Admin routes — protected by shared JWT auth + admin role middleware
	admin.Get("/transactions", adminH.ListTransactions)
	admin.Get("/transactions/{id}", adminH.GetTransaction)
	admin.Get("/payouts", adminH.ListPayouts)
	admin.Post("/payouts", adminH.TriggerPayout)
	admin.Get("/subscriptions", adminH.ListSubscriptions)
	admin.Post("/subscriptions/{id}/cancel", adminH.CancelSubscription)
	admin.Post("/refund", adminH.IssueRefund)

	r.Route("/api/v1/payments", func(r chi.Router) {
		r.Post("/checkout", h.CreateCheckout)
		r.Post("/subscription", h.CreateSubscription)
		r.Post("/subscription/{id}/cancel", h.CancelSubscription)
		r.Post("/tip", h.SendTip)
		r.Get("/plans", h.ListPlans)
		r.Post("/webhook/paddle", h.PaddleWebhook)
		r.Post("/webhook/paypal", h.PayPalWebhook)
		r.Post("/webhook/crypto", h.CryptoWebhook)
		r.Route("/ledger", func(r chi.Router) {
			r.Get("/{creatorId}", h.GetBalance)
			r.Get("/{creatorId}/transactions", h.GetTransactions)
			r.Post("/payout", h.ProcessPayout)
		})
	})

	return func() {}
}
