package handler

import (
	"encoding/json"
	"net/http"

	"github.com/fusion-platform/pkg/apierror"
	"github.com/fusion-platform/video/internal/service"
	"github.com/go-chi/chi/v5"
)

type VideoHandler struct {
	svc *service.VideoService
}

func NewVideoHandler(svc *service.VideoService) *VideoHandler {
	return &VideoHandler{svc: svc}
}

func (h *VideoHandler) RequestUpload(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filename    string `json:"filename"`
		ContentType string `json:"contentType"`
		Size        int64  `json:"size"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	resp, err := h.svc.RequestUpload(r.Context(), req.Filename, req.ContentType, req.Size)
	if err != nil {
		apierror.WriteInternalError(w, "upload request failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, resp, nil)
}

func (h *VideoHandler) CompleteUpload(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UploadID string `json:"uploadId"`
		VideoID  string `json:"videoId"`
		Size     int64  `json:"size"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	video, err := h.svc.CompleteUpload(r.Context(), req.UploadID, req.VideoID, req.Size)
	if err != nil {
		apierror.WriteInternalError(w, "upload complete failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, video, nil)
}

func (h *VideoHandler) Transcode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		VideoID     string   `json:"videoId"`
		Resolutions []string `json:"resolutions"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	job, err := h.svc.Transcode(r.Context(), req.VideoID, req.Resolutions)
	if err != nil {
		apierror.WriteInternalError(w, "transcode failed", err)
		return
	}
	apierror.WriteData(w, http.StatusAccepted, job, nil)
}

func (h *VideoHandler) GetVideo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	video, err := h.svc.GetVideo(r.Context(), id)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, video, nil)
}

func (h *VideoHandler) ListVideos(w http.ResponseWriter, r *http.Request) {
	videos, err := h.svc.ListVideos(r.Context(), r.URL.Query().Get("category"), 50, 0)
	if err != nil {
		apierror.WriteInternalError(w, "list videos failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, videos, nil)
}

func (h *VideoHandler) GenerateClip(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		StartTime float64 `json:"startTime"`
		Duration  float64 `json:"duration"`
		Title     string  `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	clip, err := h.svc.GenerateClip(r.Context(), id, req.StartTime, req.Duration, req.Title)
	if err != nil {
		apierror.WriteInternalError(w, "clip generation failed", err)
		return
	}
	apierror.WriteData(w, http.StatusAccepted, clip, nil)
}

func (h *VideoHandler) GenerateThumbnail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	thumb, err := h.svc.GenerateThumbnail(r.Context(), id)
	if err != nil {
		apierror.WriteInternalError(w, "thumbnail generation failed", err)
		return
	}
	apierror.WriteData(w, http.StatusAccepted, thumb, nil)
}

func (h *VideoHandler) ListPresets(w http.ResponseWriter, r *http.Request) {
	apierror.WriteData(w, http.StatusOK, h.svc.ListPresets(), nil)
}
