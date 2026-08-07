package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/fusion-platform/auth/internal/model"
	"github.com/fusion-platform/auth/internal/service"
)

// RegisterHandler handles user registration.
type RegisterHandler struct {
	authService *service.AuthService
	otpService  *service.OTPService
	emailSender service.EmailSender
	emailBuilder *service.OTPEmailBuilder
}

func NewRegisterHandler(authService *service.AuthService, otpService *service.OTPService, emailSender service.EmailSender, emailBuilder *service.OTPEmailBuilder) *RegisterHandler {
	return &RegisterHandler{
		authService:  authService,
		otpService:   otpService,
		emailSender:  emailSender,
		emailBuilder: emailBuilder,
	}
}

// Register handles POST /api/v1/auth/register
func (h *RegisterHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	user, err := h.authService.Register(r.Context(), req)
	if err != nil {
		if apiErr, ok := err.(*model.APIError); ok {
			status := http.StatusConflict
			if apiErr.Code == model.ErrCodeValidationError || apiErr.Code == model.ErrCodeWeakPassword {
				status = http.StatusBadRequest
			}
			writeJSON(w, status, model.APIResponse{Success: false, Error: apiErr})
			return
		}
		slog.Error("registration failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	// Generate and send OTP for email verification
	code, err := h.otpService.GenerateOTP(r.Context(), user.ID, service.OTPPurposeEmailVerify, 10*60) // 10 min
	if err != nil {
		slog.Error("failed to generate OTP after registration", "error", err)
		// Don't fail registration, but log the error
	} else {
		subject, text, html := h.emailBuilder.VerifyEmail(code)
		if err := h.emailSender.SendEmail(r.Context(), user.Email, subject, text, html); err != nil {
			slog.Error("failed to send verification email", "error", err)
		} else {
			slog.Info("verification email sent", "email", user.Email)
		}
	}

	writeJSON(w, http.StatusCreated, model.APIResponse{
		Success: true,
		Data: model.OTPChallengeResponse{
			Message:   "Registration successful. Please verify your email.",
			ExpiresIn: 600,
		},
	})
}