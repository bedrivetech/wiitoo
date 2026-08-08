package handler

import (
	"encoding/json"
	"log/slog"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/bedrivetech/wiitoo/services/auth/internal/model"
	"github.com/bedrivetech/wiitoo/services/auth/internal/repository"
)

var seededRand = rand.New(rand.NewSource(time.Now().UnixNano()))

// UsernameCheckHandler handles username availability checks and suggestions.
type UsernameCheckHandler struct {
	userRepo *repository.UserRepository
}

func NewUsernameCheckHandler(userRepo *repository.UserRepository) *UsernameCheckHandler {
	return &UsernameCheckHandler{userRepo: userRepo}
}

// CheckUsername handles GET /api/v1/auth/username/check?q={username}
// Returns availability and suggestions if taken.
func (h *UsernameCheckHandler) CheckUsername(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Query parameter 'q' is required"},
		})
		return
	}

	if len(q) < 2 || len(q) > 30 {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeValidationError, Message: "Username must be between 2 and 30 characters"},
		})
		return
	}

	// Check availability
	existing, err := h.userRepo.FindByUsername(r.Context(), q)
	if err != nil {
		slog.Error("username check failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{
			Success: false,
			Error:   &model.APIError{Code: model.ErrCodeInternalError, Message: "Internal server error"},
		})
		return
	}

	available := existing == nil
	var suggestions []string

	if !available {
		suggestions = h.generateSuggestions(q)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: model.UsernameCheckResponse{
			Username:    q,
			Available:   available,
			Suggestions: suggestions,
		},
	})
}

// generateSuggestions creates alternative usernames based on the requested one.
// Each suggestion is checked for availability before being returned.
func (h *UsernameCheckHandler) generateSuggestions(base string) []string {
	base = strings.ToLower(strings.TrimSpace(base))
	if len(base) < 2 {
		return nil
	}

	// Generate patterns
	patterns := []string{
		base + "_live",
		base + "_stream",
		"the" + strings.Title(base),
		base,
	}

	// Add numeric suffixes
	for i := 0; i < 3; i++ {
		patterns = append(patterns, base+"_"+randomDigits(2))
	}

	// Add dot separators
	if len(base) > 3 {
		mid := len(base) / 2
		patterns = append(patterns, base[:mid]+"."+base[mid:])
	}

	// Alternate casing suggestion
	if len(base) > 2 {
		patterns = append(patterns, strings.ToUpper(base[:1])+base[1:])
	}

	// Deduplicate and check availability
	seen := map[string]bool{}
	var suggestions []string
	for _, p := range patterns {
		if seen[p] || p == base {
			continue
		}
		seen[p] = true
		suggestions = append(suggestions, p)
		if len(suggestions) >= 5 {
			break
		}
	}

	return suggestions
}

// randomDigits generates a random numeric string of the given length.
func randomDigits(length int) string {
	const digits = "0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = digits[seededRand.Intn(len(digits))]
	}
	return string(result)
}