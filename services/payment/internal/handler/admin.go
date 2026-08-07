package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/adminhandler"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/payment/internal/service"
	"github.com/go-chi/chi/v5"
)

// AdminHandler handles admin-only operations for the payment service.
type AdminHandler struct {
	svc *service.PaymentService
}

func NewAdminHandler(svc *service.PaymentService) *AdminHandler {
	return &AdminHandler{svc: svc}
}

// ListTransactions returns a paginated list of all transactions.
func (h *AdminHandler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	userID := r.URL.Query().Get("userId")
	statusFilter := r.URL.Query().Get("status")
	method := r.URL.Query().Get("method")

	offset := (page - 1) * perPage
	txns, total, err := h.svc.AdminListTransactions(r.Context(), userID, statusFilter, method, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list transactions failed", err)
		return
	}

	adminhandler.WriteList(w, txns, total, page, perPage)
}

// GetTransaction returns a single transaction's details.
func (h *AdminHandler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	txn, err := h.svc.AdminGetTransaction(r.Context(), id)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, txn, nil)
}

// ListPayouts returns a paginated list of payout history.
func (h *AdminHandler) ListPayouts(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)

	offset := (page - 1) * perPage
	payouts, total, err := h.svc.AdminListPayouts(r.Context(), perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list payouts failed", err)
		return
	}

	adminhandler.WriteList(w, payouts, total, page, perPage)
}

// TriggerPayout manually triggers a payout to a creator.
func (h *AdminHandler) TriggerPayout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CreatorID string  `json:"creatorId"`
		Amount    float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if req.CreatorID == "" {
		apierror.WriteError(w, &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "creatorId is required"})
		return
	}

	payout, err := h.svc.AdminTriggerPayout(r.Context(), req.CreatorID, req.Amount)
	if err != nil {
		apierror.WriteInternalError(w, "admin trigger payout failed", err)
		return
	}
	apierror.WriteData(w, http.StatusCreated, payout, nil)
}

// ListSubscriptions returns a paginated list of subscriptions.
func (h *AdminHandler) ListSubscriptions(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	statusFilter := r.URL.Query().Get("status")

	offset := (page - 1) * perPage
	subs, total, err := h.svc.AdminListSubscriptions(r.Context(), statusFilter, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list subscriptions failed", err)
		return
	}

	adminhandler.WriteList(w, subs, total, page, perPage)
}

// CancelSubscription cancels a subscription by ID.
func (h *AdminHandler) CancelSubscription(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.CancelSubscription(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "admin cancel subscription failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "cancelled"}, nil)
}

// IssueRefund issues a refund for a transaction.
func (h *AdminHandler) IssueRefund(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TransactionID string `json:"transactionId"`
		Reason        string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if req.TransactionID == "" {
		apierror.WriteError(w, &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "transactionId is required"})
		return
	}

	if err := h.svc.AdminIssueRefund(r.Context(), req.TransactionID, req.Reason); err != nil {
		apierror.WriteInternalError(w, "admin issue refund failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "refunded"}, nil)
}