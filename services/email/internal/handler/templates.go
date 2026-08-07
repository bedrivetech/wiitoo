package handler

import (
	"encoding/json"
	"net/http"

	"github.com/fusion-platform/email/internal/model"
	"github.com/fusion-platform/email/internal/service"
	"github.com/fusion-platform/pkg/apierror"
	"github.com/go-chi/chi/v5"
)

// TemplateHandler handles CRUD operations for email templates.
type TemplateHandler struct {
	templateSvc *service.TemplateService
}

// NewTemplateHandler creates a new TemplateHandler.
func NewTemplateHandler(templateSvc *service.TemplateService) *TemplateHandler {
	return &TemplateHandler{templateSvc: templateSvc}
}

// List handles GET /api/v1/admin/email/templates
func (h *TemplateHandler) List(w http.ResponseWriter, r *http.Request) {
	templates, err := h.templateSvc.ListTemplates(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "list templates failed", err)
		return
	}
	if templates == nil {
		templates = []model.EmailTemplate{}
	}
	apierror.WriteData(w, http.StatusOK, templates, nil)
}

// Get handles GET /api/v1/admin/email/templates/{id}
func (h *TemplateHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tmpl, err := h.templateSvc.GetTemplate(r.Context(), id)
	if err != nil {
		apierror.WriteInternalError(w, "get template failed", err)
		return
	}
	if tmpl == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, tmpl, nil)
}

// Create handles POST /api/v1/admin/email/templates
func (h *TemplateHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.CreateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	tmpl, err := h.templateSvc.CreateTemplate(r.Context(), req)
	if err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: err.Error()},
		})
		return
	}

	apierror.WriteData(w, http.StatusCreated, tmpl, nil)
}

// Update handles PUT /api/v1/admin/email/templates/{id}
func (h *TemplateHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req model.UpdateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	tmpl, err := h.templateSvc.UpdateTemplate(r.Context(), id, req)
	if err != nil {
		apierror.WriteInternalError(w, "update template failed", err)
		return
	}
	if tmpl == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}

	apierror.WriteData(w, http.StatusOK, tmpl, nil)
}

// Delete handles DELETE /api/v1/admin/email/templates/{id}
func (h *TemplateHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.templateSvc.DeleteTemplate(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "delete template failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}

// Preview handles POST /api/v1/admin/email/templates/{id}/preview
func (h *TemplateHandler) Preview(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req model.PreviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	tmpl, err := h.templateSvc.PreviewTemplate(r.Context(), id, req.Variables)
	if err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: err.Error()},
		})
		return
	}

	apierror.WriteData(w, http.StatusOK, tmpl, nil)
}