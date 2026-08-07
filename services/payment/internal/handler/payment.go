package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/fusion-platform/payment/internal/service"
	"github.com/go-chi/chi/v5"
)

type PaymentHandler struct {
	svc *service.PaymentService
}

func NewPaymentHandler(svc *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{svc: svc}
}

type apiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, resp apiResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

func (h *PaymentHandler) CreateCheckout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID      string  `json:"userId"`
		Amount      float64 `json:"amount"`
		Currency    string  `json:"currency"`
		Description string  `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Error: "invalid request"})
		return
	}
	resp, err := h.svc.CreateCheckout(r.Context(), req.UserID, req.Amount, req.Currency, req.Description)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: resp})
}

func (h *PaymentHandler) CreateSubscription(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID   string `json:"userId"`
		PlanID   string `json:"planId"`
		Provider string `json:"provider"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Error: "invalid request"})
		return
	}
	resp, err := h.svc.CreateSubscription(r.Context(), req.UserID, req.PlanID, req.Provider)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: resp})
}

func (h *PaymentHandler) CancelSubscription(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.CancelSubscription(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true})
}

func (h *PaymentHandler) SendTip(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FromUserID  string  `json:"fromUserId"`
		ToCreatorID string  `json:"toCreatorId"`
		Amount      float64 `json:"amount"`
		Currency    string  `json:"currency"`
		Provider    string  `json:"provider"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Error: "invalid request"})
		return
	}
	txn, err := h.svc.SendTip(r.Context(), req.FromUserID, req.ToCreatorID, req.Amount, req.Currency, req.Provider)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: txn})
}

func (h *PaymentHandler) ListPlans(w http.ResponseWriter, r *http.Request) {
	plans := h.svc.ListPlans()
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: plans})
}

func (h *PaymentHandler) PaddleWebhook(w http.ResponseWriter, r *http.Request) {
	sig := r.Header.Get("Paddle-Signature")
	body, _ := io.ReadAll(r.Body)
	if err := h.svc.HandlePaddleWebhook(r.Context(), body, sig); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true})
}

func (h *PaymentHandler) PayPalWebhook(w http.ResponseWriter, r *http.Request) {
	sig := r.Header.Get("PayPal-Transmission-Sig")
	body, _ := io.ReadAll(r.Body)
	if err := h.svc.HandlePayPalWebhook(r.Context(), body, sig); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true})
}

func (h *PaymentHandler) CryptoWebhook(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	if err := h.svc.HandleCryptoWebhook(r.Context(), body, ""); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true})
}

func (h *PaymentHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	creatorID := chi.URLParam(r, "creatorId")
	balance, err := h.svc.GetBalance(r.Context(), creatorID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, apiResponse{Error: "creator not found"})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: map[string]float64{"balance": balance}})
}

func (h *PaymentHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	creatorID := chi.URLParam(r, "creatorId")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	txns, err := h.svc.GetTransactions(r.Context(), creatorID, limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: txns})
}

func (h *PaymentHandler) ProcessPayout(w http.ResponseWriter, r *http.Request) {
	creatorID := chi.URLParam(r, "creatorId")
	payout, err := h.svc.ProcessPayout(r.Context(), creatorID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: payout})
}