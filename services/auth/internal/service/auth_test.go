package service

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/bedrivetech/wiitoo/auth/internal/config"
	"github.com/bedrivetech/wiitoo/auth/internal/model"
	"github.com/redis/go-redis/v9"
)

// ---------------------------------------------------------------------------
// In-memory mock for UserRepository
// ---------------------------------------------------------------------------

type mockUserRepo struct {
	mu            sync.Mutex
	users         map[string]*model.User               // email -> user
	usernames     map[string]string                     // username -> email
	refreshTokens map[string]*model.RefreshToken        // tokenHash -> token
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users:         make(map[string]*model.User),
		usernames:     make(map[string]string),
		refreshTokens: make(map[string]*model.RefreshToken),
	}
}

func (m *mockUserRepo) Create(ctx context.Context, email, password, username string) (*model.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now().UTC()
	user := &model.User{
		ID:        email + "-id", // predictable fake ID
		Email:     email,
		Password:  password,
		Username:  username,
		Role:      model.RoleViewer,
		Status:    model.StatusPending,
		CreatedAt: now,
		UpdatedAt: now,
	}
	m.users[email] = user
	m.usernames[username] = email
	return user, nil
}

func (m *mockUserRepo) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	u, ok := m.users[email]
	if !ok {
		return nil, nil
	}
	return u, nil
}

func (m *mockUserRepo) FindByUsername(ctx context.Context, username string) (*model.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	email, ok := m.usernames[username]
	if !ok {
		return nil, nil
	}
	u, ok := m.users[email]
	if !ok {
		return nil, nil
	}
	return u, nil
}

func (m *mockUserRepo) FindByID(ctx context.Context, id string) (*model.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, nil
}

func (m *mockUserRepo) SaveRefreshToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.refreshTokens[tokenHash] = &model.RefreshToken{
		ID:        tokenHash + "-id",
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now().UTC(),
	}
	return nil
}

func (m *mockUserRepo) FindRefreshToken(ctx context.Context, tokenHash string) (*model.RefreshToken, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.refreshTokens[tokenHash]
	if !ok {
		return nil, nil
	}
	return t, nil
}

func (m *mockUserRepo) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if t, ok := m.refreshTokens[tokenHash]; ok {
		now := time.Now().UTC()
		t.RevokedAt = &now
	}
	return nil
}

func (m *mockUserRepo) RevokeAllUserRefreshTokens(ctx context.Context, userID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	now := time.Now().UTC()
	for _, t := range m.refreshTokens {
		if t.UserID == userID {
			t.RevokedAt = &now
		}
	}
	return nil
}

func (m *mockUserRepo) UpdateProfile(ctx context.Context, id string, displayName, avatarURL string) (*model.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, u := range m.users {
		if u.ID == id {
			u.DisplayName = displayName
			u.AvatarURL = avatarURL
			u.UpdatedAt = time.Now().UTC()
			return u, nil
		}
	}
	return nil, nil
}

// ---------------------------------------------------------------------------
// In-memory mock for OTPStorage
// ---------------------------------------------------------------------------

type errKeyNotFound struct{}

func (e *errKeyNotFound) Error() string { return "key not found" }

var errMockKeyNotFound = &errKeyNotFound{}

type mockOTPPipeline struct {
	cmds []func()
}

func (p *mockOTPPipeline) Incr(ctx context.Context, key string) *redis.IntCmd {
	cmd := redis.NewIntCmd(ctx, "INCR", key)
	p.cmds = append(p.cmds, func() { cmd.SetVal(1) })
	return cmd
}

func (p *mockOTPPipeline) Expire(ctx context.Context, key string, expiration time.Duration) *redis.BoolCmd {
	cmd := redis.NewBoolCmd(ctx, "EXPIRE", key, expiration)
	p.cmds = append(p.cmds, func() { cmd.SetVal(true) })
	return cmd
}

func (p *mockOTPPipeline) Exec(ctx context.Context) ([]redis.Cmder, error) {
	for _, fn := range p.cmds {
		fn()
	}
	return nil, nil
}

type mockOTPStorage struct {
	mu   sync.Mutex
	data map[string]string
}

func newMockOTPStorage() *mockOTPStorage {
	return &mockOTPStorage{data: make(map[string]string)}
}

func (m *mockOTPStorage) Get(ctx context.Context, key string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	v, ok := m.data[key]
	if !ok {
		return "", redis.Nil
	}
	return v, nil
}

func (m *mockOTPStorage) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[key] = toString(value)
	return nil
}

func (m *mockOTPStorage) Del(ctx context.Context, keys ...string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, k := range keys {
		delete(m.data, k)
	}
	return nil
}

func (m *mockOTPStorage) Exists(ctx context.Context, keys ...string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var count int64
	for _, k := range keys {
		if _, ok := m.data[k]; ok {
			count++
		}
	}
	return count, nil
}

