package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/bedrivetech/wiitoo/services/auth/internal/model"
	"github.com/bedrivetech/wiitoo/services/auth/internal/service"
)

type contextKey string

const (
	// UserIDKey is the context key for the authenticated user's ID.
	UserIDKey contextKey = "user_id"
	// UserRoleKey is the context key for the authenticated user's role.
	UserRoleKey contextKey = "user_role"
)

// AuthMiddleware validates JWT access tokens from the Authorization header.
type AuthMiddleware struct {
	authService *service.AuthService
}

func NewAuthMiddleware(authService *service.AuthService) *AuthMiddleware {
	return &AuthMiddleware{authService: authService}
}

// Authenticate is middleware that validates the Bearer token and injects user info into the request context.
func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenStr := extractBearerToken(r)
		if tokenStr == "" {
			writeAuthError(w, model.ErrCodeUnauthorized, "Missing or malformed Authorization header")
			return
		}

		claims, err := m.authService.VerifyAccessToken(tokenStr)
		if err != nil {
			writeAuthError(w, model.ErrCodeInvalidToken, "Invalid or expired access token")
			return
		}

		// Inject user info into context
		ctx := context.WithValue(r.Context(), UserIDKey, claims.Sub)
		ctx = context.WithValue(ctx, UserRoleKey, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole returns middleware that checks the user has at least the specified role.
func (m *AuthMiddleware) RequireRole(role model.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole, ok := r.Context().Value(UserRoleKey).(string)
			if !ok {
				writeAuthError(w, model.ErrCodeUnauthorized, "Authentication required")
				return
			}

			roles := map[string]int{
				string(model.RoleViewer):   0,
				string(model.RoleCreator):  1,
				string(model.RoleModerator): 2,
				string(model.RoleAdmin):    3,
			}

			if roles[userRole] < roles[string(role)] {
				writeAuthError(w, model.ErrCodeUnauthorized, "Insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// OptionalAuth attempts to authenticate but doesn't require it.
// Useful for endpoints that behave differently for authenticated users.
func (m *AuthMiddleware) OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenStr := extractBearerToken(r)
		if tokenStr != "" {
			claims, err := m.authService.VerifyAccessToken(tokenStr)
			if err == nil {
				ctx := context.WithValue(r.Context(), UserIDKey, claims.Sub)
				ctx = context.WithValue(ctx, UserRoleKey, claims.Role)
				r = r.WithContext(ctx)
			}
		}
		next.ServeHTTP(w, r)
	})
}

// GetUserID extracts the user ID from the request context.
func GetUserID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(UserIDKey).(string)
	return id, ok
}

// GetUserRole extracts the user role from the request context.
func GetUserRole(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(UserRoleKey).(string)
	return role, ok
}

// MustGetUserID extracts the user ID, panics if not present (use only in authenticated handlers).
func MustGetUserID(ctx context.Context) string {
	id, ok := GetUserID(ctx)
	if !ok {
		panic("user ID not found in context — ensure Authenticate middleware is applied")
	}
	return id
}

func extractBearerToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
		return ""
	}
	return parts[1]
}

func writeAuthError(w http.ResponseWriter, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(`{"success":false,"data":null,"error":{"code":"` + code + `","message":"` + message + `"}}`))
}