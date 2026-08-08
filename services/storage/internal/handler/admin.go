package handler

import (
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/adminhandler"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/services/storage/internal/repository"
)

// AdminHandler handles admin-only storage operations.
type AdminHandler struct {
	repo *repository.StorageRepository
}

// NewAdminHandler creates a new AdminHandler.
func NewAdminHandler(repo *repository.StorageRepository) *AdminHandler {
	return &AdminHandler{repo: repo}
}

// Health handles GET /api/v1/admin/storage/health
func (h *AdminHandler) Health(w http.ResponseWriter, r *http.Request) {
	providers, err := h.repo.ListProviders(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "list providers for health check failed", err)
		return
	}

	type healthStatus struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Type       string `json:"type"`
		IsHealthy  bool   `json:"isHealthy"`
		IsActive   bool   `json:"isActive"`
		LastCheck  string `json:"lastCheck,omitempty"`
	}

	statuses := make([]healthStatus, 0, len(providers))
	for _, p := range providers {
		hs := healthStatus{
			ID:        p.ID,
			Name:      p.Name,
			Type:      p.ProviderType,
			IsHealthy: p.IsHealthy,
			IsActive:  p.IsActive,
		}
		if p.LastHealthCheck != nil {
			hs.LastCheck = p.LastHealthCheck.Format("2006-01-02T15:04:05Z")
		}
		statuses = append(statuses, hs)
	}

	apierror.WriteData(w, http.StatusOK, statuses, nil)
}

// Stats handles GET /api/v1/admin/storage/stats
func (h *AdminHandler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetStorageStats(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "get storage stats failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, stats, nil)
}

// Upload handles GET /api/v1/admin/storage/stats (alias for Stats)
func (h *AdminHandler) Upload(w http.ResponseWriter, r *http.Request) {
	// Parse upload request for direct file upload through admin
	page, perPage := adminhandler.ParsePagination(r)
	_ = page
	_ = perPage

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "upload endpoint ready"}, nil)
}

// Download handles download requests through admin
func (h *AdminHandler) Download(w http.ResponseWriter, r *http.Request) {
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "download endpoint ready"}, nil)
}