func (m *mockOTPStorage) TTL(ctx context.Context, key string) (time.Duration, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.data[key]; ok {
		return time.Hour, nil // non-expired
	}
	return -2 * time.Second, nil // key does not exist
}

func (m *mockOTPStorage) Incr(ctx context.Context, key string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	v, ok := m.data[key]
	var n int
	if ok {
		n, _ = parseInt(v)
	}
	n++
	m.data[key] = itoa(n)
	return int64(n), nil
}

func (m *mockOTPStorage) Expire(ctx context.Context, key string, expiration time.Duration) (bool, error) {
	return true, nil
}

func (m *mockOTPStorage) Pipeline() OTPPipeline {
	return &mockOTPPipeline{}
}

// helpers
func toString(v interface{}) string {
	switch s := v.(type) {
	case string:
		return s
	default:
		return ""
	}
}

func parseInt(s string) (int, error) {
	n := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + int(c-'0')
		} else {
			return 0, nil
		}
	}
	return n, nil
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [20]byte
	pos := len(buf)
	for n > 0 {
		pos--
		buf[pos] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[pos:])
}

// ---------------------------------------------------------------------------
// Test config
// ---------------------------------------------------------------------------

func testConfig() *config.Config {
	return &config.Config{
		JWTSecret:       "test-secret-key-for-testing-only",
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 7 * 24 * time.Hour,
		RedisPrefix:     "fusion:auth:",
		OTPMaxPerHour:   5,
	}
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

func newTestServices(t *testing.T) (*AuthService, *OTPService, *mockUserRepo, *mockOTPStorage) {
	t.Helper()
	cfg := testConfig()
	userRepo := newMockUserRepo()
	authSvc := NewAuthService(userRepo, cfg)
	otpStorage := newMockOTPStorage()
	otpSvc := NewOTPService(otpStorage, cfg)
	return authSvc, otpSvc, userRepo, otpStorage
}

// mustRegister creates a user and returns it, failing the test on error.
func mustRegister(t *testing.T, svc *AuthService, email, password, username string) *model.User {
	t.Helper()
	user, err := svc.Register(context.Background(), model.RegisterRequest{
		Email:    email,
		Password: password,
		Username: username,
	})
	if err != nil {
		t.Fatalf("Register(%q): unexpected error: %v", email, err)
	}
	return user
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

func TestRegister(t *testing.T) {
	authSvc, _, repo, _ := newTestServices(t)

	user := mustRegister(t, authSvc, "alice@example.com", "password123!", "alice")

	if user.ID == "" {
		t.Fatal("expected non-empty user ID")
	}
	if user.Email != "alice@example.com" {
		t.Fatalf("expected email alice@example.com, got %s", user.Email)
	}
	if user.Username != "alice" {
		t.Fatalf("expected username alice, got %s", user.Username)
	}
	if user.Role != model.RoleViewer {
		t.Fatalf("expected role viewer, got %s", user.Role)
	}
	if user.Status != model.StatusPending {
		t.Fatalf("expected status pending, got %s", user.Status)
	}
	if user.Password == "" || user.Password == "password123!" {
		t.Fatal("expected password to be hashed")
	}

	// Verify it was persisted in the mock
	stored, _ := repo.FindByEmail(context.Background(), "alice@example.com")
	if stored == nil {
		t.Fatal("expected user to be stored in repo")
	}
}

func TestRegisterDuplicateEmail(t *testing.T) {
	authSvc, _, _, _ := newTestServices(t)

	mustRegister(t, authSvc, "bob@example.com", "password123!", "bob")

	_, err := authSvc.Register(context.Background(), model.RegisterRequest{
		Email:    "bob@example.com",
		Password: "password123!",
		Username: "bob2",
	})
	if err == nil {
		t.Fatal("expected error for duplicate email, got nil")
	}

	var apiErr *model.APIError
	if asAPIErr(err, &apiErr) {
		if apiErr.Code != model.ErrCodeEmailTaken {
			t.Fatalf("expected code EMAIL_TAKEN, got %s", apiErr.Code)
		}
	} else {
		t.Fatalf("expected APIError, got %T: %v", err, err)
	}
}

func TestLoginSuccess(t *testing.T) {
	authSvc, _, _, _ := newTestServices(t)

	mustRegister(t, authSvc, "carol@example.com", "securePass1!", "carol")

	// Manually set status to active and mark email verified so login works
	ctx := context.Background()
	existing, _ := authSvc.repo.FindByEmail(ctx, "carol@example.com")
	existing.Status = model.StatusActive
	now := time.Now().UTC()
	existing.EmailVerifiedAt = &now

	user, err := authSvc.Login(ctx, "carol@example.com", "securePass1!")
	if err != nil {
		t.Fatalf("expected successful login, got error: %v", err)
	}
	if user.Email != "carol@example.com" {
		t.Fatalf("expected user email carol@example.com, got %s", user.Email)
	}
}

func TestLoginWrongPassword(t *testing.T) {
	authSvc, _, _, _ := newTestServices(t)

	mustRegister(t, authSvc, "dave@example.com", "correctPass1!", "dave")

	ctx := context.Background()
	existing, _ := authSvc.repo.FindByEmail(ctx, "dave@example.com")
	existing.Status = model.StatusActive
	now := time.Now().UTC()
	existing.EmailVerifiedAt = &now

	_, err := authSvc.Login(ctx, "dave@example.com", "wrongPassword1!")
	if err == nil {
		t.Fatal("expected error for wrong password, got nil")
	}

	var apiErr *model.APIError
	if asAPIErr(err, &apiErr) {
		if apiErr.Code != model.ErrCodeInvalidCredentials {
			t.Fatalf("expected code INVALID_CREDENTIALS, got %s", apiErr.Code)
		}
	} else {
		t.Fatalf("expected APIError, got %T: %v", err, err)
	}
}

func TestOTPGenerationAndVerification(t *testing.T) {
	_, otpSvc, _, _ := newTestServices(t)

	ctx := context.Background()
	userID := "test-user-1"

	// Generate OTP
	code, err := otpSvc.GenerateOTP(ctx, userID, OTPPurposeEmailVerify, 10*time.Minute)
	if err != nil {
		t.Fatalf("expected OTP generation to succeed, got: %v", err)
	}
	if len(code) != 6 {
		t.Fatalf("expected 6-digit OTP, got %q (len=%d)", code, len(code))
	}

	// Verify with correct code
	valid, err := otpSvc.VerifyOTP(ctx, userID, OTPPurposeEmailVerify, code)
	if err != nil {
		t.Fatalf("VerifyOTP returned unexpected error: %v", err)
	}
	if !valid {
		t.Fatal("expected OTP verification with correct code to succeed")
	}

	// Generate another OTP for the same user
	code2, _ := otpSvc.GenerateOTP(ctx, userID, OTPPurposeEmailVerify, 10*time.Minute)

	// Verify with wrong code
	valid, err = otpSvc.VerifyOTP(ctx, userID, OTPPurposeEmailVerify, "000000")
	if err != nil {
		t.Fatalf("VerifyOTP with wrong code returned error: %v", err)
	}
	if valid {
		t.Fatal("expected OTP verification with wrong code to fail")
	}

	// Verify the correct code still works
	valid, err = otpSvc.VerifyOTP(ctx, userID, OTPPurposeEmailVerify, code2)
	if err != nil {
		t.Fatalf("VerifyOTP with correct code returned error: %v", err)
	}
	if !valid {
		t.Fatal("expected correct code to verify after one wrong attempt")
	}
}

func TestTokenGeneration(t *testing.T) {
	authSvc, _, _, _ := newTestServices(t)

	user := mustRegister(t, authSvc, "eve@example.com", "tokenTest1!", "eve")

	ctx := context.Background()

	// Generate tokens
	tokens, err := authSvc.GenerateTokens(ctx, user)
	if err != nil {
		t.Fatalf("expected token generation to succeed, got: %v", err)
	}
	if tokens.AccessToken == "" {
		t.Fatal("expected non-empty access token")
	}
	if tokens.RefreshToken == "" {
		t.Fatal("expected non-empty refresh token")
	}

	// Validate the access token
	claims, err := authSvc.VerifyAccessToken(tokens.AccessToken)
	if err != nil {
		t.Fatalf("expected access token validation to succeed, got: %v", err)
	}
	if claims.Sub != user.ID {
		t.Fatalf("expected sub %s, got %s", user.ID, claims.Sub)
	}
	if claims.Role != string(user.Role) {
		t.Fatalf("expected role %s, got %s", user.Role, claims.Role)
	}
}

func TestOTPRateLimit(t *testing.T) {
	_, otpSvc, _, mockStorage := newTestServices(t)

	ctx := context.Background()
	userID := "ratelimited-user"

	// Pre-fill the rate counter to exceed limit
	rateKey := "fusion:auth::otp:rate:" + userID
	_ = mockStorage.Set(ctx, rateKey, "5", time.Hour)

	// Attempt to generate OTP — should be rate limited
	_, err := otpSvc.GenerateOTP(ctx, userID, OTPPurposeEmailVerify, 10*time.Minute)
	if err == nil {
		t.Fatal("expected rate limit error, got nil")
	}

	var apiErr *model.APIError
	if asAPIErr(err, &apiErr) {
		if apiErr.Code != model.ErrCodeOTPRateLimit {
			t.Fatalf("expected code OTP_RATE_LIMITED, got %s", apiErr.Code)
		}
	} else {
		t.Fatalf("expected APIError, got %T: %v", err, err)
	}
}

// asAPIErr is a helper to safely extract *model.APIError from an error.
func asAPIErr(err error, out **model.APIError) bool {
	if err == nil {
		return false
	}
	e, ok := err.(*model.APIError)
	if ok {
		*out = e
		return true
	}
	return false
}