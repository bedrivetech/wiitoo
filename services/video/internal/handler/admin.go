package handler

import (
	"encoding/json"
	"net/http"

	"github.com/fusion-platform/pkg/adminhandler"
	"github.com/fusion-platform/pkg/apierror"
	"github.com/fusion-platform/video/internal/repository"
	"github.com/go-chi/chi/v5"
)

// AdminHandler handles admin-only operations for the video service.
type AdminHandler struct {
	vidRepo *repository.VideoRepository
}

func NewAdminHandler(vidRepo *repository.VideoRepository) *AdminHandler {
	return &AdminHandler{vidRepo: vidRepo}
}

// ListVideos returns a paginated list of all videos with search/filter support.
func (h *AdminHandler) ListVideos(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	search := adminhandler.ParseSearch(r)
	status := r.URL.Query().Get("status")
	creatorID := r.URL.Query().Get("creatorId")
	category := r.URL.Query().Get("category")

	offset := (page - 1) * perPage
	videos, total, err := h.vidRepo.AdminListVideos(r.Context(), search, status, creatorID, category, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list videos failed", err)
		return
	}

	adminhandler.WriteList(w, videos, total, page, perPage)
}

// GetVideo returns a single video's details.
func (h *AdminHandler) GetVideo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	video, err := h.vidRepo.GetByID(r.Context(), id)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, video, nil)
}

// DeleteVideo deletes a video.
func (h *AdminHandler) DeleteVideo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.vidRepo.AdminDeleteVideo(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "admin delete video failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}

// UpdateVideo updates video metadata (title, description, visibility, featured).
func (h *AdminHandler) UpdateVideo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		Visibility  *string `json:"visibility"`
		Featured    *bool   `json:"featured"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	video, err := h.vidRepo.AdminUpdateVideo(r.Context(), id, req.Title, req.Description, req.Visibility, req.Featured)
	if err != nil {
		apierror.WriteInternalError(w, "admin update video failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, video, nil)
}