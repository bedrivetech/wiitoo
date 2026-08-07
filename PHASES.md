# Build Phases — Fusion Platform Backend & Admin

## Overview

Wire every platform subsystem to the admin panel with full CRUD, provider-agnostic
plumbing, and no .env config for runtime operations.

## Phase 1 — Email Provider System

**Goal:** Admin-managed multi-provider email with Brevo, SendPulse, and custom SMTP.

### Go Backend
- [x] `pkg/email/interface.go` — current Sender interface (keep)
- [x] `pkg/email/smtp.go` — custom SMTP provider (keep)
- [ ] `pkg/email/brevo.go` — Brevo (Sendinblue) API provider
- [ ] `pkg/email/sendpulse.go` — SendPulse API provider
- [ ] `pkg/email/multi.go` — MultiProvider (primary + fallback, round-robin)
- [ ] `services/email/` — new microservice
  - [ ] Config CRUD (providers, default sender, templates)
  - [ ] Send API endpoint
  - [ ] Template management API
  - [ ] Admin endpoints (list providers, test send, template CRUD)
  - [ ] History / sent log
- [ ] DB migration: `email_providers`, `email_templates`, `email_log` tables

### Admin Panel (Next.js + Refine)
- [ ] Email Providers page (list, add, test, set default)
- [ ] Email Templates page (list, create, edit, preview)
- [ ] Email Log page (history, search, resend)
- [ ] Email Settings page (global config)

---

## Phase 2 — Multi-Provider Storage System

**Goal:** Admin-managed object storage with multi-provider, multi-bucket, multi-region,
and intelligent upload routing.

### Go Backend
- [ ] `pkg/storage/provider.go` — StorageProvider interface
  - Name, regions, buckets, credentials
  - Health check per provider
- [ ] `pkg/storage/wasabi.go` — Wasabi S3-compatible
- [ ] `pkg/storage/backblaze.go` — Backblaze B2 S3-compatible
- [ ] `pkg/storage/idrive.go` — IDrive e2 S3-compatible
- [ ] `pkg/storage/r2.go` — Cloudflare R2 (existing, move to provider model)
- [ ] `pkg/storage/router.go` — UploadRouter
  - RoundRobinStrategy — iterates available buckets
  - GeolocationStrategy — picks nearest region (latency check or config)
  - CapacityStrategy — picks bucket with most free space (requires monitoring)
  - Admin-selectable per use-case (video, thumbnail, backup, etc.)
- [ ] `pkg/storage/manager.go` — StorageManager
  - Manages multiple provider instances
  - Registers providers from DB config
  - Health monitoring & failover
  - Serves as the single `ObjectStore` implementation
- [ ] `services/storage/` — new microservice or extension
  - Provider CRUD (add/edit/remove providers)
  - Bucket CRUD per provider
  - Upload strategy config per use-case
  - Health/usage stats per bucket
  - Admin endpoints (list providers, bucket stats, test connectivity)
- [ ] `pkg/storage/s3.go` — upgrade existing to handle dynamic credentials
- [ ] DB migration: `storage_providers`, `storage_buckets`, `upload_routing` tables

### Admin Panel (Next.js + Refine)
- [ ] Storage Providers page (list, add, edit, test connection)
- [ ] Storage Buckets page (list per provider, show usage, manage)
- [ ] Upload Routing page (configure strategies per use-case)
- [ ] Storage Dashboard (usage charts, health status, alerts)

---

## Phase 3 — Full User Management

**Goal:** Admin panel for every user operation.

### Go Backend
- [x] User model — Role, Status, Verification
- [x] Admin endpoints — list, get, update, suspend, ban
- [x] Role assignment — viewer, creator, moderator, admin
- [ ] Extend user model — login history, IP tracking, 2FA status
- [ ] Creator verification workflow — document upload, review queue, approve/reject
- [ ] Suspension history — reason, duration, admin notes
- [ ] User export — CSV/JSON export of user data
- [ ] Bulk actions — suspend, verify, role change (batch by ID list)

