package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/services/storage/internal/model"
	"github.com/bedrivetech/wiitoo/services/storage/internal/service"
	"github.com/go-chi/chi/v5"
)

// ProviderHandler handles CRUD operations for storage providers.
type ProviderHandler struct {
	providerSvc *service.ProviderService
}

// NewProviderHandler creates a new ProviderHandler.
func NewProviderHandler(providerSvc *service.ProviderService) *ProviderHandler {
	return &ProviderHandler{providerSvc: providerSvc}
}

// List handles GET /api/v1/admin/storage/providers
func (h *ProviderHandler) List(w http.ResponseWriter, r *http.Request) {
	providers, err := h.providerSvc.ListProviders(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "list providers failed", err)
		return
	}
	if providers == nil {
		providers = []model.StorageProvider{}
	}
	apierror.WriteData(w, http.StatusOK, providers, nil)
}

// Get handles GET /api/v1/admin/storage/providers/{id}
func (h *ProviderHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	provider, err := h.providerSvc.GetProvider(r.Context(), id)
	if err != nil {
		apierror.WriteInternalError(w, "get provider failed", err)
		return
	}
	if provider == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, provider, nil)
}

// Create handles POST /api/v1/admin/storage/providers
func (h *ProviderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.CreateStorageProviderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	provider, err := h.providerSvc.CreateProvider(r.Context(), req)
	if err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: err.Error()},
		})
		return
	}

	apierror.WriteData(w, http.StatusCreated, provider, nil)
}

// Update handles PUT /api/v1/admin/storage/providers/{id}
func (h *ProviderHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req model.UpdateStorageProviderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	provider, err := h.providerSvc.UpdateProvider(r.Context(), id, req)
	if err != nil {
		apierror.WriteInternalError(w, "update provider failed", err)
		return
	}
	if provider == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}

	apierror.WriteData(w, http.StatusOK, provider, nil)
}

// Delete handles DELETE /api/v1/admin/storage/providers/{id}
func (h *ProviderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.providerSvc.DeleteProvider(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "delete provider failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}

// Test handles POST /api/v1/admin/storage/providers/{id}/test
func (h *ProviderHandler) Test(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.providerSvc.TestProvider(r.Context(), id); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: err.Error()},
		})
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "connection successful"}, nil)
}