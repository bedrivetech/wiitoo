package handler

import (
	"encoding/json"
	"net/http"

	"github.com/fusion-platform/auth/internal/repository"
	"github.com/fusion-platform/pkg/adminhandler"
	"github.com/fusion-platform/pkg/apierror"
	"github.com/go-chi/chi/v5"
)

// AdminHandler handles admin-only operations for the auth service.
type AdminHandler struct {
	userRepo *repository.UserRepository
}

func NewAdminHandler(userRepo *repository.UserRepository) *AdminHandler {
	return &AdminHandler{userRepo: userRepo}
}

// ListUsers returns a paginated list of users with optional search and filters.
func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	search := adminhandler.ParseSearch(r)
	role := r.URL.Query().Get("role")
	status := r.URL.Query().Get("status")

	offset := (page - 1) * perPage
	users, total, err := h.userRepo.AdminListUsers(r.Context(), search, role, status, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list users failed", err)
		return
	}

	adminhandler.WriteList(w, users, total, page, perPage)
}

// GetUser returns a single user with their OAuth accounts.
func (h *AdminHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, oauthAccounts, err := h.userRepo.AdminGetUserWithOAuth(r.Context(), id)
	if err != nil {
		apierror.WriteInternalError(w, "admin get user failed", err)
		return
	}
	if user == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}

	resp := struct {
		User          any   `json:"user"`
		OAuthAccounts []any `json:"oauthAccounts"`
	}{
		User:          user,
		OAuthAccounts: toAnySlice(oauthAccounts),
	}
	apierror.WriteData(w, http.StatusOK, resp, nil)
}

// UpdateUser updates a user's role, status, and/or display_name.
func (h *AdminHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Role        *string `json:"role"`
		Status      *string `json:"status"`
		DisplayName *string `json:"display_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	user, err := h.userRepo.AdminUpdateUser(r.Context(), id, req.Role, req.Status, req.DisplayName)
	if err != nil {
		apierror.WriteInternalError(w, "admin update user failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, user, nil)
}

// DeleteUser soft-deletes a user by marking them as deleted.
func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.userRepo.AdminSoftDelete(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "admin delete user failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}

func toAnySlice[T any](s []*T) []any {
	result := make([]any, len(s))
	for i, v := range s {
		result[i] = v
	}
	return result
}