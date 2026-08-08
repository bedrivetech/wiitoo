package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/bedrivetech/wiitoo/services/auth/internal/middleware"
	"github.com/bedrivetech/wiitoo/services/auth/internal/model"
	"github.com/bedrivetech/wiitoo/services/auth/internal/repository"
	"github.com/bedrivetech/wiitoo/services/auth/internal/service"
)

// ProfileHandler handles user profile operations.
type ProfileHandler struct {
	authService  *service.AuthService
	otpService   *service.OTPService
	userRepo     *repository.UserRepository
	hasher       *service.Hasher
	emailSender  service.EmailSender
	emailBuilder *service.OTPEmailBuilder
}

func NewProfileHandler(authService *service.AuthService, otpService *service.OTPService, userRepo *repository.UserRepository, hasher *service.Hasher, emailSender service.EmailSender, emailBuilder *service.OTPEmailBuilder) *ProfileHandler {
	return &ProfileHandler{
		authService:  authService,
		otpService:   otpService,
		userRepo:     userRepo,
		hasher:       hasher,
		emailSender:  emailSender,
		emailBuilder: emailBuilder,
	}
}

// GetProfile handles GET /api/v1/auth/me
func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeUnauthorized, Message: "Authentication required"},
		})
		return
	}

	user, err := h.authService.GetUser(r.Context(), userID)
	if err != nil {
		if apiErr, ok := err.(*model.APIError); ok {
			status := http.StatusNotFound
			if apiErr.Code == model.ErrCodeUserNotFound {
				status = http.StatusNotFound
			}
			writeJSON(w, status, model.APIResponse{Success: false, Error: apiErr})
			return
		}
		slog.Error("failed to get profile", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    user,
	})
}

// UpdateProfile handles PATCH /api/v1/auth/me
func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeUnauthorized, Message: "Authentication required"},
		})
		return
	}

	var req model.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	user, err := h.authService.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		if apiErr, ok := err.(*model.APIError); ok {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: apiErr})
			return
		}
		slog.Error("failed to update profile", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    user,
	})
}

// EmailChange handles POST /api/v1/auth/email/change
func (h *ProfileHandler) EmailChange(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeUnauthorized, Message: "Authentication required"},
		})
		return
	}

	var req model.EmailChangeRequest
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
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "New email is required"},
		})
		return
	}

	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		slog.Error("failed to find user for email change", "error", err)
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

	if user.Email == req.Email {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "New email is the same as current email"},
		})
		return
	}

	// Check if new email is already taken
	existing, err := h.userRepo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		slog.Error("failed to check email availability", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}
	if existing != nil {
		writeJSON(w, http.StatusConflict, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeEmailTaken, Message: "Email is already in use"},
		})
		return
	}

	// Generate OTPs for both old and new email
	oldCode, err := h.otpService.GenerateOTP(r.Context(), userID, service.OTPPurposeEmailChangeOld, 10*time.Minute)
	if err != nil {
		slog.Error("failed to generate OTP for old email", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to generate verification codes"},
		})
		return
	}

	newCode, err := h.otpService.GenerateOTP(r.Context(), userID, service.OTPPurposeEmailChangeNew, 10*time.Minute)
	if err != nil {
		slog.Error("failed to generate OTP for new email", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to generate verification codes"},
		})
		return
	}

	// Send OTP to old email
	oldSubject, oldText, oldHTML := h.emailBuilder.EmailChangeOld(oldCode, req.Email)
	if err := h.emailSender.SendEmail(r.Context(), user.Email, oldSubject, oldText, oldHTML); err != nil {
		slog.Error("failed to send email change OTP to old email", "error", err)
	}

	// Send OTP to new email
	newSubject, newText, newHTML := h.emailBuilder.EmailChangeNew(newCode, user.Email)
	if err := h.emailSender.SendEmail(r.Context(), req.Email, newSubject, newText, newHTML); err != nil {
		slog.Error("failed to send email change OTP to new email", "error", err)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":  "Verification codes sent to your current and new email",
			"new_email": req.Email,
		},
	})
}

// EmailChangeConfirm handles POST /api/v1/auth/email/change/confirm
func (h *ProfileHandler) EmailChangeConfirm(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeUnauthorized, Message: "Authentication required"},
		})
		return
	}

	var req model.EmailChangeConfirmRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	if req.Email == "" || req.OldEmailCode == "" || req.NewEmailCode == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Email, old email code, and new email code are required"},
		})
		return
	}

	// Verify old email OTP
	oldValid, err := h.otpService.VerifyOTP(r.Context(), userID, service.OTPPurposeEmailChangeOld, req.OldEmailCode)
	if err != nil || !oldValid {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidOTP, Message: "Invalid or expired verification code for current email"},
		})
		return
	}

	// Verify new email OTP
	newValid, err := h.otpService.VerifyOTP(r.Context(), userID, service.OTPPurposeEmailChangeNew, req.NewEmailCode)
	if err != nil || !newValid {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidOTP, Message: "Invalid or expired verification code for new email"},
		})
		return
	}

	// Update the email in the database
	if err := h.userRepo.UpdateEmail(r.Context(), userID, req.Email); err != nil {
		slog.Error("failed to update email", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to update email"},
		})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    map[string]string{"message": "Email changed successfully. Please verify your new email."},
	})
}