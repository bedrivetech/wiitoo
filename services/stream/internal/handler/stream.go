package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/pkg/stream"
	"github.com/bedrivetech/wiitoo/services/stream/internal/service"
	"github.com/go-chi/chi/v5"
)

type StreamHandler struct {
	svc *service.StreamService
}

func NewStreamHandler(svc *service.StreamService) *StreamHandler {
	return &StreamHandler{svc: svc}
}

func (h *StreamHandler) StartStream(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID   string   `json:"userId"`
		Title    string   `json:"title"`
		Category string   `json:"category"`
		IsMature bool     `json:"isMature"`
		Tags     []string `json:"tags"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	st, err := h.svc.StartStream(r.Context(), req.UserID, req.Title, req.Category, req.IsMature, req.Tags)
	if err != nil {
		apierror.WriteInternalError(w, "start stream failed", err)
		return
	}
	apierror.WriteData(w, http.StatusCreated, st, nil)
}

func (h *StreamHandler) EndStream(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.EndStream(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "end stream failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "ended"}, nil)
}

func (h *StreamHandler) GetStream(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	st, err := h.svc.GetStream(r.Context(), id)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	st.StreamKey = "" // Never expose stream key
	apierror.WriteData(w, http.StatusOK, st, nil)
}

func (h *StreamHandler) ListStreams(w http.ResponseWriter, r *http.Request) {
	results, err := h.svc.ListLiveStreams(r.Context(), r.URL.Query().Get("category"), 50, 0)
	if err != nil {
		apierror.WriteInternalError(w, "list streams failed", err)
		return
	}
	for _, st := range results {
		st.StreamKey = ""
	}
	apierror.WriteData(w, http.StatusOK, results, nil)
}

func (h *StreamHandler) ListLiveStreams(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 { limit = 50 }
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	streams, err := h.svc.ListLiveStreams(r.Context(), category, limit, offset)
	if err != nil {
		apierror.WriteInternalError(w, "list live streams failed", err)
		return
	}
	for _, st := range streams {
		st.StreamKey = ""
	}
	apierror.WriteData(w, http.StatusOK, streams, nil)
}

func (h *StreamHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.svc.ListCategories(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "list categories failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, cats, nil)
}

func (h *StreamHandler) UpdateSimulcast(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StreamID string                `json:"streamId"`
		Targets  []stream.SimulcastTarget `json:"targets"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if err := h.svc.UpdateSimulcast(r.Context(), req.StreamID, req.Targets); err != nil {
		apierror.WriteInternalError(w, "update simulcast failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "updated"}, nil)
}

func (h *StreamHandler) GetSimulcastConfig(w http.ResponseWriter, r *http.Request) {
	streamID := chi.URLParam(r, "streamId")
	targets, err := h.svc.GetSimulcastConfig(r.Context(), streamID)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, targets, nil)
}

func (h *StreamHandler) ListIngestServers(w http.ResponseWriter, r *http.Request) {
	apierror.WriteData(w, http.StatusOK, h.svc.GetIngestServers(), nil)
}

func (h *StreamHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	streamID := chi.URLParam(r, "streamId")
	analytics, err := h.svc.GetAnalytics(r.Context(), streamID)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, analytics, nil)
}

func (h *StreamHandler) MediaMTXWebhook(w http.ResponseWriter, r *http.Request) {
	var event map[string]any
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	h.svc.HandleMediaMTXWebhook(r.Context(), event)
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "ok"}, nil)
}
