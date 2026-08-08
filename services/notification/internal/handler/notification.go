package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/services/notification/internal/service"
	"github.com/go-chi/chi/v5"
)

type NotificationHandler struct {
	svc *service.NotificationService
}

func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 { limit = 50 }
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	notifications, err := h.svc.ListNotifications(r.Context(), userID, limit, offset)
	if err != nil {
		apierror.WriteInternalError(w, "list notifications failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, notifications, nil)
}

func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	var req struct { NotificationID string `json:"notificationId"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if err := h.svc.MarkRead(r.Context(), userID, req.NotificationID); err != nil {
		apierror.WriteInternalError(w, "mark read failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "read"}, nil)
}

func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	if err := h.svc.MarkAllRead(r.Context(), userID); err != nil {
		apierror.WriteInternalError(w, "mark all read failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "all_read"}, nil)
}

func (h *NotificationHandler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	count, err := h.svc.UnreadCount(r.Context(), userID)
	if err != nil {
		apierror.WriteInternalError(w, "unread count failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]int{"unread": count}, nil)
}

func (h *NotificationHandler) SendNotification(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string            `json:"userId"`
		Type   string            `json:"type"`
		Title  string            `json:"title"`
		Body   string            `json:"body"`
		Data   map[string]string `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	n, err := h.svc.SendNotification(r.Context(), req.UserID, req.Type, req.Title, req.Body, req.Data)
	if err != nil {
		apierror.WriteInternalError(w, "send notification failed", err)
		return
	}
	apierror.WriteData(w, http.StatusCreated, n, nil)
}

func (h *NotificationHandler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	prefs, err := h.svc.GetPreferences(r.Context(), userID)
	if err != nil {
		apierror.WriteInternalError(w, "get preferences failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, prefs, nil)
}

func (h *NotificationHandler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	var prefs service.NotificationPreferences
	if err := json.NewDecoder(r.Body).Decode(&prefs); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if err := h.svc.UpdatePreferences(r.Context(), &prefs); err != nil {
		apierror.WriteInternalError(w, "update preferences failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "updated"}, nil)
}