### Admin Panel (Next.js + Refine)
- [x] Users list page — filterable, searchable
- [x] User show page — full profile, activity, payment history
- [ ] User edit page — role, status, verification, notes
- [ ] Creator verification queue — list, review, approve/reject
- [ ] Bulk actions UI — select, action type, confirm
- [ ] User export button
- [ ] Action history log per user

---

## Phase 4 — Full Video Management

**Goal:** Admin panel for every video operation.

### Go Backend
- [x] Video model — status, storage key, HLS URL, thumbnail
- [x] Admin endpoints — list, get, delete, feature, hide
- [ ] Video review workflow — flagged content queue, review, action
- [ ] Video analytics — views over time, retention, geography
- [ ] Trash system — soft delete, restore, permanent delete
- [ ] Batch operations — feature/hide/delete by filters
- [ ] CDN purge — invalidate cache for specific video
- [ ] Storage provider link — which storage bucket holds the video

### Admin Panel (Next.js + Refine)
- [x] Videos list page — filterable by status, category, date
- [x] Video show page — player preview, metadata, actions
- [x] Video edit page — title, description, category, mature flag
- [ ] Video review queue — flagged content, preview, take action
- [ ] Video analytics page — charts, retention graph, top videos
- [ ] Trash page — view deleted videos, restore, permanent delete
- [ ] Batch operations UI

---

## Phase 5 — Full Payment & Billing

**Goal:** Admin panel for transactions, payouts, refunds, and billing config.

### Go Backend
- [x] Multi-provider payments (Paddle, PayPal, USDC)
- [x] Creator ledger (credit, debit, balance, transactions)
- [x] Payout processing (PayPal, USDC, bank)
- [x] Admin endpoints (list transactions, list payouts, trigger payout)
- [ ] Billing settings API — revenue splits, payout thresholds, tier pricing
- [ ] Invoice generation — per-creator per-period invoice
- [ ] Refund workflow — process refund, notify creator, adjust ledger
- [ ] Payment method management per user/creator
- [ ] Tax document management — W-9/W-8BEN collection, download
- [ ] Transaction export — CSV/JSON for accounting

### Admin Panel (Next.js + Refine)
- [x] Transactions list page — filterable by provider, status, date
- [x] Transaction show page — full details, refund button
- [x] Payouts list page — pending, processing, completed
- [x] Payouts create page — select creator, amount, method
- [ ] Refund flow — select transaction, reason, confirm
- [ ] Billing settings — revenue split %, payout threshold, tier prices
- [ ] Invoices page — generate, view, download
- [ ] Tax documents page — request, download
- [ ] Payment dashboard — MRR, payout volume, top earners

---

## Phase 6 — Live Stream Management

**Goal:** Admin panel for stream monitoring and moderation.

### Go Backend
- [x] Stream model — stream key, status, viewer count, health
- [x] Admin endpoints — list, get, kill, warn
- [ ] Stream recording toggle — auto-record, on-demand
- [ ] Stream health monitoring — bitrate, fps, dropped frames
- [ ] Simulcast management — enable/disable per stream, per target
- [ ] Stream moderation tools — timeout user, slow mode, emote-only

### Admin Panel (Next.js + Refine)
- [x] Streams list page — live, ended, scheduled
- [x] Stream show page — health, viewer count, actions
- [ ] Stream recording management — start/stop recording
- [ ] Simulcast control per stream
- [ ] Moderation tools UI

---

## Execution Order

```
Phase 1 (Email)   ───────┐
Phase 2 (Storage) ───────┼── Parallelizable with 3 & 4
Phase 3 (Users)   ───────┤
Phase 4 (Video)   ───────┘
Phase 5 (Payment) ───────── Handlers exist, mostly panel wiring
Phase 6 (Stream)  ───────── Handlers exist, mostly panel wiring
```

Start with Phase 1 — smallest scope, foundation for transactional comms.