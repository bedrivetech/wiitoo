package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/services/content/internal/service"
	"github.com/go-chi/chi/v5"
)

type ContentHandler struct {
	svc *service.ContentService
}

func NewContentHandler(svc *service.ContentService) *ContentHandler {
	return &ContentHandler{svc: svc}
}

func (h *ContentHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Thumbnail   *string `json:"thumbnail"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	cat, err := h.svc.CreateCategory(r.Context(), req.Name, req.Description, req.Thumbnail)
	if err != nil {
		apierror.WriteInternalError(w, "create category failed", err)
		return
	}
	apierror.WriteData(w, http.StatusCreated, cat, nil)
}

func (h *ContentHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.svc.ListCategories(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "list categories failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, cats, nil)
}

func (h *ContentHandler) GetCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	cat, err := h.svc.GetCategory(r.Context(), id)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, cat, nil)
}

func (h *ContentHandler) FollowCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct { UserID string `json:"userId"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if err := h.svc.FollowCategory(r.Context(), req.UserID, id); err != nil {
		apierror.WriteInternalError(w, "follow category failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "followed"}, nil)
}

func (h *ContentHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		apierror.WriteError(w, &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "Search query required"})
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 50 { limit = 20 }
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	results, err := h.svc.Search(r.Context(), query, limit, offset)
	if err != nil {
		apierror.WriteInternalError(w, "search failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, results, nil)
}

func (h *ContentHandler) ReportContent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ReporterID  string `json:"reporterId"`
		ContentID   string `json:"contentId"`
		ContentType string `json:"contentType"`
		Reason      string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if err := h.svc.ReportContent(r.Context(), req.ReporterID, req.ContentID, req.ContentType, req.Reason); err != nil {
		apierror.WriteInternalError(w, "report failed", err)
		return
	}
	apierror.WriteData(w, http.StatusCreated, map[string]string{"status": "reported"}, nil)
}

func (h *ContentHandler) Trending(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 50 { limit = 20 }
	results, err := h.svc.Trending(r.Context(), limit)
	if err != nil {
		apierror.WriteInternalError(w, "trending failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, results, nil)
}

func (h *ContentHandler) Recommended(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 50 { limit = 20 }
	results, err := h.svc.Recommended(r.Context(), userID, limit)
	if err != nil {
		apierror.WriteInternalError(w, "recommended failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, results, nil)
}
