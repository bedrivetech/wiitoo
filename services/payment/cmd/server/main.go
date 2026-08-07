package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fusion-platform/pkg/database"
	"github.com/fusion-platform/payment/internal/config"
	"github.com/fusion-platform/payment/internal/handler"
	"github.com/fusion-platform/payment/internal/service"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := svcconfig.Load()
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	pgPool, err := database.NewPoolFromURL(context.Background(), cfg.DatabaseURL, 25)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pgPool.Close()

	paySvc := service.NewPaymentService(cfg, pgPool)
	h := handler.NewPaymentHandler(paySvc)
	adminH := handler.NewAdminHandler(paySvc)

	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Heartbeat("/healthz"))
	r.Use(cors.Handler(cors.Options{AllowedOrigins: []string{"*"}, AllowedMethods: []string{"GET","POST","PATCH","DELETE","OPTIONS"}, AllowedHeaders: []string{"Accept","Authorization","Content-Type","X-Webhook-Signature"}}))

	// Admin routes — protected by API gateway/mesh. Inline middleware checks X-User-Role header.
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

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("payment service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down payment service...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

// adminRoleMiddleware checks that the caller has an admin role.
// In production, the API gateway or service mesh injects this header after JWT validation.
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
