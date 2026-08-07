# Auth Service — Fusion Platform

The auth service handles user authentication, registration, OAuth, and session management for the Fusion Platform.

## Architecture

This service follows a clean layered architecture:

```
cmd/server/main.go   → Entry point, wiring, server startup
internal/handler/    → HTTP handlers (Chi route handlers)
internal/service/    → Business logic (Auth, OTP, OAuth, Email)
internal/repository/ → Database access (pgx)
internal/model/      → Data types and enums
internal/middleware/ → Auth, rate limiting
internal/config/     → Environment-based configuration
migrations/          → SQL migration files
sqlc/                → sqlc query definitions
```

## Tech Stack

- **Go 1.23** with Chi router
- **PostgreSQL** via pgx v5
- **Redis** for OTP storage, rate limiting, session cache
- **Goth** for OAuth (Google + Twitch)
- **golang-jwt** for JWT tokens
- **bcrypt** for password hashing

## Prerequisites

- Go 1.23+
- PostgreSQL 15+
- Redis 7+
- sqlc (optional — for generated queries)

## Setup

### 1. Environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Database

```bash
# Create the database
createdb fusion

# Run migrations
psql fusion < migrations/001_create_users.sql
psql fusion < migrations/002_create_oauth_accounts.sql
```

### 3. Run

```bash
go run ./cmd/server
```

The server starts on `http://localhost:8080`. Health check at `/healthz`.

### 4. (Optional) Generate sqlc queries

```bash
cd sqlc && sqlc generate
```

## API Endpoints

All endpoints are under `/api/v1/auth/`.

### Public

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register with email + password |
| POST | `/login` | Login with email + password |
| POST | `/verify` | Verify email with OTP |
| POST | `/verify/resend` | Resend verification OTP |
| POST | `/password/reset` | Request password reset OTP |
| POST | `/password/reset/confirm` | Confirm password reset |
| POST | `/token/refresh` | Refresh access token |
| GET | `/{provider}/login` | Redirect to OAuth provider |
| GET | `/{provider}/callback` | OAuth callback handler |

### Authenticated (Bearer token)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/logout` | Invalidate refresh tokens |
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update display name / avatar |
| POST | `/email/change` | Request email change |
| POST | `/email/change/confirm` | Confirm email change |

## Response Format

Success:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

## OTP Flow

1. User registers → OTP sent to email
2. User submits code via `POST /verify`
3. On success, email verified, account activated
4. Same pattern for password reset, email change

## OAuth Flow

- `GET /api/v1/auth/google/login` → redirects to Google
- `GET /api/v1/auth/google/callback` → processes response, creates/links user
- Same pattern for Twitch at `/twitch/login` and `/twitch/callback`

## Docker

```bash
# Build
docker build -t fusion-auth .

# Run
docker run -p 8080:8080 --env-file .env fusion-auth
```

## Development

- Use `EMAIL_PROVIDER=console` to see emails in stdout
- Rate limits are relaxed in dev (see `.env.example`)
- OTP codes appear in server logs when using console email