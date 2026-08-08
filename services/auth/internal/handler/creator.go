package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/bedrivetech/wiitoo/services/auth/internal/middleware"
	"github.com/bedrivetech/wiitoo/services/auth/internal/model"
	"github.com/bedrivetech/wiitoo/services/auth/internal/repository"
	"github.com/bedrivetech/wiitoo/services/auth/internal/service"
)

// CreatorHandler handles creator conversion (viewer → creator).
type CreatorHandler struct {
	authService *service.AuthService
	userRepo    *repository.UserRepository
}

func NewCreatorHandler(authService *service.AuthService, userRepo *repository.UserRepository) *CreatorHandler {
	return &CreatorHandler{
		authService: authService,
		userRepo:    userRepo,
	}
}

// Convert handles POST /api/v1/auth/creator/convert
// Converts a viewer account to creator. Self-service, no admin needed.
// Creates a creator channel and triggers a lightweight verification request.
func (h *CreatorHandler) Convert(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeUnauthorized, Message: "Authentication required"},
		})
		return
	}

	var req model.CreatorConversionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	// Validate
	if strings.TrimSpace(req.CreatorUsername) == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Creator username is required"},
		})
		return
	}
	if strings.TrimSpace(req.Category) == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Primary category is required"},
		})
		return
	}

	// Get current user
	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		slog.Error("failed to find user for creator conversion", "error", err)
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

	// Check if already a creator
	if user.Role == model.RoleCreator {
		writeJSON(w, http.StatusConflict, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: "ALREADY_CREATOR", Message: "You are already a creator"},
		})
		return
	}

	// Check if the creator username is available
	existing, err := h.userRepo.FindByUsername(r.Context(), req.CreatorUsername)
	if err != nil {
		slog.Error("failed to check creator username", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}
	if existing != nil {
		writeJSON(w, http.StatusConflict, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeUsernameTaken, Message: "That creator name is taken"},
		})
		return
	}

	// Upgrade user to creator role
	displayName := req.CreatorUsername
	if req.DisplayName != nil && strings.TrimSpace(*req.DisplayName) != "" {
		displayName = *req.DisplayName
	}

	_, err = h.userRepo.AdminUpdateUser(r.Context(), userID, strPtr(string(model.RoleCreator)), nil, &displayName)
	if err != nil {
		slog.Error("failed to upgrade user to creator", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to upgrade account"},
		})
		return
	}

	// Update username to creator username if different
	if req.CreatorUsername != user.Username {
		if err := h.userRepo.UpdateUsername(r.Context(), userID, req.CreatorUsername); err != nil {
			slog.Error("failed to update username for creator", "error", err)
			// Non-fatal — role upgrade succeeded
		}
	}

	// Create a verification request (lightweight — no documents required for self-service)
	if err := h.userRepo.CreateCreatorVerificationRequest(r.Context(), userID, req.Category, req.Bio); err != nil {
		slog.Error("failed to create verification request", "error", err)
		// Non-fatal — creator account is created
	}

	slog.Info("user converted to creator", "user_id", userID, "creator_username", req.CreatorUsername)

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: model.CreatorConversionResponse{
			Message:        "Welcome to the creator community! Your channel is being set up.",
			UserID:         userID,
			CreatorChannel: req.CreatorUsername,
			Status:         "pending",
		},
	})
}

// strPtr returns a pointer to the given string.
func strPtr(s string) *string {
	return &s
}