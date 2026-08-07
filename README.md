# Wiitoo

The next-generation video platform — live-first, VOD-native, creator-wealthy,
AI-moderated, multi-platform by default.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for full decisions and rationale.

### Services

| Service | Port | Description | Dependencies |
|---|---|---|---|
| **auth** | 8081 | Users, JWT, OAuth (Google, Twitch), OTP verification | Postgres, Redis |
| **video** | 8082 | Upload, transcode (HLS/MP4), clip, thumbnail | Postgres, Redis, S3, Transcode API |
| **chat** | 8083 | WebSocket real-time chat, pub/sub, moderation | Postgres, Redis |
| **payment** | 8084 | Paddle, PayPal, USDC, subscriptions, ledger, payouts | Postgres, Redis |
| **stream** | 8085 | Stream CRUD, RTMP ingest, simulcast, analytics | Postgres, Redis, MediaMTX |
| **content** | 8086 | Categories, search, trending, recommendations, reports | Postgres, Redis |
| **notification** | 8087 | In-app + email notifications, preferences | Postgres, Redis |

### Tech Stack

- **Language:** Go 1.23
- **HTTP Router:** Chi
- **Database:** PostgreSQL 16 (pgx)
- **Cache/Queue:** Redis 7
- **Task Queue:** Asynq
- **Video Pipeline:** MediaMTX (RTMP) → Cloud/Gcore Transcode → S3 (R2)
- **Streaming:** HLS via MediaMTX, WebRTC for low-latency
- **Payments:** Paddle (subscriptions) + PayPal (tips+payouts) + USDC (micro-tips)
- **OAuth:** Goth (Google, Twitch, Discord, GitHub)
- **Auth:** JWT (access + refresh tokens), OTP-first verification
- **AI:** Local Whisper + LLM for moderation, pgvector for discovery
- **CDN:** Gcore (native) / Cloudflare (swappable)
- **Deployment:** Docker Compose, multi-stage scratch binaries (~8MB)

## Quick Start

```bash
# Prerequisites: Docker, Go 1.23+

# 1. Start infrastructure
make db-up

# 2. Run a single service (auth example)
make dev-auth

# 3. Or run everything
make up
```

## Development

```bash
# Start infrastructure services
make db-up

# Run a service in dev mode (hot reload)
make dev-auth
make dev-video
make dev-chat

# Run all tests
make test

# Format code
make fmt

# Lint
make vet
```

## Deployment

```bash
# Build Docker images
make docker

# Start everything
make up

# View logs
make logs

# Stop everything
make down
```

## API Overview

All services expose `GET /healthz` health checks.

### Auth API (`/api/v1/auth`)
- `POST /register` — Email/password registration, sends OTP
- `POST /login` — Login with email + password
- `POST /verify` — Verify email with OTP code
- `GET /{provider}/login` — OAuth login (google, twitch, discord)
- `POST /password/reset` — Request password reset OTP
- `POST /password/reset/confirm` — Reset password with OTP
- `POST /token/refresh` — Refresh access token
- `GET /me` — Get current user profile
- `PATCH /me` — Update profile

### Stream API (`/api/v1/stream`)
- `POST /start` — Start a new stream (returns RTMP URL + stream key)
- `POST /{id}/end` — End a stream
- `GET /live` — List all live streams
- `GET /categories` — List categories
- `POST /simulcast` — Configure simulcast targets
- `GET /ingest-servers` — Get optimal ingest endpoints

### Payment API (`/api/v1/payments`)
- `POST /checkout` — Create one-time checkout
- `POST /subscription` — Create subscription
- `POST /tip` — Send a tip to a creator
- `POST /webhook/paddle` — Paddle webhook handler
- `GET /ledger/{creatorId}` — Get creator balance
- `POST /ledger/payout` — Request payout

### Chat API (`/api/v1/chat`)
- `GET /ws/{streamId}` — WebSocket connection for real-time chat
- `GET /messages/{streamId}` — Chat history
- `POST /timeout` — Timeout user from chat
- `POST /ban` — Ban user from chat

## Environment Variables

Each service reads from environment. See `services/*/internal/config/config.go` for all options.

Key shared variables:
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection URL |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `PORT` | `8080` | HTTP listen port |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |

## Creator Economics

- **90/10 revenue split** (platform keeps 10%)
- **Tipping from day one** — no 10k sub gatekeeping
- **Creator Pool** — 5% of platform take distributed by watch time
- **Paddle** handles global tax compliance (VAT/GST)
- **USDC on Solana** enables profitable sub-$1 micro-tips
- **Payout threshold:** $50 minimum, monthly or on-demand

## Simulcast Bridge

Built-in restream to YouTube, Twitch, Kick, and Rumble. Your platform is the
source of truth; the simulcast push happens server-side. Creators keep their
existing audience while building on your platform.

---

Built with 🐾 by [bedrivetech/wiitoo](https://github.com/bedrivetech/wiitoo)