package middleware

import (
	"log/slog"
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
)

// ErrorHandler is middleware that catches errors returned by handler functions
// and writes appropriate HTTP responses using the standard API error envelope.
//
// Handlers wrapped with ErrorHandler should return an error instead of writing
// error responses inline. The middleware handles:
//   - *apierror.APIError → uses the error's code to determine HTTP status
//   - Other errors → returns HTTP 500 (Internal Server Error) and logs the error
//
// Example:
//
//	func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) error {
//	    user, err := h.service.Register(ctx, req)
//	    if err != nil {
//	        return err // middleware writes the error response
//	    }
//	    apierror.WriteData(w, http.StatusCreated, user, nil)
//	    return nil
//	}
//
//	r.Get("/users", ErrorHandler(h.CreateUser))
func ErrorHandler(next func(http.ResponseWriter, *http.Request) error) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := next(w, r); err != nil {
			// If it's an APIError, use its code to determine HTTP status
			if apiErr, ok := err.(*apierror.APIError); ok {
				apierror.WriteError(w, apiErr)
				return
			}

			// Log internal (unexpected) errors
			slog.Error("unhandled error in request",
				"error", err,
				"path", r.URL.Path,
				"method", r.Method,
				"request_id", RequestIDFromContext(r.Context()),
			)

			// Return a generic 500 for unexpected errors
			apierror.WriteError(w, apierror.ErrInternalError)
		}
	})
}

// Wrap is a convenience function that wraps a standard http.HandlerFunc
// returning an error into an http.Handler using ErrorHandler middleware.
//
// It is equivalent to calling ErrorHandler(fn) directly but provides
// a shorter name for inline use.
func Wrap(next func(http.ResponseWriter, *http.Request) error) http.Handler {
	return ErrorHandler(next)
}