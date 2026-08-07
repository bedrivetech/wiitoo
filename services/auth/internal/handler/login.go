package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/bedrivetech/wiitoo/auth/internal/model"
	"github.com/bedrivetech/wiitoo/auth/internal/service"
)

// LoginHandler handles user login.
type LoginHandler struct {
	authService *service.AuthService
}

func NewLoginHandler(authService *service.AuthService) *LoginHandler {
	return &LoginHandler{authService: authService}
}

// Login handles POST /api/v1/auth/login
func (h *LoginHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInvalidRequestBody, Message: "Invalid request body"},
		})
		return
	}

	user, err := h.authService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if apiErr, ok := err.(*model.APIError); ok {
			status := http.StatusUnauthorized
			if apiErr.Code == model.ErrCodeUserSuspended {
				status = http.StatusForbidden
			}
			writeJSON(w, status, model.APIResponse{Success: false, Error: apiErr})
			return
		}
		slog.Error("login failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	// Check if email is verified
	if !user.IsEmailVerified() {
		writeJSON(w, http.StatusForbidden, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeEmailNotVerified, Message: "Please verify your email before logging in"},
		})
		return
	}

	tokens, err := h.authService.GenerateTokens(r.Context(), user)
	if err != nil {
		slog.Error("failed to generate tokens", "error", err)
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