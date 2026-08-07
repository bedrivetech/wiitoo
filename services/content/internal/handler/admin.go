package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/content/internal/repository"
	"github.com/bedrivetech/wiitoo/pkg/adminhandler"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// AdminHandler handles admin-only operations for the content service.
type AdminHandler struct {
	contentRepo *repository.ContentRepository
}

func NewAdminHandler(contentRepo *repository.ContentRepository) *AdminHandler {
	return &AdminHandler{contentRepo: contentRepo}
}

// --- Categories CRUD ---

func (h *AdminHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.contentRepo.ListCategories(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "admin list categories failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, cats, nil)
}

func (h *AdminHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Thumbnail   string `json:"thumbnail"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if req.Name == "" {
		apierror.WriteError(w, &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "name is required"})
		return
	}

	cat := &repository.Category{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Slug:        slugify(req.Name),
		Description: req.Description,
		Thumbnail:   req.Thumbnail,
	}
	if err := h.contentRepo.CreateCategory(r.Context(), cat); err != nil {
		apierror.WriteInternalError(w, "admin create category failed", err)
		return
	}
	apierror.WriteData(w, http.StatusCreated, cat, nil)
}

func (h *AdminHandler) GetCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	cat, err := h.contentRepo.GetCategory(r.Context(), id)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, cat, nil)
}

func (h *AdminHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Thumbnail   *string `json:"thumbnail"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	cat, err := h.contentRepo.UpdateCategory(r.Context(), id, req.Name, req.Description, req.Thumbnail)
	if err != nil {
		apierror.WriteInternalError(w, "admin update category failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, cat, nil)
}

func (h *AdminHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.contentRepo.DeleteCategory(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "admin delete category failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}

// --- Reports ---

func (h *AdminHandler) ListReports(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	statusFilter := r.URL.Query().Get("status")

	offset := (page - 1) * perPage
	reports, total, err := h.contentRepo.ListReports(r.Context(), statusFilter, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list reports failed", err)
		return
	}

	adminhandler.WriteList(w, reports, total, page, perPage)
}

func (h *AdminHandler) ResolveReport(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Status string `json:"status"` // resolved or dismissed
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if req.Status != "resolved" && req.Status != "dismissed" {
		apierror.WriteError(w, &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "status must be 'resolved' or 'dismissed'"})
		return
	}

	if err := h.contentRepo.UpdateReportStatus(r.Context(), id, req.Status); err != nil {
		apierror.WriteInternalError(w, "admin update report failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": req.Status}, nil)
}

// --- Clips ---

func (h *AdminHandler) ListClips(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	search := adminhandler.ParseSearch(r)

	offset := (page - 1) * perPage
	clips, total, err := h.contentRepo.ListClips(r.Context(), search, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list clips failed", err)
		return
	}

	adminhandler.WriteList(w, clips, total, page, perPage)
}

func (h *AdminHandler) DeleteClip(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.contentRepo.DeleteClip(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "admin delete clip failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}

func slugify(s string) string {
	result := make([]byte, 0, len(s))
	for _, c := range s {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' {
			result = append(result, byte(c))
		} else if c >= 'A' && c <= 'Z' {
			result = append(result, byte(c+32))
		} else if c == ' ' {
			result = append(result, '-')
		}
	}
	return string(result)
}