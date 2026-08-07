package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/fusion-platform/auth/internal/model"
	"github.com/fusion-platform/auth/internal/repository"
	"github.com/fusion-platform/auth/internal/service"
)

// PasswordHandler handles password reset flows.
type PasswordHandler struct {
	authService  *service.AuthService
	otpService   *service.OTPService
	userRepo     *repository.UserRepository
	hasher       *service.Hasher
	emailSender  service.EmailSender
	emailBuilder *service.OTPEmailBuilder
}

func NewPasswordHandler(authService *service.AuthService, otpService *service.OTPService, userRepo *repository.UserRepository, hasher *service.Hasher, emailSender service.EmailSender, emailBuilder *service.OTPEmailBuilder) *PasswordHandler {
	return &PasswordHandler{
		authService:  authService,
		otpService:   otpService,
		userRepo:     userRepo,
		hasher:       hasher,
		emailSender:  emailSender,
		emailBuilder: emailBuilder,
	}
}

// ResetRequest handles POST /api/v1/auth/password/reset
// Sends an OTP to the user's email for password reset.
func (h *PasswordHandler) ResetRequest(w http.ResponseWriter, r *http.Request) {
	var req model.PasswordResetRequest
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

	// Find user — don't reveal if email exists
	user, err := h.userRepo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		slog.Error("failed to find user for password reset", "error", err)
		// Return generic success
		writeJSON(w, http.StatusOK, model.APIResponse{
			Success: true,
			Data:    map[string]string{"message": "If the email exists, a password reset code has been sent"},
		})
		return
	}
	if user == nil {
		writeJSON(w, http.StatusOK, model.APIResponse{
			Success: true,
			Data:    map[string]string{"message": "If the email exists, a password reset code has been sent"},
		})
		return
	}

	// Check cooldown
	canResend, _ := h.otpService.CanResendOTP(r.Context(), user.ID, service.OTPPurposePasswordReset)
	if !canResend {
		writeJSON(w, http.StatusTooManyRequests, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeOTPRateLimit, Message: "Please wait before requesting another code"},
		})
		return
	}

	// Generate OTP
	code, err := h.otpService.GenerateOTP(r.Context(), user.ID, service.OTPPurposePasswordReset, 10*60)
	if err != nil {
		slog.Error("failed to generate password reset OTP", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to generate reset code"},
		})
		return
	}

	h.otpService.MarkOTPResend(r.Context(), user.ID, service.OTPPurposePasswordReset)

	subject, text, html := h.emailBuilder.PasswordReset(code)
	if err := h.emailSender.SendEmail(r.Context(), user.Email, subject, text, html); err != nil {
		slog.Error("failed to send password reset email", "error", err)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    map[string]string{"message": "Password reset code sent"},
	})
}

// ResetConfirm handles POST /api/v1/auth/password/reset/confirm
// Verifies the OTP and updates the password.
func (h *PasswordHandler) ResetConfirm(w http.ResponseWriter, r *http.Request) {
	var req model.PasswordResetConfirmRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	if req.Email == "" || req.Code == "" || req.NewPassword == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Email, code, and new password are required"},
		})
		return
	}

	if len(req.NewPassword) < 8 {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeWeakPassword, Message: "Password must be at least 8 characters"},
		})
		return
	}

	user, err := h.userRepo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		slog.Error("failed to find user for password reset confirm", "error", err)
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

	// Verify OTP
	valid, err := h.otpService.VerifyOTP(r.Context(), user.ID, service.OTPPurposePasswordReset, req.Code)
	if err != nil {
		slog.Error("OTP verification failed for password reset", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	if !valid {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidOTP, Message: "Invalid or expired reset code"},
		})
		return
	}

	// Hash and update password
	hash, err := h.hasher.HashPassword(req.NewPassword)
	if err != nil {
		slog.Error("failed to hash new password", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to update password"},
		})
		return
	}

	if err := h.userRepo.UpdatePassword(r.Context(), user.ID, hash); err != nil {
		slog.Error("failed to update password", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to update password"},
		})
		return
	}

	// Revoke all existing sessions
	if err := h.userRepo.RevokeAllUserRefreshTokens(r.Context(), user.ID); err != nil {
		slog.Warn("failed to revoke sessions after password reset", "error", err)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    map[string]string{"message": "Password reset successfully"},
	})
}