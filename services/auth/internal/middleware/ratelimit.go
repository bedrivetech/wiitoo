package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// RateLimiter provides per-IP and per-user rate limiting backed by Redis.
type RateLimiter struct {
	rdb           *redis.Client
	prefix        string
	ipRate        int
	ipWindow      time.Duration
	userRate      int
	userWindow    time.Duration
	burst         int
}

// NewRateLimiter creates a Redis-backed rate limiter.
// ipRate: max requests per IP per ipWindow. userRate: max requests per authenticated user per userWindow.
func NewRateLimiter(rdb *redis.Client, prefix string, ipRate, userRate int, ipWindow, userWindow time.Duration) *RateLimiter {
	return &RateLimiter{
		rdb:        rdb,
		prefix:     prefix,
		ipRate:     ipRate,
		ipWindow:   ipWindow,
		userRate:   userRate,
		userWindow: userWindow,
	}
}

// RateLimit returns HTTP middleware that rate-limits by IP and optionally by authenticated user.
func (rl *RateLimiter) RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := extractIP(r)

		// Check IP-based limit
		allowed, remaining, reset, err := rl.checkLimit(r.Context(), "ip:"+ip, rl.ipRate, rl.ipWindow)
		if err != nil {
			// If Redis is down, allow the request through but log
			next.ServeHTTP(w, r)
			return
		}

		if !allowed {
			writeRateLimitError(w, remaining, reset)
			return
		}

		// Check user-based limit if authenticated
		if userID, ok := GetUserID(r.Context()); ok {
			allowed, remaining, reset, err = rl.checkLimit(r.Context(), "user:"+userID, rl.userRate, rl.userWindow)
			if err == nil && !allowed {
				writeRateLimitError(w, remaining, reset)
				return
			}
		}

		// Set rate limit headers
		w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rl.ipRate))
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", reset))

		next.ServeHTTP(w, r)
	})
}

// CustomRateLimit returns middleware with custom rate limit parameters for specific routes (e.g., OTP).
func (rl *RateLimiter) CustomRateLimit(rate int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractIP(r)
			allowed, remaining, reset, err := rl.checkLimit(r.Context(), "ip:"+ip, rate, window)
			if err != nil || !allowed {
				if !allowed {
					writeRateLimitError(w, remaining, reset)
					return
				}
				next.ServeHTTP(w, r)
				return
			}

			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rate))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", reset))

			next.ServeHTTP(w, r)
		})
	}
}

// InMemoryRateLimiter is a simple in-memory rate limiter for when Redis is unavailable.
// Used as a fallback or for simpler deployments.
type InMemoryRateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	rate     int
	window   time.Duration
}

func NewInMemoryRateLimiter(rate int, window time.Duration) *InMemoryRateLimiter {
	return &InMemoryRateLimiter{
		requests: make(map[string][]time.Time),
		rate:     rate,
		window:   window,
	}
}

func (l *InMemoryRateLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-l.window)

	// Clean old entries
	times := l.requests[key]
	var valid []time.Time
	for _, t := range times {
		if t.After(windowStart) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= l.rate {
		l.requests[key] = valid
		return false
	}

	l.requests[key] = append(valid, now)
	return true
}

// InMemoryRateLimit is middleware using the in-memory rate limiter.
func (l *InMemoryRateLimiter) InMemoryRateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := extractIP(r)
		if !l.Allow(ip) {
			writeRateLimitError(w, 0, time.Now().Add(l.window).Unix())
			return
		}
		next.ServeHTTP(w, r)
	})
}

// --- private helpers ---

func (rl *RateLimiter) checkLimit(ctx context.Context, key string, rate int, window time.Duration) (bool, int, int64, error) {
	redisKey := rl.prefix + "ratelimit:" + key
	now := time.Now().UnixNano()
	windowStart := now - window.Nanoseconds()

	// Remove old entries and count current ones in a Lua script for atomicity
	script := `
		redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
		local count = redis.call('ZCARD', KEYS[1])
		if count < tonumber(ARGV[2]) then
			redis.call('ZADD', KEYS[1], ARGV[3], ARGV[4])
			redis.call('EXPIRE', KEYS[1], ARGV[5])
			return {1, count + 1}
		end
		return {0, count}
	`

	raw, err := rl.rdb.Eval(ctx, script, []string{redisKey},
		windowStart, rate, now, fmt.Sprintf("%d:%s", now, key), int(window.Seconds()),
	).Result()
	if err != nil {
		return false, 0, 0, err
	}

	result, ok := raw.([]interface{})
	if !ok || len(result) < 2 {
		return false, 0, 0, fmt.Errorf("unexpected eval result: %v", raw)
	}

	allowedInt, ok := result[0].(int64)
	if !ok {
		return false, 0, 0, fmt.Errorf("unexpected allowed type: %T", result[0])
	}
	countInt, ok := result[1].(int64)
	if !ok {
		return false, 0, 0, fmt.Errorf("unexpected count type: %T", result[1])
	}
	allowed := allowedInt == 1
	remaining := rate - int(countInt)
	if remaining < 0 {
		remaining = 0
	}

	// Get TTL for reset time
	ttl, _ := rl.rdb.TTL(ctx, redisKey).Result()
	resetAt := time.Now().Add(ttl).Unix()
	if ttl < 0 {
		resetAt = time.Now().Add(window).Unix()
	}

	return allowed, remaining, resetAt, nil
}

func extractIP(r *http.Request) string {
	// Check X-Forwarded-For first
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if ip := net.ParseIP(xff); ip != nil {
			return ip.String()
		}
	}
	// Fall back to X-Real-IP
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		if ip := net.ParseIP(xri); ip != nil {
			return ip.String()
		}
	}
	// Extract from RemoteAddr (strip port)
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func writeRateLimitError(w http.ResponseWriter, remaining int, resetAt int64) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Retry-After", fmt.Sprintf("%d", resetAt-time.Now().Unix()))
	w.WriteHeader(http.StatusTooManyRequests)
	w.Write([]byte(`{"success":false,"data":null,"error":{"code":"RATE_LIMITED","message":"Too many requests. Please try again later."}}`))
}