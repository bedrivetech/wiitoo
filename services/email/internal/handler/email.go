package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/services/email/internal/model"
	"github.com/bedrivetech/wiitoo/services/email/internal/service"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
)

// EmailHandler handles transactional email sending endpoints.
type EmailHandler struct {
	emailSvc *service.EmailService
}

// NewEmailHandler creates a new EmailHandler.
func NewEmailHandler(emailSvc *service.EmailService) *EmailHandler {
	return &EmailHandler{emailSvc: emailSvc}
}

// Send handles POST /api/v1/email/send
func (h *EmailHandler) Send(w http.ResponseWriter, r *http.Request) {
	var req model.SendEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	if req.To == "" || req.Subject == "" {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "to and subject are required"},
		})
		return
	}

	if err := h.emailSvc.SendEmail(r.Context(), req); err != nil {
		apierror.WriteInternalError(w, "send email failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "sent"}, nil)
}

// SendTemplate handles POST /api/v1/email/send-template
func (h *EmailHandler) SendTemplate(w http.ResponseWriter, r *http.Request) {
	var req model.SendTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	if req.To == "" || req.Template == "" {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "to and template are required"},
		})
		return
	}

	if err := h.emailSvc.SendTemplate(r.Context(), req); err != nil {
		apierror.WriteInternalError(w, "send template failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "sent"}, nil)
}