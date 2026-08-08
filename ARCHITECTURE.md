# Wiitoo — Architecture & Decisions

*Last updated: 2026-08-08*

## Vision

The next-gen video platform fusing the best of YouTube, Twitch, Rumble, and Kick.
Live-first, VOD-native, creator-wealthy, AI-moderated, multi-platform by default.

---

## Tech Stack Decisions (Locked)

| Decision | Choice | Rationale |
|---|---|---|
| **Backend language** | Go | Concurrency model (goroutines) perfect for video pipelines & chat. Single binary deploy. Battle-tested at Twitch/Youtube scale. |
| **Go HTTP framework** | Chi (`go-chi/chi`) | 100% net/http compatible. Composable. Zero framework lock-in. |
| **Database** | PostgreSQL via `pgx` | No-brainer. Battle-tested. Provider-agnostic (RDS, Cloud SQL, Supabase, self-hosted). |
| **Queue** | Asynq (Redis-backed) | Go-native, simple, scales fine for async transcode/notifications/simulcast. |
| **Cache / Pub/Sub** | Redis (interface-based) | Chat fan-out, rate limiting, presence, session cache. Provider-agnostic via interface. |
| **Object Storage** | S3-compatible API (interface-based) | Provider-agnostic: S3, Cloudflare R2, GCS, MinIO, Backblaze B2. Swap easily. |
| **Email** | SMTP (interface-based) | Provider-agnostic: Brevo, SendPulse, Resend, SendGrid, SES, direct SMTP. |
| **Video Pipeline (MVP)** | Cloud PaaS (Gcore or Cloudflare) | All video processing via cloud API calls — no self-hosted FFmpeg, no local transcoding. See `pkg/videopipeline`. |
| **Streaming CDN** | Gcore CDN (native to VM's cloud provider) | Near-zero latency between compute and edge. Swap later via DNS. |
| **Live Streaming Engine** | MediaMTX (RTMP/WHEP ingest) or LiveKit | Self-hosted on VM. Feeds into cloud CDN for edge delivery. |
| **AI / Moderation** | Local Whisper + LLM (Ollama) + pgvector | Auto-captions, contextual moderation, embedding-based discovery. |
| **OAuth library** | Goth or `golang.org/x/oauth2` | Multi-provider (Google, Twitch, Discord, GitHub, Apple). No managed auth vendor lock-in. |
| **Payment (fiat)** | Paddle (MoR) + PayPal (tips + payout rail) | Paddle handles global tax compliance. PayPal for user reach + creator payouts. |
| **Payment (crypto)** | USDC on Solana | Enables profitable sub-$1 superchats (~$0.0002/txn). |
| **Creator verification** | Persona / Onfido / manual | Paddle doesn't do KYC — separate service required. |

---

## Architecture Style: Modular Monolith (MVP → Scale)

Services are organized as separate Go packages with clean boundaries, but **run as a single binary behind one port**. This avoids the operational overhead of 9 separate processes during the MVP phase while preserving the ability to split into independent microservices later.

### Why Modular Monolith (Not Separate Microservices)

- **Single binary** (~26MB) instead of 9 separate processes
- **One port (:8080)** instead of 9 ports
- **One Docker container** instead of 9
- **Shared Postgres + Redis connections** (no duplication per service)
- **Consistent middleware** applied once at the root level
- **Clean package separation** preserved — each `services/{name}/api/` package is self-contained
- **Future-proof**: Any service can be lifted out by copying its router setup into a new `cmd/server/main.go` — the split cost is ~5 lines of boilerplate

### Entry Point

**`cmd/wiitoo/main.go`** — single binary that:
1. Creates shared PostgreSQL pool + Redis client
2. Applies global middleware (CORS, logging, recovery, request ID, timeout, rate limiting)
3. Calls each service's `Setup(r chi.Router, pool, rdb)` to mount routes
4. Starts one HTTP server on `:8080`
5. Handles graceful shutdown (drains all connections, runs cleanup functions)

Individual `services/*/cmd/server/main.go` files remain for testing and future splitting.

```
┌──────────────────────────────────────────────────────────┐
│                  wiitoo:8080 (single binary)              │
│                                                           │
│  /api/v1/auth/...           ← services/auth/api          │
│  /api/v1/video/...          ← services/video/api         │
│  /api/v1/stream/...         ← services/stream/api        │
│  /api/v1/chat/...           ← services/chat/api          │
│  /api/v1/payments/...       ← services/payment/api       │
│  /api/v1/content/...        ← services/content/api       │
│  /api/v1/notifications/...  ← services/notification/api  │
│  /api/v1/admin/email/...    ← services/email/api         │
│  /api/v1/admin/storage/...  ← services/storage/api       │
│                                                           │
│  /healthz                   ← health check                │
└──────────────────────────────────────────────────────────┘
```

---

## Architecture Principles

1. **Provider-agnostic abstractions** — Every external dependency (storage, cache, email, queue, video pipeline) has a Go interface. Changing providers is a config flag, not a rewrite.

2. **Modular monolith, microservices-ready** — Code is organized into bounded packages with public interfaces. Running as one binary today; splitting is a mechanical refactor, not an architectural one.

3. **Simulcast is the wedge** — Built-in restream to YouTube/Twitch/Kick/Rumble. Lowers creator switching cost to zero. Your platform is the source of truth.

4. **Creator economics from day one** — 90/10 revenue split. Tipping/tokens at launch. No "wait for 10k subs" gatekeeping.

5. **AI as infrastructure** — Contextual moderation (not keyword filters), auto-captions, content-based discovery via embeddings, analytics that actually help creators.

---

## Payment Architecture — Paddle + PayPal + Crypto

**No Stripe Connect** (not available in our country). Platform holds creator balances in an internal ledger and pays out manually. More engineering but more control.

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

---

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
- [x] `pkg/storage` — ObjectStore interface + 5 providers (S3, R2, Wasabi, Backblaze, IDrive e2) + multi-provider router (round-robin, geolocation, capacity)
- [x] `pkg/cache` — Cache interface + Redis implementation (pub/sub included)
- [x] `pkg/queue` — TaskQueue interface + Asynq implementation
- [x] `pkg/email` — Sender interface + 4 providers (Brevo, SendPulse, SMTP, Resend) + MultiProvider (primary-fallback, weighted round-robin)
- [x] `pkg/config` — Environment variable loading with defaults
- [x] `pkg/middleware` — RequestLogger, Recovery, Auth (JWT), CORS, RateLimiter, ErrorHandler
- [x] `pkg/database` — PGX pool creation helpers
- [x] `pkg/payment` — Provider + PayoutProvider interfaces; Ledger interface
- [x] `pkg/payment/provider` — PaddleProvider, PayPalProvider (+ payouts), CryptoProvider (USDC/Solana)
- [x] `pkg/videopipeline` — Pipeline interface + 2 cloud providers (Gcore, Cloudflare Stream)
- [x] `pkg/stream` — Stream, ChatMessage, Category, IngestServer, AnalyticsSnapshot types
- [x] `pkg/adminhandler` — Pagination, search, sort helpers for admin CRUD

### ✅ Services (all within single module `github.com/bedrivetech/wiitoo`)
- [x] **Auth** — Register, login, JWT (access+refresh with rotation), OTP verify, password reset, OAuth (Google+Twitch), profile mgmt, rate limiting, email change
- [x] **Video** — Upload, presigned URLs, cloud video pipeline (Gcore/Cloudflare), clip, thumbnail
- [x] **Chat** — WebSocket real-time, Redis pub/sub fan-out, history, timeout/ban, message persistence
- [x] **Payment** — Paddle subscriptions, PayPal tips/payouts, USDC micro-tips, creator ledger, payout engine
- [x] **Stream** — Stream CRUD, RTMP ingest management, simulcast config, MediaMTX webhooks, analytics, categories
- [x] **Content** — Category CRUD, search (pg_trgm), trending, recommendations, content reporting
- [x] **Notification** — In-app notifications, preferences, unread counts, mark read
- [x] **Email (admin)** — Providers CRUD, templates CRUD, send/queue/history, full admin panel
- [x] **Storage (admin)** — Providers CRUD, buckets CRUD, routing rules, multi-strategy assignment

### ✅ Admin Panel (Next.js + Refine + Ant Design)
- [x] **~50 pages across 15 resources**
- [x] Users, videos, streams, categories, subscriptions, transactions, payouts, reports, creator verification, chat messages
- [x] Email providers, email templates, email logs, storage providers, storage buckets, storage routing
- [x] Brand theme (violet/cyan palette, dark mode, Cmd+K search, dashboard with KPIs)
- [x] Bulk operations, CSV export, status tagging, confirmation flows

### ✅ Infrastructure
- [x] `Dockerfile` — Multi-stage Alpine build (~26MB binary)
- [x] `deploy/docker-compose.yaml` — Postgres + Redis + MediaMTX + Wiitoo API (+ Nginx)
- [x] `deploy/nginx/default.conf` — Routing, WebSocket upgrade, HLS CORS
- [x] `deploy/mtx/mediamtx.yml` — RTMP ingest, HLS, WebRTC, webhook hooks
- [x] `deploy/migrations/` — 25 migration pairs (001-025), `migrate.sh` runner
- [x] `deploy/scripts/init-db.sh` — Full schema + seed data
- [x] `.github/workflows/ci.yaml` — Lint, test, build, Docker build on push/PR
- [x] `README.md` — Full docs: architecture, services, API overview, quick start, env vars

### Remaining (Phase 2)
- [ ] End-to-end integration tests
- [ ] AI moderation service (local LLM + pgvector)
- [ ] Main platform frontend (player + chat + creator dashboard)
- [ ] Simulcast bridge implementation (RTMP relay to YouTube/Twitch/Kick)
- [ ] Mobile push notifications
- [ ] Self-hosted cloud pipeline (Phase 3, only if PaaS costs exceed infra cost)
- [ ] Edge caching configuration

*All core decisions baked in. Framework lock-in avoided. Provider-agnostic from day one. Modular monolith — microservices-ready when needed.*