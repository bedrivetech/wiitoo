package handler

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/bedrivetech/wiitoo/auth/internal/middleware"
	"github.com/bedrivetech/wiitoo/auth/internal/repository"
	"github.com/bedrivetech/wiitoo/pkg/adminhandler"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
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

// --- New endpoints ---

// GetUserProfile returns the full profile for a single user with ban history and stats.
func (h *AdminHandler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	profile, err := h.userRepo.GetUserProfile(r.Context(), id)
	if err != nil {
		apierror.WriteInternalError(w, "admin get user profile failed", err)
		return
	}
	if profile == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}

	apierror.WriteData(w, http.StatusOK, profile, nil)
}

// BanUser creates a ban/suspension record for a user.
func (h *AdminHandler) BanUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Reason   string `json:"reason"`
		Duration *int   `json:"duration"` // hours, nil = permanent
		Note     string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	// Get admin ID from context (set by auth middleware)
	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		adminID = "unknown"
	}

	banReq := repository.BanRequest{
		UserID:   id,
		Reason:   req.Reason,
		BannedBy: adminID,
		Duration: req.Duration,
		Note:     req.Note,
	}

	if err := h.userRepo.BanUser(r.Context(), banReq); err != nil {
		apierror.WriteInternalError(w, "admin ban user failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "suspended"}, nil)
}

// UnbanUser lifts an active ban for a user.
func (h *AdminHandler) UnbanUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Get admin ID from context
	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		adminID = "unknown"
	}

	if err := h.userRepo.UnbanUser(r.Context(), id, adminID); err != nil {
		apierror.WriteInternalError(w, "admin unban user failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "active"}, nil)
}

// UpdateUserNotes updates admin notes on a user.
func (h *AdminHandler) UpdateUserNotes(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Notes string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	if err := h.userRepo.UpdateUserNotes(r.Context(), id, req.Notes); err != nil {
		apierror.WriteInternalError(w, "admin update notes failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "updated"}, nil)
}

// UpdateUserRole updates a user's role.
func (h *AdminHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	// Validate role
	validRoles := map[string]bool{"viewer": true, "creator": true, "moderator": true, "admin": true}
	if !validRoles[req.Role] {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "Invalid role. Must be: viewer, creator, moderator, or admin"},
		})
		return
	}

	role := req.Role
	user, err := h.userRepo.AdminUpdateUser(r.Context(), id, &role, nil, nil)
	if err != nil {
		apierror.WriteInternalError(w, "admin update role failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, user, nil)
}

// SetCreatorVerified toggles creator verification status for a user.
func (h *AdminHandler) SetCreatorVerified(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Verified bool `json:"verified"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	if err := h.userRepo.SetCreatorVerified(r.Context(), id, req.Verified); err != nil {
		apierror.WriteInternalError(w, "admin set creator verified failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]bool{"creator_verified": req.Verified}, nil)
}

// BulkUpdateStatus updates the status for multiple users at once.
func (h *AdminHandler) BulkUpdateStatus(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserIDs []string `json:"userIDs"`
		Status  string   `json:"status"`
		Reason  string   `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	if len(req.UserIDs) == 0 {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "userIDs is required"},
		})
		return
	}

	// Validate status
	validStatuses := map[string]bool{"active": true, "suspended": true, "pending": true, "deleted": true}
	if !validStatuses[req.Status] {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "Invalid status"},
		})
		return
	}

	if err := h.userRepo.BulkUpdateStatus(r.Context(), req.UserIDs, req.Status, req.Reason); err != nil {
		apierror.WriteInternalError(w, "admin bulk status update failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]interface{}{
		"updated": len(req.UserIDs),
		"status":  req.Status,
	}, nil)
}

// BulkAssignRole assigns a role to multiple users at once.
func (h *AdminHandler) BulkAssignRole(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserIDs []string `json:"userIDs"`
		Role    string   `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	if len(req.UserIDs) == 0 {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "userIDs is required"},
		})
		return
	}

	validRoles := map[string]bool{"viewer": true, "creator": true, "moderator": true, "admin": true}
	if !validRoles[req.Role] {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: "Invalid role"},
		})
		return
	}

	if err := h.userRepo.BulkAssignRole(r.Context(), req.UserIDs, req.Role); err != nil {
		apierror.WriteInternalError(w, "admin bulk role assignment failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]interface{}{
		"updated": len(req.UserIDs),
		"role":    req.Role,
	}, nil)
}

// ExportUsersCSV exports user data as CSV.
func (h *AdminHandler) ExportUsersCSV(w http.ResponseWriter, r *http.Request) {
	search := adminhandler.ParseSearch(r)
	role := r.URL.Query().Get("role")
	status := r.URL.Query().Get("status")

	filter := repository.UserFilter{
		Search: search,
		Role:   role,
		Status: status,
	}

	users, err := h.userRepo.ExportUsers(r.Context(), filter)
	if err != nil {
		apierror.WriteInternalError(w, "admin export users failed", err)
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=users_export_%d.csv", time.Now().Unix()))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Write header
	writer.Write([]string{
		"ID", "Email", "Username", "DisplayName", "Role", "Status",
		"EmailVerified", "LoginCount", "LastLoginAt", "LastIP",
		"CreatorVerified", "CreatedAt", "UpdatedAt",
	})

	// Write rows
	for _, u := range users {
		lastLogin := ""
		if u.LastLoginAt != nil {
			lastLogin = u.LastLoginAt.Format(time.RFC3339)
		}
		writer.Write([]string{
			u.ID,
			u.Email,
			u.Username,
			u.DisplayName,
			string(u.Role),
			string(u.Status),
			strconv.FormatBool(u.EmailVerified),
			strconv.Itoa(u.LoginCount),
			lastLogin,
			u.LastIP,
			strconv.FormatBool(u.CreatorVerified),
			u.CreatedAt.Format(time.RFC3339),
			u.UpdatedAt.Format(time.RFC3339),
		})
	}
}

// ListCreatorVerificationRequests lists creator verification requests.
func (h *AdminHandler) ListCreatorVerificationRequests(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	status := r.URL.Query().Get("status")

	offset := (page - 1) * perPage
	requests, total, err := h.userRepo.GetCreatorVerificationRequests(r.Context(), status, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list creator verification requests failed", err)
		return
	}

	adminhandler.WriteList(w, requests, total, page, perPage)
}

// ApproveCreatorVerification approves a creator verification request.
func (h *AdminHandler) ApproveCreatorVerification(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		adminID = "unknown"
	}

	if err := h.userRepo.ApproveCreatorVerification(r.Context(), id, adminID); err != nil {
		apierror.WriteInternalError(w, "admin approve creator verification failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "approved"}, nil)
}

// RejectCreatorVerification rejects a creator verification request.
func (h *AdminHandler) RejectCreatorVerification(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	adminID, ok := middleware.GetUserID(r.Context())
	if !ok {
		adminID = "unknown"
	}

	if err := h.userRepo.RejectCreatorVerification(r.Context(), id, adminID, req.Reason); err != nil {
		apierror.WriteInternalError(w, "admin reject creator verification failed", err)
		return
	}

	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "rejected"}, nil)
}

func toAnySlice[T any](s []*T) []any {
	result := make([]any, len(s))
	for i, v := range s {
		result[i] = v
	}
	return result
}