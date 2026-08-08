package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// AdminMiddleware validates JWT and checks admin role.
type AdminMiddleware struct {
	jwtSecret []byte
}

func NewAdminMiddleware() *AdminMiddleware {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		slog.Warn("JWT_SECRET not set, using dev default")
		secret = "dev-secret-change-in-production"
	}
	return &AdminMiddleware{jwtSecret: []byte(secret)}
}

func (m *AdminMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenStr := extractBearer(r)
		if tokenStr == "" {
			http.Error(w, `{"success":false,"error":{"code":"UNAUTHORIZED","message":"Missing token"}}`, http.StatusUnauthorized)
			return
		}
		type Claims struct {
			Sub  string `json:"sub"`
			Role string `json:"role"`
			jwt.RegisteredClaims
		}
		token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return m.jwtSecret, nil
		})
		if err != nil {
			http.Error(w, `{"success":false,"error":{"code":"INVALID_TOKEN","message":"Invalid or expired token"}}`, http.StatusUnauthorized)
			return
		}
		claims := token.Claims.(*Claims)
		if claims.Role != "admin" && claims.Role != "moderator" {
			http.Error(w, `{"success":false,"error":{"code":"FORBIDDEN","message":"Admin access required"}}`, http.StatusForbidden)
			return
		}
		ctx := context.WithValue(r.Context(), ContextKeyUserID, claims.Sub)
		ctx = context.WithValue(ctx, ContextKeyUserRole, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractBearer(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(h, "Bearer ")
}