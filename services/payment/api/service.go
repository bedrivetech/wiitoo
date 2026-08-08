package api

import (
	"net/http"

	svcconfig "github.com/bedrivetech/wiitoo/services/payment/internal/config"
	"github.com/bedrivetech/wiitoo/services/payment/internal/handler"
	"github.com/bedrivetech/wiitoo/services/payment/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func Setup(r chi.Router, pool *pgxpool.Pool, rdb *redis.Client) func() {
	cfg := svcconfig.Load()

	paySvc := service.NewPaymentService(cfg, pool)
	h := handler.NewPaymentHandler(paySvc)
	adminH := handler.NewAdminHandler(paySvc)

	// Admin routes — protected by inline X-User-Role check
	r.Route("/api/v1/admin", func(r chi.Router) {
		r.Use(adminRoleMiddleware)
		r.Get("/transactions", adminH.ListTransactions)
		r.Get("/transactions/{id}", adminH.GetTransaction)
		r.Get("/payouts", adminH.ListPayouts)
		r.Post("/payouts", adminH.TriggerPayout)
		r.Get("/subscriptions", adminH.ListSubscriptions)
		r.Post("/subscriptions/{id}/cancel", adminH.CancelSubscription)
		r.Post("/refund", adminH.IssueRefund)
	})

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

func adminRoleMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := r.Header.Get("X-User-Role")
		if role != "admin" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"success":false,"error":{"code":"FORBIDDEN","message":"Access denied"}}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}