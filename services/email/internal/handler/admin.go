package handler

import (
	"net/http"

	"github.com/bedrivetech/wiitoo/email/internal/model"
	"github.com/bedrivetech/wiitoo/email/internal/repository"
	"github.com/bedrivetech/wiitoo/pkg/adminhandler"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
)

// AdminHandler handles admin-only email operations.
type AdminHandler struct {
	repo *repository.EmailRepository
}

// NewAdminHandler creates a new AdminHandler.
func NewAdminHandler(repo *repository.EmailRepository) *AdminHandler {
	return &AdminHandler{repo: repo}
}

// ListLog handles GET /api/v1/admin/email/log
func (h *AdminHandler) ListLog(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	search := adminhandler.ParseSearch(r)
	status := r.URL.Query().Get("status")
	providerID := r.URL.Query().Get("providerId")

	offset := (page - 1) * perPage
	entries, total, err := h.repo.ListEmailLog(r.Context(), search, status, providerID, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "list email log failed", err)
		return
	}

	if entries == nil {
		entries = []model.EmailLogEntry{}
	}

	adminhandler.WriteList(w, entries, total, page, perPage)
}