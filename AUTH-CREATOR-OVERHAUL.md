# Wiitoo Auth & Creator Studio — Complete Redesign

## What Changed & Why

### 🎯 The New Auth Journey

The old flow was: `Credentials → Personality (afterthought)`

The new flow is: **`Personality → Identity → Key → Magic → Home`**

| Step | What User Sees | What Changed |
|---|---|---|
| **1. Vibe** | 10 visual category tiles with emoji + color | **New** — picks interests BEFORE signing up |
| **2. Name** | Display name + username with live API check | Wired to real backend; backend generates suggestions |
| **3. Key** | Email + password (called "Your Key") | "Password" → **"Key"** everywhere; vibe-based hints; animated strength |
| **4. OTP** | 6 glowing cells | Step indicator shows progress; "Magic code" language |
| **5. Welcome** | "Wiitoo is yours." with floating vibe emojis | Auto-redirects to feed after 3s |

### 🔑 Why "Key" Instead of "Password"

It's brand language. Wiitoo doesn't feel like YouTube — it's a space, a vibe, a place you belong. You don't have a *password*, you have a *Key*. It unlocks *your* Wiitoo. Login copy changed to "Forgot your Key?" and "Hold your Key close."

### 📡 Backend: New Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/v1/auth/username/check?q={name}` | GET | No | Real-time availability check + suggestions |
| `/api/v1/auth/creator/convert` | POST | Yes | Self-service viewer → creator conversion |

### 📝 Backend: Updated Endpoints

| Endpoint | What Changed |
|---|---|
| `POST /api/v1/auth/register` | Now accepts `interests` (array of category IDs) — auto-saves to `category_followers` |
| `POST /api/v1/auth/login` | No wire change (already worked) |

### 🧩 New Files Created

**Go Backend:**
- `services/auth/internal/handler/username.go` — Username check handler with smart suggestion generator
- `services/auth/internal/handler/creator.go` — Creator conversion handler (viewer → creator)

**Modified Go Backend:**
- `services/auth/internal/model/user.go` — Added `UsernameCheckResponse`, `CreatorConversionRequest/Response`, `RegisterWithInterestsRequest`; updated `RegisterRequest` with `Interests`
- `services/auth/internal/repository/pg_user.go` — Added `SaveUserInterests`, `UpdateUsername`, `CreateCreatorVerificationRequest`, `ConvertUserToCreator`
- `services/auth/internal/handler/register.go` — Added `userRepo` field; added interest saving after reg
- `services/auth/api/service.go` — Wired username check + creator convert routes

**Frontend:**
- `frontend/lib/api-client.ts` — **New** — Real API client replacing all mock calls
- `frontend/lib/auth-store.ts` — **Rewritten** — Now calls real API with token persistence
- `frontend/app/auth/page.tsx` — **Complete rewrite** — New 5-step journey
- `frontend/.env.local` — **New** — API URL config

**Creator Studio:**
- `studio/app/convert/page.tsx` — **New** — 3-step creator conversion flow
- `studio/app/moderation/page.tsx` — **New** — Chat filters, ban words, mod management
- `studio/app/layout.tsx` — **Refactored** — Now imports shell component
- `studio/app/shell.tsx` — **New** — Sidebar with nav groups + convert CTA
- `studio/app/page.tsx` — **Enhanced** — Existing dashboard (unchanged structure, prettier)

---

## How to Use

### Run The Migrations
```bash
cd /path/to/wiitoo
# Apply pending migrations to create/update tables
psql -U your_user -d wiitoo -f deploy/migrations/001_users.up.sql
```

### Start the Backend
```bash
go run ./cmd/wiitoo
# Runs on :8080
```

### Start the Frontend
```bash
cd frontend
npm run dev
# Runs on :3000
```

### Start the Studio
```bash
cd studio
npm run dev
# Runs on :3001 (or next available)
```

### Test the Auth Flow
1. Go to `http://localhost:3000/auth`
2. Pick your vibes → Enter name → Enter Key & email → Verify → Welcome
3. Username check hits the backend in real-time

### Test Creator Conversion
1. Log in
2. Go to `http://localhost:3001/convert`
3. Follow the 3-step wizard

---

## Future Phases

- **OAuth integration** — Wire Google/Twitch buttons to real backend
- **Email templates** — Make the OTP email feel like Wiitoo, not a template
- **Category browsing** — Frontend `/api/v1/content/categories` to load real categories instead of hardcoded vibes
- **Role-based sidebar** — Show/hide creator features based on user role
- **Stream go-live** — Wire "Go Live" button to actual MediaMTX integration