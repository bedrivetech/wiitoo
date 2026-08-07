package handler

import (
	"encoding/json"
	"net/http"
)

// writeJSON sends a JSON response with the given status code and data.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		// If we can't encode the response, at least log it
		http.Error(w, `{"success":false,"data":null,"error":{"code":"INTERNAL_ERROR","message":"Failed to encode response"}}`, http.StatusInternalServerError)
	}
}