package apierror

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

// Standard error codes for the platform.
const (
	ErrCodeInvalidRequestBody  = "INVALID_REQUEST_BODY"
	ErrCodeValidationError     = "VALIDATION_ERROR"
	ErrCodeUnauthorized        = "UNAUTHORIZED"
	ErrCodeForbidden           = "FORBIDDEN"
	ErrCodeNotFound            = "NOT_FOUND"
	ErrCodeConflict            = "CONFLICT"
	ErrCodeRateLimited         = "RATE_LIMITED"
	ErrCodeInternalError       = "INTERNAL_ERROR"
	ErrCodeWeakPassword        = "WEAK_PASSWORD"
	ErrCodeOTPInvalid          = "OTP_INVALID"
	ErrCodeOTPExpired          = "OTP_EXPIRED"
	ErrCodeOTPTooManyAttempts  = "OTP_TOO_MANY_ATTEMPTS"
	ErrCodeTokenExpired        = "TOKEN_EXPIRED"
	ErrCodeTokenInvalid        = "TOKEN_INVALID"
	ErrCodeInsufficientFunds   = "INSUFFICIENT_FUNDS"
	ErrCodePaymentFailed       = "PAYMENT_FAILED"
	ErrCodeStreamOffline       = "STREAM_OFFLINE"
	ErrCodeStorageFailed       = "STORAGE_FAILED"
	ErrCodeTranscodeFailed     = "TRANSCODE_FAILED"
	ErrCodeMFARequired         = "MFA_REQUIRED"
	ErrCodeEmailNotVerified    = "EMAIL_NOT_VERIFIED"
)

// APIError is a structured error returned by all services.
// It implements the error interface and carries machine-readable code,
// a human-readable message, and optional details (e.g. validation errors).
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

func (e *APIError) Error() string {
	if e.Details != nil {
		return fmt.Sprintf("%s: %s (details: %v)", e.Code, e.Message, e.Details)
	}
	return e.Message
}

// NewError constructs a new APIError with the given code, message, and optional details.
func NewError(code, message string, details any) *APIError {
	return &APIError{Code: code, Message: message, Details: details}
}

// ValidationError creates an APIError for a field-level validation failure.
// The field parameter is the name of the field that failed validation.
// The reason parameter is a human-readable explanation of why it failed.
// The resulting error has code VALIDATION_ERROR and details containing
// the field and reason.
func ValidationError(field, reason string) *APIError {
	return &APIError{
		Code:    ErrCodeValidationError,
		Message: "Validation error",
		Details: map[string]string{field: reason},
	}
}

// InvalidInput creates an APIError for an invalid input payload.
// The details parameter can contain structured error information,
// such as a map of field→reason pairs or a list of validation messages.
func InvalidInput(details any) *APIError {
	return &APIError{
		Code:    ErrCodeInvalidRequestBody,
		Message: "Invalid request body or input",
		Details: details,
	}
}

// HTTPStatus maps error codes to HTTP status codes.
func HTTPStatus(code string) int {
	switch code {
	case ErrCodeInvalidRequestBody, ErrCodeValidationError, ErrCodeWeakPassword,
		ErrCodeOTPInvalid, ErrCodeOTPExpired, ErrCodeOTPTooManyAttempts:
		return http.StatusBadRequest
	case ErrCodeUnauthorized, ErrCodeTokenExpired, ErrCodeTokenInvalid, ErrCodeMFARequired:
		return http.StatusUnauthorized
	case ErrCodeForbidden:
		return http.StatusForbidden
	case ErrCodeNotFound:
		return http.StatusNotFound
	case ErrCodeConflict:
		return http.StatusConflict
	case ErrCodeRateLimited:
		return http.StatusTooManyRequests
	case ErrCodeInsufficientFunds, ErrCodePaymentFailed:
		return http.StatusPaymentRequired
	default:
		return http.StatusInternalServerError
	}
}

// Standard errors returned by services.
var (
	ErrInvalidRequestBody  = &APIError{Code: ErrCodeInvalidRequestBody, Message: "Invalid request body"}
	ErrUnauthorized        = &APIError{Code: ErrCodeUnauthorized, Message: "Authentication required"}
	ErrForbidden           = &APIError{Code: ErrCodeForbidden, Message: "Access denied"}
	ErrNotFound            = &APIError{Code: ErrCodeNotFound, Message: "Resource not found"}
	ErrRateLimited         = &APIError{Code: ErrCodeRateLimited, Message: "Too many requests"}
	ErrInternalError       = &APIError{Code: ErrCodeInternalError, Message: "Internal server error"}
	ErrEmailNotVerified    = &APIError{Code: ErrCodeEmailNotVerified, Message: "Email not verified"}
	ErrStreamOffline       = &APIError{Code: ErrCodeStreamOffline, Message: "Stream is offline"}
)

// APIResponse is the standard response envelope for all services.
type APIResponse struct {
	Success bool        `json:"success"`
	Data    any         `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
	Meta    *Pagination `json:"meta,omitempty"`
}

// Pagination metadata for list endpoints.
type Pagination struct {
	Page       int `json:"page"`
	PerPage    int `json:"perPage"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

// WriteJSON writes a JSON response with the standard envelope.
func WriteJSON(w http.ResponseWriter, status int, resp APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// WriteData writes a success response with data.
func WriteData(w http.ResponseWriter, status int, data any, meta *Pagination) {
	WriteJSON(w, status, APIResponse{Success: true, Data: data, Meta: meta})
}

// WriteError writes a failure response with an API error.
func WriteError(w http.ResponseWriter, err *APIError) {
	WriteJSON(w, HTTPStatus(err.Code), APIResponse{Success: false, Error: err})
}

// WriteInternalError logs the internal error and returns a generic 500.
func WriteInternalError(w http.ResponseWriter, logMsg string, err error) {
	slog.Error(logMsg, "error", err)
	WriteJSON(w, http.StatusInternalServerError, APIResponse{
		Success: false,
		Error:   ErrInternalError,
	})
}