package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/chat/internal/repository"
	"github.com/bedrivetech/wiitoo/pkg/adminhandler"
	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/go-chi/chi/v5"
)

// AdminHandler handles admin-only operations for the chat service.
type AdminHandler struct {
	chatRepo *repository.ChatRepository
}

func NewAdminHandler(chatRepo *repository.ChatRepository) *AdminHandler {
	return &AdminHandler{chatRepo: chatRepo}
}

// ListMessages returns a paginated list of chat messages with optional filters.
func (h *AdminHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	page, perPage := adminhandler.ParsePagination(r)
	search := adminhandler.ParseSearch(r)
	streamID := r.URL.Query().Get("streamId")
	userID := r.URL.Query().Get("userId")

	offset := (page - 1) * perPage
	messages, total, err := h.chatRepo.ListMessages(r.Context(), search, streamID, userID, perPage, offset)
	if err != nil {
		apierror.WriteInternalError(w, "admin list messages failed", err)
		return
	}

	adminhandler.WriteList(w, messages, total, page, perPage)
}

// DeleteMessage removes a specific chat message.
func (h *AdminHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.chatRepo.DeleteMessage(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "admin delete message failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}

// BanUserFromChat bans a user from chat with an optional duration in hours.
func (h *AdminHandler) BanUserFromChat(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	var req struct {
		DurationHours int `json:"durationHours"` // 0 = permanent
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{Success: false, Error: apierror.ErrInvalidRequestBody})
		return
	}

	durationSeconds := req.DurationHours * 3600
	if err := h.chatRepo.BanUser(r.Context(), userID, durationSeconds); err != nil {
		apierror.WriteInternalError(w, "admin chat ban failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "banned"}, nil)
}

// PurgeStreamMessages deletes all messages for a given stream.
func (h *AdminHandler) PurgeStreamMessages(w http.ResponseWriter, r *http.Request) {
	streamID := chi.URLParam(r, "streamId")
	if err := h.chatRepo.PurgeStreamMessages(r.Context(), streamID); err != nil {
		apierror.WriteInternalError(w, "admin purge messages failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "purged"}, nil)
}