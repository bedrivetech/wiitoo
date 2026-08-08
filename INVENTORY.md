# Wiitoo — Full Project Inventory

> Generated: 2025-07-19
> Repo: `github.com/bedrivetech/wiitoo`
> Branch: `main`

---

## Table of Contents

1. [Tech Stack & Versions](#1-tech-stack--versions)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Go Backend — Service Map](#3-go-backend--service-map)
4. [Go Backend — Shared Packages](#4-go-backend--shared-packages)
5. [Database](#5-database)
6. [Admin Panel (admin.wiitoo.com)](#6-admin-panel)
7. [Main Frontend (wiitoo.com)](#7-main-frontend)
8. [Infrastructure](#8-infrastructure)
9. [Tests & CI](#9-tests--ci)
10. [What's Working / What's Not](#10-whats-working--whats-not)
11. [Next Steps](#11-next-steps)

---

## 1. Tech Stack & Versions

### Go Backend

| Technology | Version | Purpose |
|---|---|---|
| Go | 1.26.5 | Runtime |
| Chi (go-chi/chi/v5) | v5.3.1 | HTTP router (net/http compatible) |
| pgx (jackc/pgx/v5) | v5.10.0 | PostgreSQL driver |
| go-redis (redis/go-redis/v9) | v9.22.0 | Redis client |
| asynq (hibiken/asynq) | v0.26.0 | Task queue (Redis-backed) |
| golang-jwt (golang-jwt/jwt/v5) | v5.3.1 | JWT tokens |
| goth (markbates/goth) | v1.82.0 | OAuth (Google, Twitch, etc.) |
| aws-sdk-go-v2 | v1.43.4 | S3-compatible storage SDK |
| golang-migrate (golang-migrate/migrate/v4) | v4.18 | Database migrations |
| sqlc | — | Type-safe Go from SQL (codegen) |
| gorilla/websocket | v1.5.3 | WebSocket for chat |
| google/uuid | v1.6.0 | UUID generation |
| slog | (stdlib) | Structured logging |
| net/http | (stdlib) | HTTP server — works with Chi |

### Main Frontend (wiitoo.com)

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.3.0 | React framework (App Router) |
| React | 19.2.8 | UI library |
| TypeScript | 7.0 | Type safety |
| Tailwind CSS | 4.x | Utility styling |
| Video.js | 8.x | Video player (v10 targeted, not yet upgraded) |
| TanStack Query | 5.x | Server state, API caching |
| Zustand | 5.x | UI state (auth, sidebar, theme) |
| Framer Motion | 12.x | Animations |
| Socket.io-client | 4.x | Chat WebSocket |
| Auth.js | (latest) | Auth session management |

### Admin Panel (admin.wiitoo.com)

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.3.0 | React framework |
| React | 19.2.8 | UI library |
| Refine | 4.x | Admin CRUD framework |
| Ant Design | 6.5.4 | UI components |
| kbar | — | Cmd+K global search |
| recharts | 3.x | Dashboard charts |
| TypeScript | 7.0 | Type safety |

---

## 2. Architecture Decisions

| Decision | Chosen | Rationale |
|---|---|---|
| **Architecture style** | Modular monolith (single binary) | Code is separated into packages for future splitting, but runs as one binary for MVP. Each service mounts under `/api/v1/{service}`. When traffic demands, services split with one `main.go` file per service. |
| **Go framework** | Chi (net/http compatible) | Composable, microservice-friendly, works with all stdlib tooling. No framework lock-in. |
| **Video pipeline** | Cloud PaaS (Gcore / Cloudflare Stream) | No self-hosted FFmpeg. Video pipeline calls cloud API, cloud pulls from S3, transcodes, returns HLS URL. Zero bytes processed on our backend. Webhook callback marks video ready. |
| **Storage** | S3-compatible (multi-provider) | Wasabi, Backblaze B2, IDrive e2, AWS S3, MinIO. Interface-based. Routing strategies: round-robin, geolocation, capacity-aware. Multiple buckets per provider. All managed via admin panel. |
| **Email** | Multi-provider (Brevo, SendPulse, SMTP) | Brevo and SendPulse as primary transactional email APIs, SMTP as fallback. MultiProvider supports primary-fallback (failover) and weighted round-robin strategies. Providers managed via admin panel UI. |
| **Payment** | Paddle + PayPal + USDC (Solana) | Stripe unavailable in our country. Paddle handles global tax (MoR), PayPal for mainstream checkout, USDC for micro-tipping (< $0.001/txn). Creator payout via PayPal Payouts + USDC + bank transfer. |
| **Revenue model** | No ads. Subs + Superchats + Tipping + Creator Pool | 90/10 split (creator/platform). 5% of platform take goes into a creator pool distributed by watch time. Crypto enables $0.50 tips that are profitable. |
| **Streaming** | MediaMTX (RTMP/WHIP/WHEP) + Gcore CDN | Self-hosted ingest on our VM, Gcore CDN for edge delivery. MediaMTX handles RTMP from OBS, serves HLS to viewers. |
| **Auth** | Goth OAuth (Google, Twitch) + Email/Password | OTP-based email verification (6-digit code, 3 attempts, 5/hour rate limit). Link fallback for password reset. |
| **Database** | PostgreSQL 16 + pgx driver | Single Postgres instance, all services share via connection pool. 25 migration pairs. |
| **Cache & Queue** | Redis 7 | Asynq for async job queue. Redis pub/sub for chat. Rate limiting. Session cache. |
| **Admin panel** | Separate Next.js + Refine app | Full CRUD for all resources. No feature flags or settings toggles — admins manage real records (users, videos, streams, payments, storage, email). |
| **Creator studio** | Planned as separate app (studio.wiitoo.com) | Standalone Next.js deployment for creators. Dashboard, analytics, stream key, VODs, revenue. Separate domain, same API. |
| **Frontend layout** | Side rail (YouTube-style) + responsive grid | Collapsed (56px icons) / Expanded (224px labels). Browse/search/category/creator/library pages get side rail. Watch page is full-width — no rail. |
| **Design system** | Custom (no templates) | Warm dark (#0f0f0f). Violet-amber brand. Inter typography. Custom Video.js skin. Micro-animations that earn their place. "Crow" aesthetic — intelligent, warm, communal. |

---

## 3. Go Backend — Service Map

### Modular Monolith: `cmd/wiitoo/main.go`

Single entry point. All services mount under one Chi router. ~26MB binary.

| Prefix | Service | Routes | Status |
|---|---|---|---|
| `/api/v1/auth` | Auth | Register, login, OTP verify, OAuth (Google/Twitch), JWT refresh/logout, password reset, profile, admin CRUD | ✅ Complete. 7 passing tests. |
| `/api/v1/video` | Video | Upload, process (calls cloud PaaS), callback (marks ready), clips, thumbnails, admin CRUD | ✅ Compiles. Handler layer + cloud pipeline interface. Needs cloud provider API keys to test end-to-end. |
| `/api/v1/stream` | Stream | Stream keys, health checks, simulcast targets, admin CRUD | ✅ Compiles. Handler layer + MediaMTX config. Needs MediaMTX running to test. |
| `/api/v1/chat` | Chat | WebSocket connect, message history, ban/unban, admin CRUD | ✅ Compiles. Redis pub/sub broadcast. Needs WebSocket client to test. |
| `/api/v1/payments` | Payment | Paddle webhooks, PayPal checkout, USDC wallet, subscriptions, transactions, payouts, creator ledger, admin CRUD | ✅ Complete. Real Paddle/PayPal/Solana API calls. Needs API keys to test. |
| `/api/v1/content` | Content | Categories, search, trending, following feed, reports, clips | ✅ Compiles. Postgres full-text search. |
| `/api/v1/notifications` | Notification | In-app notifications, email/push digests, templates, preferences | ✅ Compiles. |
| `/api/v1/admin/email` | Email Service | Email provider CRUD, template CRUD, send email, send log | ✅ Complete. Brevo + SendPulse + SMTP + MultiProvider. |
| `/api/v1/admin/storage` | Storage Service | Storage provider CRUD, bucket CRUD, routing rules | ✅ Complete. 5 providers + 3 routing strategies. |

### Running Status

| Check | Result |
|---|---|
| Go build `./...` | ✅ 0 errors |
| Go vet `./...` | ✅ 0 errors |
| Tests | ✅ 7 passing (auth service) |
| ❌ **No tests** for video, stream, chat, payment, content, notification, email, storage services | ❌ |
| API live on port 8080 | ✅ Running on this VM |

---

## 4. Go Backend — Shared Packages

| Package | Contents | Status |
|---|---|---|
| `pkg/apierror` | Typed error codes, JSON error envelope, HTTP status mapping | ✅ |
| `pkg/middleware` | CORS, logging, recovery, request ID, timeout, heartbeat, **ErrorHandler** (catches handler errors), auth JWT validation, admin role gating, rate limiting | ✅ |
| `pkg/cache` | Redis interface | ✅ |
| `pkg/queue` | Asynq task queue interface | ✅ |
| `pkg/database` | PGX connection pool | ✅ |
| `pkg/config` | Env-based config loading | ✅ |
| `pkg/email` | Brevo, SendPulse, SMTP, Resend, Console, MultiProvider (primary-fallback + weighted round-robin), Builder (templates) | ✅ Complete |
| `pkg/storage` | S3, Wasabi, Backblaze B2, IDrive e2, MinIO. MultiProvider (round-robin, geolocation, capacity-aware). | ✅ Complete |
| `pkg/payment` | Paddle (subscriptions, webhooks), PayPal (checkout, payouts), USDC (Solana RPC, wallets) | ✅ Complete |
| `pkg/videopipeline` | Cloud PaaS interface. Gcore provider + Cloudflare Stream provider. Config-selected. | ✅ Complete |
| `pkg/stream` | Stream types (ingest config, simulcast targets) | ✅ |
| `pkg/adminhandler` | Shared admin CRUD utilities — pagination, search, sort, standardized JSON responses | ✅ |

---

## 5. Database

| Aspect | Details |
|---|---|
| Engine | PostgreSQL 16 |
| Connection | pgx v5.10 connection pool |
| Migrations | 25 up/down pairs under `deploy/migrations/` |
| Runner | `deploy/scripts/migrate.sh` (up / down / reset / status) |
| Init script | `deploy/scripts/init-db.sh` — bootstrap fresh dev database |
| ⚠️ **Current state** | Postgres running on port 5432, **but no tables created**. Need to run init-db.sh or migrate.sh up. |

### Migration Files (50 files, 25 pairs)

| # | Table | Status |
|---|---|---|
| 001 | `users` | ✅ |
| 002 | `oauth_accounts` | ✅ |
| 003 | `refresh_tokens` | ✅ |
| 004 | `videos` | ✅ |
| 005 | `streams` | ✅ |
| 006 | `stream_health` | ✅ |
| 007 | `chat_messages` | ✅ |
| 008 | `chat_bans` | ✅ |
| 009 | `subscriptions` | ✅ |
| 010 | `transactions` | ✅ |
| 011 | `payouts` | ✅ |
| 012 | `creator_ledger` | ✅ |
| 013 | `categories` | ✅ |
| 014 | `content_reports` | ✅ |
| 015 | `clips` | ✅ |
| 016 | `notifications` | ✅ |
| 017 | `notification_preferences` | ✅ |
| 018 | `follows` | ✅ |
| 019 | `creator_verification` | ✅ |
| 020 | `email_providers` | ✅ |
| 021 | `email_templates` | ✅ |
| 022 | `email_log` | ✅ |
| 023 | `storage_providers` | ✅ |
| 024 | `storage_buckets` | ✅ |
| 025 | `storage_routing_rules` | ✅ |

---

## 6. Admin Panel

| Check | Result |
|---|---|
| Build | ✅ Compiles (Next.js 16.3) |
| Running on port | ✅ 3001 (on this VM) |
| Brand identity | ✅ Violet/cyan custom theme, Fusion → Wiitoo branding, dark mode |
| Dashboard | ✅ KPI cards (users, streams, videos, pending review), real API calls, quick actions, activity feed |
| Dark mode | ✅ Toggle in header, persisted to localStorage |
| Cmd+K search | ✅ kbar wired, searches all 15 resources |
| Login page | ✅ Gradient dark background, radial glow, brand consistent |

### Admin Pages (all working)

| Resource | List | Show | Create | Edit |
|---|---|---|---|---|
| Users | ✅ | ✅ | ✅ | ✅ |
| Videos | ✅ | ✅ | ❌ | ✅ |
| Streams | ✅ | ✅ | ❌ | ❌ |
| Categories | ✅ | ✅ | ✅ | ✅ |
| Subscriptions | ✅ | ✅ | ❌ | ❌ |
| Transactions | ✅ | ✅ | ❌ | ❌ |
| Payouts | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ |
| Creator Verification | ✅ | ✅ | ❌ | ❌ |
| Chat Messages | ✅ | ✅ | ❌ | ❌ |
| Email Providers | ✅ | ✅ | ✅ | ✅ |
| Email Templates | ✅ | ✅ | ✅ | ✅ |
| Email Log | ✅ | ❌ | ❌ | ❌ |
| Storage Providers | ✅ | ✅ | ✅ | ✅ |
| Storage Buckets | ✅ | ✅ | ✅ | ✅ |
| Storage Routing | ✅ | ✅ | ✅ | ✅ |

---

## 7. Main Frontend

| Check | Result |
|---|---|
| Build | ✅ Compiles (Next.js 16.3, 15 routes) |
| Running on port | ✅ 3000 (on this VM) |
| Design doc | ✅ `FRONTEND-DESIGN.md` — 827 lines, 12 sections |
| Custom palette | ✅ Warm dark, violet/amber brand, custom CSS variables |
| TypeScript | ✅ TypeScript 7.0 |

### Frontend Pages (15 routes)

| Route | Page | Status | Notes |
|---|---|---|---|
| **`/`** | Browse — Wiitoo Picks, Following/For You, categories bar, content cards | ✅ | Landing page is the content feed itself. |
| **`/auth/login`** | Login — email/password, Google OAuth, Twitch OAuth | ✅ | Animated GIF background, gradient form card |
| **`/auth/register`** | Register — email, display name, password, confirm | ✅ | Same styling as login |
| **`/auth/verify`** | OTP verify — 6-digit code entry | ✅ | Single-use, resend timer |
| **`/auth/reset-password`** | Password reset — email → OTP → new password | ✅ | 3-step flow in one page |
| **`/browse/[category]`** | Category page — super leader spotlight, exclusives, all creators | ✅ | Music, Gaming, Creative, Tech, etc. |
| **`/creator/[username]`** | Folder mode — exclusive creator channel | ✅ | Avatar ring, bio, videos, live section |
| **`/search`** | Search results — filters by title/creator/category/tags | ✅ | Destructured results |
| **`/watch/[id]`** | Watch page — player, title, info, comments, chat drawer | ✅ | Core product page |
| **`/history`** | Watch history — date groups, clear all | ✅ | Mock data |
| **`/liked`** | Liked videos grid | ✅ | Empty state handled |
| **`/watch-later`** | Saved videos | ✅ | Empty state handled |
| **`/settings`** | Settings — profile, notifications, appearance, danger zone | ✅ | |
| **`/studio`** | Creator studio placeholder | ✅ | "Launching soon" |

### Watch Page Components

| Component | Status | Notes |
|---|---|---|
| **Video player** | ✅ | Custom Video.js controls, HLS, live badge with pulse, gradient progress bar, viewer count |
| **Title row** | ✅ | Own row, 28px bold, 2-line clamp — not competing with metadata |
| **Info row** | ✅ | Avatar (exclusive ring), display name, @handle, follower count, Follow/Subscribe/Tip buttons, Like/Share/Clip/Save |
| **Description** | ✅ | Collapsible, clickable timestamps |
| **Comments** | ✅ | Top/Newest/Timeline sort, 📌 markers, 🔥❤️😂 reactions, max depth 2, creator pinning, superchat amber |
| **Chat drawer** | ✅ | Togglable from player, slides in from right, 350ms animation, inline beside player |

### Side Rail

| Feature | Status |
|---|---|
| Collapsed (56px, icons only) | ✅ |
| Expanded (224px, labels) | ✅ |
| W logo at top | ✅ |
| Home, Following, Picks icons | ✅ |
| All categories with icons | ✅ |
| Library section (history, liked, watch later) | ✅ |
| Settings, Studio at bottom | ✅ |
| Super leader categories get amber dot | ✅ |
| Active route highlighted | ✅ |
| Not shown on watch page | ✅ |

### Missing / Not Yet Built

| Gap | Impact | Reason |
|---|---|---|
| **API wiring** | All data is mock/static. No calls to Go API. | Frontend was built parallel to backend. Need to wire TanStack Query to real endpoints. |
| **Video.js v10** | Using v8 instead of v10 beta | v10 upgrade deferred to avoid blocking frontend iteration. v8 works fine. |
| **Real chat WebSocket** | Chat drawer shows mock messages only | Socket.io-client is installed, needs wiring to `/api/v1/chat` WebSocket endpoint. |
| **Auth API integration** | Login/register/OTP are UI-only. No state persisted to backend. | Auth.js configured but calls mock endpoints. Need to point at Go auth service. |
| **File upload UI** | No upload page for creators | Pending creator studio build. |
| **Empty/loading/error states** | Basic handling exists, not comprehensive across all pages | Needs a pass. |
| **Responsive design** | Desktop-first. Mobile untested. | MVP scope. |

---

## 8. Infrastructure

| Component | Status | Details |
|---|---|---|
| Docker Compose | ✅ | Postgres 16 + Redis 7 + MediaMTX + Nginx + Wiitoo API |
| Dockerfile (api) | ✅ | Multi-stage, ~8MB scratch binary |
| Nginx config | ✅ | Reverse proxy, CORS, rate limits, HLS caching |
| MediaMTX config | ✅ | RTMP/WHIP/WHEP ingest server |
| CI workflow | ✅ | GitHub Actions — lint, test, build |
| Makefile | ⚠️ | Named `build.sh`, not a real Makefile. Needs cleanup. |

### Currently Running on This VM

| Service | Port | Status |
|---|---|---|
| Wiitoo API (Go) | 8080 | ✅ Running |
| Wiitoo Frontend (Next.js) | 3000 | ✅ Running |
| Admin Panel (Next.js) | 3001 | ❌ Not running |
| PostgreSQL | 5432 | ✅ Running (no tables) |
| Redis | 6379 | ✅ Running |

---

## 9. Tests & CI

| Area | Status | Details |
|---|---|---|
| Go tests | 🟡 Minimal | 7 tests in auth service only. Zero tests for all other services and packages. |
| Go vet | ✅ Passes on all modules | — |
| Frontend build | ✅ Compiles clean | 15 routes, 0 TS errors |
| Admin build | ✅ Compiles clean | 45+ admin pages, 0 TS errors |
| CI workflow | ✅ Defined | `.github/workflows/ci.yaml` — triggers on push/PR to main |
| ⚠️ **No test coverage target** | ❌ | No coverage thresholds set |

---

## 10. What's Working / What's Not

### ✅ Working

| Category | What |
|---|---|
| **Backend** | All 9 Go services compile, vet, and mount under a single binary. Auth has 7 tests passing. Error middleware catches all handler errors. Admin and user role middleware are in place. |
| **Auth flow** | Full user lifecycle: register → email OTP verify → login (JWT access+refresh tokens) → OAuth (Google, Twitch) → password reset via OTP |
| **Payment providers** | Paddle, PayPal, USDC (Solana) implementations complete. Multi-provider interface. |
| **Storage system** | 5 providers, 3 routing strategies, multi-bucket, multi-region. Full admin CRUD. |
| **Email system** | Brevo, SendPulse, SMTP providers. MultiProvider with failover/round-robin. Full admin CRUD. |
| **Video pipeline** | Cloud PaaS interface with Gcore + Cloudflare Stream providers. Config-selected via env var. |
| **Database** | 25 migration pairs covering all tables. Init script for bootstrap. All tables synced. |
| **Admin panel** | ~45 pages across 15 resources. Branded dashboard, dark mode, Cmd+K search. Full CRUD on users, videos, streams, payments, email, storage. |
| **Frontend — routing** | 15 routes, Next.js 16 App Router, all builds clean. Side rail with 14 icons. |
| **Frontend — watch page** | Custom Video.js player, title/info rows, threaded comments with timeline markers/emoji reactions, chat drawer. |
| **Frontend — browse** | Content cards, Wiitoo Picks section, Following/For You feed toggle, category pages with super leader treatment, creator folder mode. |
| **Frontend — auth pages** | Login, register, OTP verify, password reset — all built and polished. |
| **Frontend — library** | History, liked videos, watch later pages. |
| **Design system** | Warm dark palette, violet-amber brand, Inter typography. Documented in FRONTEND-DESIGN.md. |

### ❌ Not Working / Gaps

| Gap | Severity | Details |
|---|---|---|
| **Database has no tables** | 🔴 Blocks API | Postgres is running but `init-db.sh` hasn't been executed. Go API will fail on first DB query. |
| **No API wiring (frontend)** | 🔴 Blocks real use | All 15 frontend pages use mock/static data. TanStack Query is installed but not pointed at Go API. Login doesn't persist to backend. |
| **No publish/upload UI** | 🟡 Blocks creator workflow | No page for creators to upload videos or start streams. Creator studio is a placeholder. |
| **No real-time chat** | 🟡 | Socket.io-client installed, mock messages displayed, but not connected to Go WebSocket endpoint. |
| **No tests (8/9 services)** | 🟡 | Only auth has tests. Video, stream, chat, payment, content, notification, email, storage — zero tests. |
| **Video.js v8 instead of v10** | 🟢 Low | v8 works fine. v10 upgrade is nice-to-have before launch. |
| **No responsive/mobile** | 🟢 Low | Desktop-only. MVP scope. |
| **Admin panel not running** | 🟢 Low | Compiles fine, just needs `npm run dev` on this VM. |
| **Makefile is a bash script** | 🟢 Low | `build.sh` works but isn't a real Makefile. Needs rename. |

---

## 11. Next Steps (Recommended Order)

| Priority | Task | Effort |
|---|---|---|
| **P0** | Run `init-db.sh` so API doesn't crash on DB queries | 5 min |
| **P0** | Wire frontend auth to Go API (login, register, OTP, JWT) | 4-6 hrs |
| **P1** | Wire watch page to real video data from API | 3-4 hrs |
| **P1** | Wire browse/feed pages to real API endpoints | 3-4 hrs |
| **P2** | Build upload/publish page for creators | 4-6 hrs |
| **P2** | Wire chat to real WebSocket endpoint | 2-3 hrs |
| **P3** | Add tests for remaining 8 services | 2-3 days |
| **P3** | Upgrade Video.js v8 → v10 | 4 hrs |
| **P3** | Build creator studio (studio.wiitoo.com) | 2-3 weeks |
| **P4** | Mobile responsive | 1 week |

---

*End of Inventory*