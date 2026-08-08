package handler

import (
	"log/slog"
	"net/http"

	"github.com/bedrivetech/wiitoo/services/auth/internal/model"
	"github.com/bedrivetech/wiitoo/services/auth/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/markbates/goth/gothic"
)

// OAuthHandler handles OAuth provider login and callbacks.
type OAuthHandler struct {
	oauthService *service.OAuthService
	authService  *service.AuthService
}

func NewOAuthHandler(oauthService *service.OAuthService, authService *service.AuthService) *OAuthHandler {
	return &OAuthHandler{
		oauthService: oauthService,
		authService:  authService,
	}
}

// ProviderLogin handles GET /api/v1/auth/{provider}/login
// Redirects the user to the OAuth provider's authorization page.
func (h *OAuthHandler) ProviderLogin(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if provider == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Provider is required"},
		})
		return
	}

	// gothic handles the redirect — it will store state in session and redirect to provider
	gothic.BeginAuthHandler(w, r)
}

// Callback handles GET /api/v1/auth/{provider}/callback
// Processes the OAuth callback from the provider.
func (h *OAuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if provider == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Provider is required"},
		})
		return
	}

	// Complete the OAuth flow via gothic
	gothUser, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		slog.Error("OAuth callback failed", "provider", provider, "error", err)
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeOAuthProviderError, Message: "OAuth authentication failed: " + err.Error()},
		})
		return
	}

	// Process the callback
	authResponse, err := h.oauthService.HandleCallback(r.Context(), provider, gothUser)
	if err != nil {
		if apiErr, ok := err.(*model.APIError); ok {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: apiErr})
			return
		}
		slog.Error("OAuth callback handling failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Failed to complete authentication"},
		})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    authResponse,
	})
}