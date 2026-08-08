package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/services/notification/internal/repository"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// AdminHandler handles admin-only operations for the notification service.
type AdminHandler struct {
	notifRepo *repository.NotificationRepository
}

func NewAdminHandler(notifRepo *repository.NotificationRepository) *AdminHandler {
	return &AdminHandler{notifRepo: notifRepo}
}

// --- Templates CRUD ---

func (h *AdminHandler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.notifRepo.ListTemplates(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "admin list templates failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, templates, nil)
}

func (h *AdminHandler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Type  string `json:"type"`
		Title string `json:"title"`
		Body  string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}
	if req.Name == "" {
		apierror.WriteError(w, &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "name is required"})
		return
	}

	tpl := &repository.NotificationTemplate{
		ID:    uuid.New().String(),
		Name:  req.Name,
		Type:  req.Type,
		Title: req.Title,
		Body:  req.Body,
	}
	if err := h.notifRepo.CreateTemplate(r.Context(), tpl); err != nil {
		apierror.WriteInternalError(w, "admin create template failed", err)
		return
	}
	apierror.WriteData(w, http.StatusCreated, tpl, nil)
}

func (h *AdminHandler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tpl, err := h.notifRepo.GetTemplate(r.Context(), id)
	if err != nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, tpl, nil)
}

func (h *AdminHandler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Name  *string `json:"name"`
		Type  *string `json:"type"`
		Title *string `json:"title"`
		Body  *string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	tpl, err := h.notifRepo.UpdateTemplate(r.Context(), id, req.Name, req.Type, req.Title, req.Body)
	if err != nil {
		apierror.WriteInternalError(w, "admin update template failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, tpl, nil)
}

func (h *AdminHandler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.notifRepo.DeleteTemplate(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "admin delete template failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}