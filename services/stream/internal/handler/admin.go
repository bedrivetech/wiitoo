package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/adminhandler"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/stream/internal/service"
	"github.com/go-chi/chi/v5"
)

// AdminHandler handles admin-only operations for the stream service.
type AdminHandler struct {
	svc *service.StreamService
}

func NewAdminHandler(svc *service.StreamService) *AdminHandler {
	return &AdminHandler{svc: svc}
}

// ListStreams returns a paginated list of all streams (not just live), filterable by status/userId.
func (h *AdminHandler) ListStreams(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	statusFilter := r.URL.Query().Get("status")
	userID := r.URL.Query().Get("userId")
	search := adminhandler.ParseSearch(r)

	offset := (page - 1) * perPage
	streams, total, err := h.svc.AdminListStreams(r.Context(), search, statusFilter, userID, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list streams failed", err)
		return
	}

	adminhandler.WriteList(w, streams, total, page, perPage)
}

// GetStream returns a single stream's details.
func (h *AdminHandler) GetStream(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	st, err := h.svc.GetStream(r.Context(), id)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, st, nil)
}

// KillStream forcefully ends a stream.
type killRequest struct{}

func (h *AdminHandler) KillStream(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.AdminKillStream(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "admin kill stream failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "killed"}, nil)
}

// BanUserFromStreaming bans a user from streaming.
type banStreamingRequest struct {
	Reason string `json:"reason"`
}

func (h *AdminHandler) BanUserFromStreaming(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if err := h.svc.AdminBanUserFromStreaming(r.Context(), userID, req.Reason); err != nil {
		apierror.WriteInternalError(w, "admin stream ban failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "banned"}, nil)
}