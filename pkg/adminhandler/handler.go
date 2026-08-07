// Package adminhandler provides shared utility types and helpers for admin CRUD endpoints.
// It is NOT a generic CRUD framework — just response helpers and query param parsers.
package adminhandler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
)

// ParsePagination extracts page/perPage from query params.
// Defaults: page=1, perPage=20. Maximum perPage is 100.
func ParsePagination(r *http.Request) (page, perPage int) {
	page = 1
	perPage = 20

	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}

	if pp := r.URL.Query().Get("perPage"); pp != "" {
		if v, err := strconv.Atoi(pp); err == nil && v > 0 && v <= 100 {
			perPage = v
		}
	}

	return
}

// ParseSearch extracts the ?q= search query from request parameters.
func ParseSearch(r *http.Request) string {
	return strings.TrimSpace(r.URL.Query().Get("q"))
}

// SortParams holds a parsed sort field and direction.
type SortParams struct {
	Field string
	Desc  bool
}

// ParseSort parses the ?sort= query parameter in the format "field:desc" or "field:asc".
// The allowed slice lists which fields are accepted. If the field is not allowed or
// the parameter is missing, it returns an empty SortParams.
func ParseSort(r *http.Request, allowed []string) SortParams {
	raw := r.URL.Query().Get("sort")
	if raw == "" {
		return SortParams{}
	}

	field := raw
	desc := false

	if idx := strings.LastIndex(raw, ":"); idx >= 0 {
		field = raw[:idx]
		dir := strings.ToLower(raw[idx+1:])
		if dir == "desc" {
			desc = true
		}
	}

	for _, a := range allowed {
		if a == field {
			return SortParams{Field: field, Desc: desc}
		}
	}

	return SortParams{}
}

// WriteList writes a paginated list response using the standard API envelope.
func WriteList[T any](w http.ResponseWriter, items []T, total, page, perPage int) {
	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}

	meta := &apierror.Pagination{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages,
	}

	apierror.WriteData(w, http.StatusOK, items, meta)
}