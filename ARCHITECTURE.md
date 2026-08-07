# Wiitoo — Architecture & Decisions

*Last updated: 2025-07-18*

## Vision

The next-gen video platform fusing the best of YouTube, Twitch, Rumble, and Kick.
Live-first, VOD-native, creator-wealthy, AI-moderated, multi-platform by default.

---

## Tech Stack Decisions (Locked)

| Decision | Choice | Rationale |
|---|---|---|
| **Backend language** | Go | Concurrency model (goroutines) perfect for video pipelines & chat. Single binary deploy. Battle-tested at Twitch/Youtube scale. |
| **Go HTTP framework** | Chi (`go-chi/chi`) | 100% net/http compatible. Composable for microservices. Zero framework lock-in. Each microservice stays lean. |
| **Database** | PostgreSQL via `pgx` | No-brainer. Battle-tested. Provider-agnostic (RDS, Cloud SQL, Supabase, self-hosted). |
| **Queue** | Asynq (Redis-backed) | Go-native, simple, scales fine for async transcode/notifications/simulcast. |
| **Cache / Pub/Sub** | Redis (interface-based) | Chat fan-out, rate limiting, presence, session cache. Provider-agnostic via interface. |
| **Object Storage** | S3-compatible API (interface-based) | Provider-agnostic: S3, Cloudflare R2, GCS, MinIO, Backblaze B2. Swap easily. |
| **Email** | SMTP (interface-based) | Provider-agnostic: Resend, SendGrid, SES, direct SMTP. |
| **Video Pipeline (MVP)** | Cloud PaaS (Gcore or Cloudflare) | All video processing via cloud API calls — no self-hosted FFmpeg, no local transcoding. See `pkg/videopipeline`. |
| **Streaming CDN** | Gcore CDN (native to VM's cloud provider) | Near-zero latency between compute and edge. Swap to Cloudflare/Bunny/Fastly later via DNS. |
| **Live Streaming Engine** | MediaMTX (RTMP/WHEP ingest) or LiveKit | Self-hosted on VM. Feeds into cloud CDN for edge delivery. |
| **AI / Moderation** | Local Whisper + LLM (Ollama) + pgvector | Auto-captions, contextual moderation, embedding-based discovery. |
| **OAuth library** | Goth or `golang.org/x/oauth2` | Multi-provider (Google, Twitch, Discord, GitHub, Apple). No managed auth vendor lock-in. |
| **Payment (fiat)** | Paddle (MoR) + PayPal (tips + payout rail) | Paddle handles global tax compliance. PayPal for user reach + creator payouts. |
| **Payment (crypto)** | USDC on Solana | Enables profitable sub-$1 superchats (~$0.0002/txn). |
| **Creator verification** | Persona / Onfido / manual | Paddle doesn't do KYC — separate service required. |

---

## Architecture Principles

1. **Provider-agnostic abstractions** — Every external dependency (storage, cache, email, queue, video pipeline) has a Go interface. Changing providers is a config flag, not a rewrite.

2. **Microservices, not monolith** — Small focused services (auth, video, chat, payment, moderation, simulcast). Each is independently deployable.

3. **Simulcast is the wedge** — Built-in restream to YouTube/Twitch/Kick/Rumble. Lowers creator switching cost to zero. Your platform is the source of truth.

4. **Creator economics from day one** — 90/10 revenue split. Tipping/tokens at launch. No "wait for 10k subs" gatekeeping.

5. **AI as infrastructure** — Contextual moderation (not keyword filters), auto-captions, content-based discovery via embeddings, analytics that actually help creators.

---

## Service Boundaries (Planned)

```
┌──────────────────────────────────────────────────┐
│                     Edge/CDN                      │
│      (Gcore CDN → Cloudflare/Bunny later)        │
└──────────────────────────────────────────────────┘
                        │
┌──────────────────────────────────────────────────┐
│                   API Gateway                     │
│           (Chi router, auth middleware)           │
└──────────────────────────────────────────────────┘
     │           │           │           │
┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐
│  Auth    │ │ Video  │ │ Chat   │ │  Payment     │
│  Service │ │ Service│ │ Service│ │  Service     │
│          │ │        │ │        │ │              │
│ - OAuth  │ │ - RTMP │ │ - WS   │ │ - Paddle     │
│ - JWT    │ │ - HLS  │ │ - Pub  │ │ - PayPal     │
│ - Users  │ │ - Clip │ │ - Sub  │ │ - Crypto     │
│ - Roles  │ │ - VOD  │ │ - Mod  │ │ - Tips       │
│ - Subs   │ │        │ │        │ │ - Payouts    │
│ - Ledger │ │        │ │        │ │              │
└──────────┘ └────────┘ └────────┘ └──────────────┘
     │           │           │           │
┌──────────────────────────────────────────────────┐
│                  Shared Layer                     │
│   (Postgres, Redis, Asynq, S3-compat storage)    │
└──────────────────────────────────────────────────┘
```

---

## Payment Architecture — Paddle + PayPal + Crypto

**No Stripe Connect.** Platform holds creator balances in an internal ledger and pays out manually. More engineering but more control.

### Flow
```
Viewer pays via: Paddle (subscriptions) / PayPal (superchats) / USDC (micro-tips)
     ↓
Funds land in: Platform bank account / PayPal account / Solana wallet
     ↓
Platform credits creator's internal balance ledger
     ↓
At payout threshold ($50 min, monthly) → creator chooses rail:
     → PayPal Payouts (primary fiat)
     → USDC transfer (crypto-native creators)
     → Bank transfer (large amounts, manual)
```

**Revenue split:** 90/10 (negotiable to 95/5). Platform fee after processor costs.

**Creator KYC:** Separate from payments. Persona/Onfido for identity. W-9/W-8BEN for tax docs.

---

## Verification Strategy (OTP-First)

OTP (6-digit codes) for all user-facing verification flows. Links as backup for email clients that strip inline codes.

| Flow | Method | Notes |
|---|---|---|
| **Email verification** | OTP sent to email | 10min TTL. Max 3 attempts before cooldown. Store hashed in Redis. |
| **Password reset** | OTP + link fallback | OTP first (faster UX). If user reports issues, send magic link. |
| **Email change** | OTP to both old + new email | Sensitive action — verify both ends. |
| **Payout setup** | OTP + 24h waiting period | Fraud prevention. Re-auth before payout changes. |
| **Account deletion** | OTP + confirmation email | Two-step: OTP verify then confirm link. |

**Why OTP over magic links:**
- Faster UX — user sees code, types it, done. No switch to email app.
- Works offline — no email app required. SMS as secondary if we add phone.
- Rate-limitable — 3 attempts per OTP, 5 OTPs per email per hour. Brute force doesn't work.
- Reusable pattern — same code works for all flows. Just different TTLs and contexts.

**Implementation:**
- `GenerateOTP(userID, purpose, ttl)` → 6 random digits → SHA256 hash → store in Redis
- `VerifyOTP(userID, purpose, code)` → hash input → compare → delete on success
- Backup link: `GET /auth/verify/{token}` where token is a crypto-random 32-byte URL-safe string

## Interfaces (Provider-Agnostic Contracts)

Will define in Go code: `ObjectStore`, `Cache`, `EmailSender`, `TaskQueue`, `Pipeline` (cloud video processing), `AIEmbedder`, `ChatStream`, `PaymentProvider`, `CryptoWallet`.

---

## MVP Feature Set (Phase 1)

1. Live streaming (RTMP ingest, HLS playback)
2. VOD persistence (streams auto-save, basic trim)
3. Real-time chat (trust-level gating, contextual AI mod)
4. Follow/subscribe (email + social OAuth)
5. Creator revenue at launch (90/10, tipping)
6. Categories + search
7. Clip creation (60s highlights)
8. **Simulcast mode** (built-in restream to legacy platforms)

---

## Scaffold Status

### ✅ Shared Packages (`pkg/`)
- [x] `pkg/apierror` — Standard API errors, response envelope, JSON helpers
- [x] `pkg/storage` — ObjectStore interface + S3 implementation (multipart, presigned, list)
- [x] `pkg/cache` — Cache interface + Redis implementation (pub/sub included)
- [x] `pkg/queue` — TaskQueue interface + Asynq implementation
- [x] `pkg/email` — Sender interface + ConsoleSender + SMTPSender + Builder (templates)
- [x] `pkg/config` — Environment variable loading with defaults
- [x] `pkg/middleware` — RequestLogger, Recovery, ServiceAuth, Auth, CORS
- [x] `pkg/database` — PGX pool creation helpers
- [x] `pkg/payment` — Provider + PayoutProvider interfaces; Ledger interface
- [x] `pkg/payment/provider` — PaddleProvider, PayPalProvider (+ payouts), CryptoProvider (USDC/Solana)
- [x] `pkg/transcode` — Transcoder interface, Presets, all request/response types
- [x] `pkg/stream` — Stream, ChatMessage, Category, IngestServer, AnalyticsSnapshot types

### ✅ Services
- [x] **Auth** (8081) — Register, login, JWT, OAuth (Google/Twitch/Discord via Goth), OTP verification, password reset, profile, rate limiting
- [x] **Video** (8082) — Upload, presigned URLs, transcode to HLS/MP4, clip, thumbnail, presets
- [x] **Chat** (8083) — WebSocket real-time, Redis pub/sub fan-out, history, timeout/ban, message persistence
- [x] **Payment** (8084) — Paddle subscriptions, PayPal tips/payouts, USDC micro-tips, creator ledger, payout engine
- [x] **Stream** (8085) — Stream CRUD, RTMP ingest management, simulcast config, MediaMTX webhooks, analytics, categories
- [x] **Content** (8086) — Category CRUD, search (pg_trgm), trending, recommendations, content reporting
- [x] **Notification** (8087) — In-app notifications, preferences, unread counts, mark read

### ✅ Infrastructure
- [x] `go.work` — Go workspace (pkg + all services)
- [x] `Dockerfile` — Multi-stage scratch build per service (~8MB)
- [x] `deploy/docker-compose.yaml` — Postgres + Redis + MediaMTX + 7 services + Nginx reverse proxy
- [x] `deploy/nginx/default.conf` — Routing, WebSocket upgrade, HLS CORS
- [x] `deploy/mtx/mediamtx.yml` — RTMP ingest, HLS, WebRTC, webhook hooks
- [x] `deploy/scripts/init-db.sh` — Full schema (users, oauth, refresh tokens, videos, streams, simulcast, analytics, chat, subscriptions, transactions, ledger, payouts, categories, reports, notifications, prefs) + seed data
- [x] `Makefile` — dev, db-up, build, test, fmt, vet, up, down, logs, ci
- [x] `.github/workflows/ci.yaml` — Lint, test, build, Docker build on push/PR
- [x] `ARCHITECTURE.md` — All decisions recorded (this file)
- [x] `README.md` — Full docs: architecture, services, API overview, quick start, env vars

### Remaining (Phase 2)
- [ ] End-to-end integration tests
- [ ] AI moderation service (local LLM + pgvector)
- [ ] Creator dashboard with analytics
- [ ] Admin panel for moderation
- [ ] Mobile push notifications
- [ ] Self-hosted cloud pipeline (Phase 3, only if PaaS costs exceed infra cost)
- [ ] Edge caching configuration
- [ ] Tenant/enterprise features

*All core decisions baked in. Framework lock-in avoided. Provider-agnostic from day one.*