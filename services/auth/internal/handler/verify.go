package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/bedrivetech/wiitoo/services/auth/internal/model"
	"github.com/bedrivetech/wiitoo/services/auth/internal/repository"
	"github.com/bedrivetech/wiitoo/services/auth/internal/service"
)

// VerifyHandler handles email verification via OTP.
type VerifyHandler struct {
	authService  *service.AuthService
	otpService   *service.OTPService
	userRepo     *repository.UserRepository
	emailSender  service.EmailSender
	emailBuilder *service.OTPEmailBuilder
}

func NewVerifyHandler(authService *service.AuthService, otpService *service.OTPService, userRepo *repository.UserRepository, emailSender service.EmailSender, emailBuilder *service.OTPEmailBuilder) *VerifyHandler {
	return &VerifyHandler{
		authService:  authService,
		otpService:   otpService,
		userRepo:     userRepo,
		emailSender:  emailSender,
		emailBuilder: emailBuilder,
	}
}

// Verify handles POST /api/v1/auth/verify
func (h *VerifyHandler) Verify(w http.ResponseWriter, r *http.Request) {
	var req model.VerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	if req.Email == "" || req.Code == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Email and code are required"},
		})
		return
	}

	// Find the user by email
	user, err := h.userRepo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		slog.Error("failed to find user for verification", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}
	if user == nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeUserNotFound, Message: "User not found"},
		})
		return
	}

	if user.IsEmailVerified() {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Email is already verified"},
		})
		return
	}

	valid, err := h.otpService.VerifyOTP(r.Context(), user.ID, service.OTPPurposeEmailVerify, req.Code)
	if err != nil {
		slog.Error("OTP verification failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	if !valid {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidOTP, Message: "Invalid or expired verification code"},
		})
		return
	}

	// Mark email as verified
	if err := h.userRepo.VerifyEmail(r.Context(), user.ID); err != nil {
		slog.Error("failed to verify email", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	// Refresh user data to get updated status
	user, err = h.userRepo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		slog.Error("failed to refresh user after verification", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	// Generate auth tokens so the user is automatically logged in after verification
	tokens, err := h.authService.GenerateTokens(r.Context(), user)
	if err != nil {
		slog.Error("failed to generate tokens after verification", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    tokens,
	})
}

// ResendOTP handles POST /api/v1/auth/verify/resend
func (h *VerifyHandler) ResendOTP(w http.ResponseWriter, r *http.Request) {
	var req model.ResendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	if req.Email == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Email is required"},
		})
		return
	}

	user, err := h.userRepo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		slog.Error("failed to find user for OTP resend", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}
	if user == nil {
		// Don't reveal if email exists — return generic success
		writeJSON(w, http.StatusOK, model.APIResponse{
			Success: true,
			Data:    map[string]string{"message": "If the email exists, a verification code has been sent"},
		})
		return
	}

	if user.IsEmailVerified() {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Email is already verified"},
		})
		return
	}

	// Check cooldown
	canResend, remaining := h.otpService.CanResendOTP(r.Context(), user.ID, service.OTPPurposeEmailVerify)
	if !canResend {
		writeJSON(w, http.StatusTooManyRequests, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeOTPRateLimit, Message: "Please wait before requesting another code"},
		})
		// Set Retry-After header
		w.Header().Set("Retry-After", remaining.String())
		return
	}

	// Generate and send new OTP
	code, err := h.otpService.GenerateOTP(r.Context(), user.ID, service.OTPPurposeEmailVerify, 10*time.Minute)
	if err != nil {
		slog.Error("failed to generate OTP for resend", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to generate verification code"},
		})
		return
	}

	// Mark cooldown
	h.otpService.MarkOTPResend(r.Context(), user.ID, service.OTPPurposeEmailVerify)

	subject, text, html := h.emailBuilder.VerifyEmail(code)
	if err := h.emailSender.SendEmail(r.Context(), user.Email, subject, text, html); err != nil {
		slog.Error("failed to send verification email", "error", err)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: map[string]string{
			"message": "Verification code sent",
		},
	})
}