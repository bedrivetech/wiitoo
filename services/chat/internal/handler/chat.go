package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/chat/internal/service"
	"github.com/go-chi/chi/v5"
)

type ChatHandler struct {
	svc *service.ChatService
}

func NewChatHandler(svc *service.ChatService) *ChatHandler {
	return &ChatHandler{svc: svc}
}

func (h *ChatHandler) WebSocket(w http.ResponseWriter, r *http.Request) {
	streamID := chi.URLParam(r, "streamId")
	h.svc.HandleWebSocket(w, r, streamID)
}

func (h *ChatHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	streamID := chi.URLParam(r, "streamId")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	messages, err := h.svc.GetHistory(r.Context(), streamID, limit, offset)
	if err != nil {
		apierror.WriteInternalError(w, "get history failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, messages, nil)
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	streamID := chi.URLParam(r, "streamId")
	var req struct {
		UserID   string `json:"userId"`
		Username string `json:"username"`
		Body     string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	msg, err := h.svc.SendMessage(r.Context(), streamID, req.UserID, req.Username, req.Body)
	if err != nil {
		apierror.WriteInternalError(w, "send message failed", err)
		return
	}
	apierror.WriteData(w, http.StatusCreated, msg, nil)
}

func (h *ChatHandler) Timeout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StreamID string `json:"streamId"`
		UserID   string `json:"userId"`
		Duration int    `json:"duration"` // seconds
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if err := h.svc.Timeout(r.Context(), req.StreamID, req.UserID, time.Duration(req.Duration)*time.Second); err != nil {
		apierror.WriteInternalError(w, "timeout failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "timed_out"}, nil)
}

func (h *ChatHandler) Ban(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StreamID string `json:"streamId"`
		UserID   string `json:"userId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if err := h.svc.Ban(r.Context(), req.StreamID, req.UserID); err != nil {
		apierror.WriteInternalError(w, "ban failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "banned"}, nil)
}

func (h *ChatHandler) ListEmotes(w http.ResponseWriter, r *http.Request) {
	apierror.WriteData(w, http.StatusOK, []map[string]string{}, nil)
}
