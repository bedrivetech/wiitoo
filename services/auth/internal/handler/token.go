package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/bedrivetech/wiitoo/auth/internal/middleware"
	"github.com/bedrivetech/wiitoo/auth/internal/model"
	"github.com/bedrivetech/wiitoo/auth/internal/service"
)

// TokenHandler handles token refresh and logout.
type TokenHandler struct {
	authService *service.AuthService
}

func NewTokenHandler(authService *service.AuthService) *TokenHandler {
	return &TokenHandler{authService: authService}
}

// Refresh handles POST /api/v1/auth/token/refresh
func (h *TokenHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req model.TokenRefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	if req.RefreshToken == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Refresh token is required"},
		})
		return
	}

	tokens, err := h.authService.RefreshTokens(r.Context(), req.RefreshToken)
	if err != nil {
		if apiErr, ok := err.(*model.APIError); ok {
			status := http.StatusUnauthorized
			if apiErr.Code == model.ErrCodeExpiredToken {
				status = http.StatusUnauthorized
			}
			writeJSON(w, status, model.APIResponse{Success: false, Error: apiErr})
			return
		}
		slog.Error("token refresh failed", "error", err)
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

// Logout handles POST /api/v1/auth/logout
func (h *TokenHandler) Logout(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeUnauthorized, Message: "Authentication required"},
		})
		return
	}

	if err := h.authService.Logout(r.Context(), userID); err != nil {
		slog.Error("logout failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to logout"},
		})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    map[string]string{"message": "Logged out successfully"},
	})
}