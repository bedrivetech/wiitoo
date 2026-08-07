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

// OTPStorage defines the interface for OTP persistence.
// Implementations: redisStorage (real Redis), mapStorage (in-memory for tests).
type OTPStorage interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Del(ctx context.Context, keys ...string) error
	Exists(ctx context.Context, keys ...string) (int64, error)
	TTL(ctx context.Context, key string) (time.Duration, error)
	Incr(ctx context.Context, key string) (int64, error)
	Expire(ctx context.Context, key string, expiration time.Duration) (bool, error)
	Pipeline() OTPPipeline
}

// OTPPipeline defines a pipeline interface for batched Redis commands.
type OTPPipeline interface {
	Incr(ctx context.Context, key string) *redis.IntCmd
	Expire(ctx context.Context, key string, expiration time.Duration) *redis.BoolCmd
	Exec(ctx context.Context) ([]redis.Cmder, error)
}

// redisStorage wraps a *redis.Client to implement OTPStorage.
type redisStorage struct {
	client *redis.Client
}

func (s *redisStorage) Get(ctx context.Context, key string) (string, error) {
	return s.client.Get(ctx, key).Result()
}

func (s *redisStorage) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return s.client.Set(ctx, key, value, expiration).Err()
}

func (s *redisStorage) Del(ctx context.Context, keys ...string) error {
	return s.client.Del(ctx, keys...).Err()
}

func (s *redisStorage) Exists(ctx context.Context, keys ...string) (int64, error) {
	return s.client.Exists(ctx, keys...).Result()
}

func (s *redisStorage) TTL(ctx context.Context, key string) (time.Duration, error) {
	return s.client.TTL(ctx, key).Result()
}

func (s *redisStorage) Incr(ctx context.Context, key string) (int64, error) {
	return s.client.Incr(ctx, key).Result()
}

func (s *redisStorage) Expire(ctx context.Context, key string, expiration time.Duration) (bool, error) {
	return s.client.Expire(ctx, key, expiration).Result()
}

func (s *redisStorage) Pipeline() OTPPipeline {
	return &redisPipeline{pipe: s.client.Pipeline()}
}

// redisPipeline wraps a redis.Pipeline to implement OTPPipeline.
type redisPipeline struct {
	pipe redis.Pipeliner
}

func (p *redisPipeline) Incr(ctx context.Context, key string) *redis.IntCmd {
	return p.pipe.Incr(ctx, key)
}

func (p *redisPipeline) Expire(ctx context.Context, key string, expiration time.Duration) *redis.BoolCmd {
	return p.pipe.Expire(ctx, key, expiration)
}

func (p *redisPipeline) Exec(ctx context.Context) ([]redis.Cmder, error) {
	return p.pipe.Exec(ctx)
}

// Compile-time interface checks.
var _ OTPStorage = (*redisStorage)(nil)
var _ OTPPipeline = (*redisPipeline)(nil)

// OTPService handles OTP generation and verification.
type OTPService struct {
	rdb OTPStorage
	cfg *config.Config
}

// NewOTPService creates an OTPService with the given storage backend.
func NewOTPService(rdb OTPStorage, cfg *config.Config) *OTPService {
	return &OTPService{
		rdb: rdb,
		cfg: cfg,
	}
}

// NewOTPServiceWithRedis creates an OTPService backed by a real *redis.Client.
func NewOTPServiceWithRedis(client *redis.Client, cfg *config.Config) *OTPService {
	return &OTPService{
		rdb: &redisStorage{client: client},
		cfg: cfg,
	}
}

// GenerateOTP creates a 6-digit OTP, hashes it, stores with TTL.
// Returns the plaintext OTP so the caller can send it to the user.
func (s *OTPService) GenerateOTP(ctx context.Context, userID string, purpose OTPPurpose, ttl time.Duration) (string, error) {
	rateKey := fmt.Sprintf("%s:%s:%s", s.cfg.RedisPrefix, otpRateKey, userID)

	// Check rate limit: max OTPs per hour
	countStr, err := s.rdb.Get(ctx, rateKey)
	if err == nil {
		count, _ := strconv.Atoi(countStr)
		if count >= s.cfg.OTPMaxPerHour {
			return "", serviceError(model.ErrCodeOTPRateLimit,
				fmt.Sprintf("Maximum %d OTP requests per hour exceeded", s.cfg.OTPMaxPerHour))
		}
	} else if err != redis.Nil {
		return "", fmt.Errorf("failed to check OTP rate limit: %w", err)
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
	if err := s.rdb.Set(ctx, otpKey, hash, ttl); err != nil {
		return "", fmt.Errorf("failed to store OTP: %w", err)
	}

	// Reset attempts counter for this OTP
	attemptKey := fmt.Sprintf("%s%s:%s:%s:%s", s.cfg.RedisPrefix, otpAttemptKey, string(purpose), userID, hash)
	_ = s.rdb.Set(ctx, attemptKey, 0, ttl)

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
func (s *OTPService) VerifyOTP(ctx context.Context, userID string, purpose OTPPurpose, code string) (bool, error) {
	otpKey := fmt.Sprintf("%s%s:%s:%s", s.cfg.RedisPrefix, otpKeyPrefix, string(purpose), userID)
	storedHash, err := s.rdb.Get(ctx, otpKey)
	if err != nil {
		return false, nil // expired or never generated
	}

	inputHash := hashOTP(code)

	// Check attempts
	attemptKey := fmt.Sprintf("%s%s:%s:%s:%s", s.cfg.RedisPrefix, otpAttemptKey, string(purpose), userID, storedHash)
	attemptsStr, err := s.rdb.Get(ctx, attemptKey)
	attempts := 0
	if err == nil {
		attempts, _ = strconv.Atoi(attemptsStr)
	}
	if attempts >= maxOTPAttempts {
		s.rdb.Del(ctx, otpKey, attemptKey)
		return false, nil
	}

	if storedHash != inputHash {
		s.rdb.Incr(ctx, attemptKey)
		return false, nil
	}

	// Success — clean up
	s.rdb.Del(ctx, otpKey, attemptKey)
	return true, nil
}

// CanResendOTP checks if the user can request another OTP (cooldown check).
func (s *OTPService) CanResendOTP(ctx context.Context, userID string, purpose OTPPurpose) (bool, time.Duration) {
	cooldownKey := fmt.Sprintf("%s%s:%s:%s:cooldown", s.cfg.RedisPrefix, otpRateKey, string(purpose), userID)
	exists, err := s.rdb.Exists(ctx, cooldownKey)
	if err != nil || exists == 0 {
		return true, 0
	}

	remaining, err := s.rdb.TTL(ctx, cooldownKey)
	if err != nil || remaining < 0 {
		return true, 0
	}
	return false, remaining
}

// MarkOTPResend marks the cooldown for resending OTP.
func (s *OTPService) MarkOTPResend(ctx context.Context, userID string, purpose OTPPurpose) error {
	cooldownKey := fmt.Sprintf("%s%s:%s:%s:cooldown", s.cfg.RedisPrefix, otpRateKey, string(purpose), userID)
	return s.rdb.Set(ctx, cooldownKey, 1, otpCooldown)
}

// hashOTP hashes an OTP code for secure storage.
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