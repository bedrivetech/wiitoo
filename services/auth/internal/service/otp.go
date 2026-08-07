package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"

	"github.com/fusion-platform/auth/internal/config"
	"github.com/fusion-platform/auth/internal/model"
	"github.com/redis/go-redis/v9"
)

const (
	otpKeyPrefix    = "otp"
	otpAttemptKey   = "otp:attempts"
	otpRateKey      = "otp:rate"
	maxOTPAttempts  = 3
	maxOTPPerHour   = 5
	otpCooldown     = 60 * time.Second
)

// OTPPurpose defines what the OTP is used for.
type OTPPurpose string

const (
	OTPPurposeEmailVerify    OTPPurpose = "email_verify"
	OTPPurposePasswordReset  OTPPurpose = "password_reset"
	OTPPurposeEmailChangeOld OTPPurpose = "email_change_old"
	OTPPurposeEmailChangeNew OTPPurpose = "email_change_new"
)

// OTPService handles OTP generation and verification via Redis.
type OTPService struct {
	rdb     *redis.Client
	cfg     *config.Config
}

func NewOTPService(rdb *redis.Client, cfg *config.Config) *OTPService {
	return &OTPService{
		rdb: rdb,
		cfg: cfg,
	}
}

// GenerateOTP creates a 6-digit OTP, hashes it, stores in Redis with TTL.
// Returns the plaintext OTP so the caller can send it to the user.
func (s *OTPService) GenerateOTP(ctx context.Context, userID string, purpose OTPPurpose, ttl time.Duration) (string, error) {
	rateKey := fmt.Sprintf("%s:%s:%s", s.cfg.RedisPrefix, otpRateKey, userID)

	// Check rate limit: max OTPs per hour
	count, err := s.rdb.Get(ctx, rateKey).Int()
	if err != nil && err != redis.Nil {
		return "", fmt.Errorf("failed to check OTP rate limit: %w", err)
	}
	if count >= s.cfg.OTPMaxPerHour {
		return "", serviceError(model.ErrCodeOTPRateLimit,
			fmt.Sprintf("Maximum %d OTP requests per hour exceeded", s.cfg.OTPMaxPerHour))
	}

	// Generate 6 random digits
	code, err := generateRandomDigits(6)
	if err != nil {
		return "", fmt.Errorf("failed to generate OTP: %w", err)
	}

	// Hash the code for storage
	hash := hashOTP(code)

	// Store hashed OTP
	otpKey := fmt.Sprintf("%s%s:%s:%s", s.cfg.RedisPrefix, otpKeyPrefix, string(purpose), userID)
	if err := s.rdb.Set(ctx, otpKey, hash, ttl).Err(); err != nil {
		return "", fmt.Errorf("failed to store OTP: %w", err)
	}

	// Reset attempts counter for this OTP
	attemptKey := fmt.Sprintf("%s%s:%s:%s:%s", s.cfg.RedisPrefix, otpAttemptKey, string(purpose), userID, hash)
	s.rdb.Set(ctx, attemptKey, 0, ttl)

	// Increment rate counter with TTL
	pipe := s.rdb.Pipeline()
	pipe.Incr(ctx, rateKey)
	pipe.Expire(ctx, rateKey, time.Hour)
	if _, err := pipe.Exec(ctx); err != nil {
		return "", fmt.Errorf("failed to update OTP rate limit: %w", err)
	}

	return code, nil
}

// VerifyOTP checks if the provided code matches the stored hash.
// Returns true if valid, false if not. Deletes on success, invalidates on max attempts.
func (s *OTPService) VerifyOTP(ctx context.Context, userID string, purpose OTPPurpose, code string) (bool, error) {
	otpKey := fmt.Sprintf("%s%s:%s:%s", s.cfg.RedisPrefix, otpKeyPrefix, string(purpose), userID)
	storedHash, err := s.rdb.Get(ctx, otpKey).Result()
	if err != nil {
		if err == redis.Nil {
			return false, nil // expired or never generated
		}
		return false, fmt.Errorf("failed to get OTP from Redis: %w", err)
	}

	inputHash := hashOTP(code)

	// Check attempts
	attemptKey := fmt.Sprintf("%s%s:%s:%s:%s", s.cfg.RedisPrefix, otpAttemptKey, string(purpose), userID, storedHash)
	attempts, err := s.rdb.Get(ctx, attemptKey).Int()
	if err != nil && err != redis.Nil {
		return false, fmt.Errorf("failed to get OTP attempts: %w", err)
	}
	if attempts >= maxOTPAttempts {
		// Too many attempts — delete the OTP
		s.rdb.Del(ctx, otpKey, attemptKey)
		return false, nil
	}

	if storedHash != inputHash {
		// Increment attempts
		s.rdb.Incr(ctx, attemptKey)
		return false, nil
	}

	// Success — clean up
	s.rdb.Del(ctx, otpKey, attemptKey)
	return true, nil
}

// CanResendOTP checks if the user can request another OTP (cooldown check).
func (s *OTPService) CanResendOTP(ctx context.Context, userID string, purpose OTPPurpose) (bool, time.Duration) {
	rateKey := fmt.Sprintf("%s%s:%s", s.cfg.RedisPrefix, otpRateKey, userID)
	// Use the TTL of the rate key as a proxy for last request time.
	ttl, err := s.rdb.TTL(ctx, rateKey).Result()
	if err != nil || ttl < 0 {
		return true, 0
	}
	// If the TTL is close to an hour, we just started. The cooldown is from the last increment.
	// We use a separate cooldown key for precise tracking.
	cooldownKey := fmt.Sprintf("%s%s:%s:%s:cooldown", s.cfg.RedisPrefix, otpRateKey, string(purpose), userID)
	exists, err := s.rdb.Exists(ctx, cooldownKey).Result()
	if err != nil || exists == 0 {
		return true, 0
	}

	remaining, err := s.rdb.TTL(ctx, cooldownKey).Result()
	if err != nil || remaining < 0 {
		return true, 0
	}
	return false, remaining
}

// MarkOTPResend marks the cooldown for resending OTP.
func (s *OTPService) MarkOTPResend(ctx context.Context, userID string, purpose OTPPurpose) error {
	cooldownKey := fmt.Sprintf("%s%s:%s:%s:cooldown", s.cfg.RedisPrefix, otpRateKey, string(purpose), userID)
	return s.rdb.Set(ctx, cooldownKey, 1, otpCooldown).Err()
}

// hasher for OTP
func hashOTP(code string) string {
	h := sha256.Sum256([]byte(strings.TrimSpace(code)))
	return hex.EncodeToString(h[:])
}

// generateRandomDigits returns n random decimal digits as a string.
func generateRandomDigits(n int) (string, error) {
	var sb strings.Builder
	for i := 0; i < n; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		sb.WriteString(strconv.Itoa(int(num.Int64())))
	}
	return sb.String(), nil
}