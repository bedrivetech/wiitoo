package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/storage/internal/model"
	"github.com/bedrivetech/wiitoo/storage/internal/service"
	"github.com/go-chi/chi/v5"
)

// RoutingHandler handles CRUD operations for upload routing rules.
type RoutingHandler struct {
	routingSvc *service.RoutingService
}

// NewRoutingHandler creates a new RoutingHandler.
func NewRoutingHandler(routingSvc *service.RoutingService) *RoutingHandler {
	return &RoutingHandler{routingSvc: routingSvc}
}

// List handles GET /api/v1/admin/storage/routing
func (h *RoutingHandler) List(w http.ResponseWriter, r *http.Request) {
	rules, err := h.routingSvc.ListRules(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "list routing rules failed", err)
		return
	}
	if rules == nil {
		rules = []model.RoutingRule{}
	}
	apierror.WriteData(w, http.StatusOK, rules, nil)
}

// Create handles POST /api/v1/admin/storage/routing
func (h *RoutingHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.CreateRoutingRuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	rule, err := h.routingSvc.CreateRule(r.Context(), req)
	if err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: err.Error()},
		})
		return
	}

	apierror.WriteData(w, http.StatusCreated, rule, nil)
}

// Update handles PUT /api/v1/admin/storage/routing/{usage}
func (h *RoutingHandler) Update(w http.ResponseWriter, r *http.Request) {
	usage := chi.URLParam(r, "usage")
	var req model.UpdateRoutingRuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	rule, err := h.routingSvc.UpdateRule(r.Context(), usage, req)
	if err != nil {
		apierror.WriteInternalError(w, "update routing rule failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, rule, nil)
}

// Delete handles DELETE /api/v1/admin/storage/routing/{usage}
func (h *RoutingHandler) Delete(w http.ResponseWriter, r *http.Request) {
	usage := chi.URLParam(r, "usage")
	if err := h.routingSvc.DeleteRule(r.Context(), usage); err != nil {
		apierror.WriteInternalError(w, "delete routing rule failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}