# Wiitoo — Frontend Design System & Product Vision

> *"A warm, intelligent space where creators host and viewers inhabit."*

---

## 1. Platform Vibe & Design Principles

### The Soul

Wiitoo is **we too** — a gathering of equals. Not a hierarchy of broadcaster vs viewer. Not a zoo where you watch the spectacle. Not a stadium where you're lost in the crowd.

A **crow's nest** — a high perch with a good view. You see everything. You're part of something. You participate when you want to, observe when you don't.

### The Vibe

**Warm darkness.** Not the sterile black of Kick. Not the harsh dark gray of old Twitch. Think: a well-lit room at night. Deep charcoal backgrounds with warm accent lights — violet, amber, gold. Like a cinema before the film starts. Like a café at midnight.

**Lowkey confidence.** The design doesn't scream for attention. No "SUBSCRIBE NOW" popup on first visit. No obnoxious animations. Quality is in the details — the spacing between elements, the weight of a font, the soft glow of a live indicator. You feel it before you notice it.

### Design Principles

1. **Warm darkness** — Our dark mode is the default and the identity. Violet undertones, amber accents, soft shadows. Not terminal black — cinema dark.

2. **Intentional whitespace** — Nothing is crammed. Every element has room to breathe. The spacing says "we are confident in what we built."

3. **Movement with purpose** — Animations communicate state. A stream going live pulses once. A superchat slides in with a warm glow. A follow button fills with a gradient. No gratuitous motion.

4. **Typography-first** — Hierarchy is communicated through weight and spacing, not through colored boxes and badges. The title gets its own row because it matters.

5. **Anti-algorithm** — Users control their feed. "For You" is available but never the default. The default feed is chronological Following. Algorithm is a toggle, not a trap.

6. **Community signals over popularity signals** — View count is shown but de-emphasized. Creator interactions (likes, replies, pinned comments) are more prominent. We signal "people are connecting here" not "look how popular this is."

7. **The crow aesthetic** — Intelligent, communal, observant. You're here with others who care about this content. The UI facilitates connection without forcing it.

---

## 2. Color System

### Custom Palette

No Tailwind defaults. No `slate-900` or `zinc-800`. Every color is intentional.

```css
/* Dark theme (default — the identity) */
--bg-deepest:    #080808    /* Page background — near-black with warmth */
--bg-base:       #0f0f0f    /* Main surface — YouTube-dark inspired */
--bg-raised:     #1a1a1a    /* Cards, panels, elevated surfaces */
--bg-hover:      #222222    /* Hover states */
--bg-inset:      #111111    /* Input fields, search bars */
--bg-overlay:    rgba(0,0,0,0.85)  /* Modals, drawers */

--border:        #2a2a2a    /* Subtle dividers */
--border-strong: #3a3a3a    /* Focused/hover borders */

--text-primary:   #f0f0f0   /* Primary — warm white */
--text-secondary: #9ca3af   /* Secondary — muted */
--text-tertiary:  #6b7280   /* Placeholders, disabled */

--accent:         #7c3aed   /* Violet-600 — brand primary */
--accent-hover:   #8b5cf6   /* Violet-500 */
--accent-glow:    rgba(124,58,237,0.25)  /* Soft glow */
--accent-bg:      rgba(124,58,237,0.08)  /* Subtle background fill */
--accent-muted:   #5b21b6   /* Violet-800 — darkened accent */

--ember:          #f59e0b   /* Warm amber — tips, highlights */
--ember-glow:     rgba(245,158,11,0.2)  /* Amber glow */
--ember-bg:       rgba(245,158,11,0.08) /* Amber background */

--live:           #dc2626   /* Live indicator */
--live-glow:      rgba(220,38,38,0.2)  /* Live pulse */

--success:        #10b981   /* Confirmations (follow, sub) */
--warning:        #f59e0b   /* Warnings */
--error:          #ef4444   /* Errors */

/* Light theme (optional, user-preference) */
[data-theme="light"] {
  --bg-deepest:    #fafafa
  --bg-base:       #ffffff
  --bg-raised:     #f5f5f5
  /* etc — accent stays the same */
}
```

**Why violet:** Violet has more red in it than blue-purple. It feels warmer, more creative, more human. It's the color of twilight — the transition between day and night. Perfect for a platform that lives in the evening hours.

### Usage Guidelines

```
Accent backgrounds    → accent-bg (8% opacity)
Accent borders/hover  → accent (main)
Accent text           → accent-hover (for interactive)
Glows                 → accent-glow (20-25% opacity)
Tips/Superchats       → ember + ember-glow
Live indicators       → live + live-glow (soft pulse)
Success actions       → success (follow, subscribe confirmations)
```

---

## 3. Typography & Spacing

### Typefaces

| Usage | Font | Weight | Notes |
|---|---|---|---|
| UI text | Inter | 400, 500, 600, 700 | Clean, readable at all sizes |
| Monospace (code/tech chat) | JetBrains Mono | 400, 500 | Optional, for code-related channels |

### Type Scale

```
Display:   48px/52px   Inter 700 — Landing hero only
H1:        32px/40px   Inter 700 — Page titles (browse header)
H2:        26px/32px   Inter 600 — Section headers
H3:        22px/28px   Inter 600 — Card titles
H4:        18px/24px   Inter 600 — Sub-section headers
Title:     28px/32px   Inter 600 — Video title (watch page, own row)
Subtitle:  16px/24px   Inter 500 — Creator name, metadata headers
Body:      16px/24px   Inter 400 — Descriptions, comments
Body-Sm:   14px/20px   Inter 400 — Secondary text, stats
Caption:   13px/18px   Inter 400 — Timestamps, tertiary info
Tiny:      11px/14px   Inter 500 — Badges, tags, view counts
```

### Spacing (4px base)

```css
/* padding, margin, gap values */
p-0:    0px
p-0.5:  2px
p-1:    4px
p-1.5:  6px
p-2:    8px
p-2.5:  10px
p-3:    12px
p-3.5:  14px
p-4:    16px
p-5:    20px
p-6:    24px
p-7:    28px
p-8:    32px
p-9:    36px
p-10:   40px
p-11:   44px
p-12:   48px
p-14:   56px
p-16:   64px
p-20:   80px
p-24:   96px
```

### Border Radius

```css
rounded-none:   0px
rounded-sm:     4px
rounded-md:     8px
rounded-lg:     12px
rounded-xl:     16px
rounded-2xl:    24px
rounded-full:   9999px
```

### Shadows

```css
shadow-sm:   0 1px 2px rgba(0,0,0,0.4)
shadow-md:   0 4px 12px rgba(0,0,0,0.5)
shadow-lg:   0 8px 24px rgba(0,0,0,0.6)
shadow-glow: 0 0 20px var(--accent-glow)       /* Live indicators, superchats */
shadow-ember: 0 0 20px var(--ember-glow)        /* Tip/superchat highlights */
```

---

## 4. Content Cards — The Atomic Unit of Discovery

The card is how content appears everywhere: browse page, following feed, search results, creator folders, recommendations sidebar.

### Card Layout

```
┌──────────────────────────────┐
│                              │
│         THUMBNAIL            │  ← 16:9, rounded-md
│                              │
│  [● LIVE] or [2h ago]        │  ← top-left overlay
│                              │
│  [duration badge]            │  ← bottom-right overlay
│                              │
├──────────────────────────────┤
│                              │
│  Stream Title Goes Here      │  ← 15px/20px, font-medium, 2 lines max
│                              │
│  creator_name                │  ← 13px/16px, text-secondary
│                              │
│  12K watching                │  ← 12px/16px, text-tertiary
│                              │
└──────────────────────────────┘
```

### Card States

| State | Visual Change |
|---|---|
| **Default** | Raised background, subtle border |
| **Hover** | `bg-hover`, soft scale(1.02), shadow-md |
| **Exclusive creator** | Subtle gradient border-left (violet → amber), slightly larger thumbnail |
| **Live** | Thumbnail has a subtle red glow border, LIVE badge top-left |
| **Featured/Curated** | "Wiitoo Pick" tag top-right, minimal, one-line |

### Exclusive Creator Card Variant

For creators in the Wiitoo Exclusives program:

```
┌──────────────────────────────┐      ← subtle gradient border (violet-amber)
│                   [★ Wiitoo] │      ← small, muted badge
│         THUMBNAIL            │
│  [● LIVE]                    │
├──────────────────────────────┤
│  Title                       │  ← same as regular
│                              │
│  creator_name  ●              │  ← small filled dot (ember color) after name
│                              │
│  12K watching                │
└──────────────────────────────┘
```

The exclusive treatment is **one badge, one dot, one gradient border line**. Not a crown. Not a checkmark. An ember. You notice it without it demanding attention.

### Folder Mode (Creator Curated View)

When clicking an exclusive creator's card, the browse page transitions to a **folder view**:

```
┌──────────────────────────────────────────────────────────┐
│  ← Browse    Creator Name    [Follow] [Subscribe] [Tip]  │
│                                                          │
│  ┌──────┐                                                │
│  │ AVAT │  Bio — short line about the creator            │
│  │   AR │  Schedule: Mon/Wed/Fri 8PM EST                 │
│  └──────┘   Category: Music (Wiitoo Picks)               │
│                                                          │
│  ─── Featured ────────────────────────────────────────── │
│  ┌──────┐ ┌──────┐ ┌──────┐                             │
│  │ VOD  │ │ VOD  │ │ Clip │                             │
│  └──────┘ └──────┘ └──────┘                             │
│                                                          │
│  ─── All Videos ──────────────────────────────────────── │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ VOD  │ │ VOD  │ │ VOD  │ │ Clip │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
└──────────────────────────────────────────────────────────┘
```

This is the creator's "channel page" — but it feels like a **folder you opened**, not a profile page with a database query behind it.

---

## 5. Watch Page — The Core Experience

### User Intents (When someone lands on a watch page)

**Primary (arriving):**
1. "I want to watch this content" — immediate playback
2. "I want to see if they're live right now" — checking for live
3. "Someone sent me this link" — social arrival, low context

**Secondary (during):**
4. "I want to react" — like, comment, emoji react
5. "I want to engage with the creator" — follow, subscribe, tip
6. "I want to talk to other viewers" — chat (if live)
7. "I want to explore more like this" — discovery sidebar

**Power User:**
8. "I want this player to behave exactly how I like" — theater mode, speed, quality
9. "I want to clip/share this moment" — exporting content
10. "I want to moderate my chat experience" — mute users, hide chat

### Watch Page Layout (scroll structure)

```
┌──────────────────────────────────────────────────────────┐
│  [Header — minimal. Logo + Search + Avatar]              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                    VIDEO PLAYER                          │
│                                                          │
│  [progress bar — thin, gradient violet→amber]            │
│  [● LIVE BADGE — small pill, soft pulse, only when live] │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  The Most Ambitious Crossover Event in Streaming History │
│  — 28px/32px, font-semibold, 2 lines max                │
│  — own row, breathing room above and below               │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Avatar] Creator Name  @handle                          │
│  [Follow]  [Subscribe]  [Tip 💰]                         │
│                                                          │
│  124K views  •  3 days ago  •  2.3K likes  [👍]        │
│                                                          │
│  [Share] [Clip] [Save] [···]                             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Description — collapsible, 3 lines default             │
│  Click/tap to expand. If stream: includes stream info.   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ─── Comments ────────────────────────────────────────── │
│                                                          │
│  "Join the conversation" (not signed in)                 │
│  or textarea with avatar + "Write a comment..."          │
│                                                          │
│  Sort: [Top] [Recent] [Creator Pinned]                   │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Avatar │ @username • 2h ago ★ Pinned by creator  │  │
│  │         │ "This part at 12:34 blew my mind"       │  │
│  │         │ Timestamp link: [12:34]                  │  │
│  │         │ [❤️ 24] [↩ Reply] [🎉] [🔥] [💬]       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Avatar │ @user2 • 5h ago                          │  │
│  │         │ "Great stream! Loved the energy"         │  │
│  │         │ [❤️ 12] [↩ Reply] [🎉] [🔥] [💬]       │  │
│  │                                                   │  │
│  │   ┌─── ─── ─── ─── ─── ─── ─── ─── ─── ───┐     │  │
│  │   │ Avatar │ @reply_user • 3h ago            │     │  │
│  │   │         │ "Agreed, best one yet"          │     │  │
│  │   │         │ [❤️ 5]                          │     │  │
│  │   └─── ─── ─── ─── ─── ─── ─── ─── ─── ───┘     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Key Watch Page Behavior Rules

1. **No overlay ads.** No popups on play. No "subscribe to continue watching." The content plays. Period.

2. **Player is max-width centered.** On wide screens, player doesn't stretch beyond 1280px. Content below it fills the width.

3. **Title has its own row** — it's the first thing below the player. Not competing with metadata. 28px/32px, semibold, max 2 lines with ellipsis.

4. **Info row is separate** — avatar, name, stats, actions all in one row below the title. 16px body text for the name, 13px for stats.

5. **Actions are visible but not pushy** — Follow/Subscribe/Tip are buttons, not banners. Share/Clip/Save are icon buttons with labels.

6. **When LIVE, chat is a toggleable drawer** — not a permanent column. See Section 7 for chat behavior.

### Player Controls (Video.js v10 custom skin)

```
┌────────────────────────────────────────────────┐
│                                                │
│              VIDEO CONTENT                     │
│                                                │
│                                                │
│                                                │
│                                                │
│  [Play/Pause] [Volume] [Progress Bar] [Time]  │
│  [1080p] [Speed] [Theater] [Fullscreen]       │
│                                                │
└────────────────────────────────────────────────┘
```

Skin rules:
- Controls appear on hover, fade out after 2s of inactivity
- Progress bar is thin (3px), gradient violet→amber on hover
- Bottom control bar is translucent black with blur backdrop
- No giant "PLAY" button in the center (subtle icon instead)
- Quality selector includes: Auto, 1080p, 720p, 480p, 360p, 160p (audio only)

---

## 6. Comments — Reimagined

### The Problems with Current Comment Systems

| Platform | Problem |
|---|---|
| **YouTube** | Firehose of low-effort comments. Threads are infinite and unreadable. Signal-to-noise is terrible. Downvote culture creates negativity. |
| **Twitch** | Chat IS comments but ephemeral. No permanence. No deep discussion possible. |
| **Instagram/TikTok** | Shallow. No threading worth using. Comments are secondary to the content. |
| **Reddit (video posts)** | Best threading but slow. Not designed for video context. |

### Wiitoo's Comment Design

**1. Max depth of 2**

Top-level comments have exactly one level of replies. No infinite nesting. Deeper discussions belong in DMs, Discord, or wherever communities form naturally. On Wiitoo, comments are about *the content* — not about the comments themselves.

```
Comment ─┬─ Reply ── [end]
          ├─ Reply ── [end]      ← Clean, scannable, readable
          └─ Reply ── [end]
```

**2. Timeline markers**

Any comment can attach to a timestamp in the VOD:

```
@user • 2h ago • at 12:34
"The transition here was perfect"
```

Clicking `at 12:34` seeks the player to that moment. This makes comments *useful* — they become scene markers, highlight indicators, discussion anchors.

**3. Reactions, not just likes**

Instead of just thumbs up, viewers can react with emoji on any comment:

```
[❤️ 24] [🎉 5] [🔥 12] [💬 3]
```

This lowers the barrier to engagement. You don't need to write something — a 🔥 reaction says "I agree, and this deserves emphasis."

**4. No downvotes on comments**

The dislike button exists on the video (for feedback). Comments don't get downvoted. If a comment is problematic, it gets reported. We don't build a culture of "punishing" opinions.

**5. Creator-pinned comments**

Creators can pin one comment to the top of their comment section. Pinned comments show with a small "★ Pinned by creator" badge. This is the creator's way of saying "this person gets it."

**6. Commenter reputation (not karma)**

Instead of upvote scores, users earn **participation badges** based on meaningful engagement:

- "First 100" — joined in the first week
- "Regular" — commented on 10+ videos from this creator
- "Circle" — creator pinned their comment
- "Supporter" — subscribed or tipped

These show as tiny dots or badges next to the username, not as a number. They signal *relationship* not *status*.

**7. Superchat permanence in VOD**

When a stream ends, tipped messages are preserved as permanent comments in the VOD with a warm amber background:

```
┌───────────────────────────────────────────────────┐
│ 💰 $10.00                                         │
│ @fan • during live stream • at 45:12              │
│ "You deserve this, best streamer on Wiitoo"       │
│ [❤️ 45] [↩ Reply]                                 │
└───────────────────────────────────────────────────┘
```

These are pinned at the top of the VOD chat transcript section. They become artifacts of the community's appreciation.

---

## 7. Chat — Contextual, Not Mandatory

### Philosophy

Chat is **a feature of live streams, not the identity of the platform.** Unlike Twitch where chat is the center of the universe, on Wiitoo chat is contextual — present when it adds value, hidden when it doesn't.

### Behavior

| State | Chat Behavior |
|---|---|
| **VOD (wasn't live)** | No chat. Comments section is the engagement layer. |
| **VOD (was live)** | Chat transcript is available as a toggleable overlay viewer. Comments section below is the primary engagement. Chat transcript is archived, not active. |
| **Live stream** | Chat drawer is available. Auto-opens on first visit to a live stream? **No.** It's collapsed. User opens it when they want it. Once opened, stays open for that session. |
| **Live stream (sub mode)** | Chat shows a banner: "Subscriber-only chat 💬 Subscribe to join the conversation." Non-subs can read, can't post. |

### Chat Drawer (Live Streams)

```
┌──────────────┬──────────────────────┐
│              │  Chat                │  ← 320px default, resizable
│              │                      │
│              │  @user1: hello all   │
│   PLAYER     │  @user2: hey!        │
│              │  💰 @fan tipped $5   │  ← warm amber bg
│              │  "great vibes"       │
│              │  @user3: lfg         │
│              │  @user1: this song   │
│              │  [input box]         │  ← bottom, always visible
│              │   Send               │
└──────────────┴──────────────────────┘
```

### Chat Modes (Set by Streamer)

| Mode | Behavior | Best For |
|---|---|---|
| **Relaxed** (default) | 30s slow mode for viewers, 10s for subscribers. Trust-level gating (new accounts rate-limited). | Most streams. Healthy pace, no spam. |
| **Unmoderated** | No slow mode. No rate limiting. Viewer is warned before entering. | Chaos streamers who want the old internet feel. |
| **Subs only** | Only subscribers can post. Everyone can read. | Large streams (5k+) where chat is a firehose. |
| **Emote only** | Only emotes/reactions, no text. | Hype moments, celebrations. |

### Viewer Chat Controls (Client-Side)

Every viewer has complete control over their own chat experience:

- **Mute user** → right-click name → "Hide messages from @user." Messages from that user are hidden client-side. The muted user never knows. No drama.
- **Hide chat** → toggle button in player controls or keyboard shortcut (C). Chat slides away. Player takes full width.
- **Font size** → small/medium/large. Preferences saved to localStorage.
- **Compact mode** → removes avatars, shows only usernames + text. More messages visible.

### Post-Stream Chat → VOD Comments

When a live stream ends:

1. Chat stops. Textarea becomes "Stream ended" with a timestamp.
2. Chat transcript is archived and available from the VOD page as a toggleable overlay — like YouTube's "Live chat replay."
3. Tipped messages from the chat are promoted to permanent VOD comments with amber styling.
4. New comments go into the normal comments section below the chat transcript.

This means **nothing is lost.** The energy of the live stream is preserved, but the VOD page remains a clean, commentable artifact.

---

## 8. Browse Page — Discovery & Hierarchy

### Page Structure

```
┌──────────────────────────────────────────────────────────┐
│  [Header — Logo · Search · Categories bar · Avatar]     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ─── Categories ─────────────────────────────────────── │
│  [All] [Gaming] [Music] [IRL] [Tech] [Art] [More ▼]    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ★ Wiitoo Picks — Exclusive Creators                    │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ CARD │ │ CARD │ │ CARD │ │ CARD │  ← Larger cards    │
│  │ ●LIVE│ │ VOD  │ │ ●LIVE│ │ VOD  │     Gradient       │
│  └──────┘ └──────┘ └──────┘ └──────┘     border          │
│                                                          │
│  [See All →]                                              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Following — creators you follow                         │
│                                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│  │CAR │ │CAR │ │CAR │ │CAR │ │CAR │  ← Standard cards   │
│  └────┘ └────┘ └────┘ └────┘ └────┘                     │
│                                                          │
│  (Chronological, most recent content first)              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Trending on Wiitoo                                      │
│                                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│  │CAR │ │CAR │ │CAR │ │CAR │ │CAR │                     │
│  └────┘ └────┘ └────┘ └────┘ └────┘                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Category Page (when user clicks into a category)

When user clicks "Music" from the categories bar:

```
┌──────────────────────────────────────────────────────────┐
│  ← Browse    Music                                       │
│                                                          │
│  ★ Wiitoo Music — Curated by Wiitoo                      │
│  ┌──────────────────────────────────────────────┐       │
│  │  Featured Creator — Large profile card        │       │
│  │  @creatorname  [Follow]  [Subscribe]          │       │
│  │  "Wiitoo's premier music streamer"            │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  ─── Exclusive Creators ──────────────────────────────── │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ CARD │ │ CARD │ │ CARD │ │ CARD │  ← Gradient        │
│  └──────┘ └──────┘ └──────┘ └──────┘     borders         │
│                                                          │
│  ─── All Music Streamers ─────────────────────────────── │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│  │CAR │ │CAR │ │CAR │ │CAR │ │CAR │  ← Standard cards   │
│  └────┘ └────┘ └────┘ └────┘ └────┘                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Super Leader Categories

Certain categories where Wiitoo wants to be recognized as the best destination:

- Music
- Creative (art, design, making)
- Tech

These get:
1. A "Curated by Wiitoo" section at the top of their category page
2. Featured creator spotlight with large card
3. Exclusive creators shown first and prominently
4. Category description/identity text: "Wiitoo is the home for [category]. [Blurb...]"

The message to users: "This is what we're best at. Stay for everything else."

---

## 9. Exclusive Creators — Elevation, Not Segregation

### Visual Treatment

Exclusive creators are **elevated naturally**, not segregated into a VIP section with velvet ropes.

| Element | Treatment |
|---|---|
| **Card border** | Subtle gradient (violet → amber), only on hover for less noise |
| **Avatar** | Small filled dot (ember) next to creator name |
| **Badge** | "Wiitoo" — small, muted, on the card thumbnail |
| **Browse position** | Wiitoo Picks section at top of browse + top of their category |
| **Country club feeling** | None. No velvet ropes. No VIP section. Just better positioning and a subtle visual cue. |

### Non-Visual Benefits

- Featured in "Wiitoo Picks" section on browse page
- Larger card thumbnails in category pages
- Priority in search results for their category
- Folder mode (curated creator view) enabled
- Access to beta features first
- Direct line to platform team for support

### The Philosophy

An exclusive creator shouldn't feel like a sellout. They should feel like **the platform believes in them** and is invested in their success. The visual cues communicate "this creator is part of Wiitoo's identity" not "this creator is richer than others."

---

## 10. The Wiitoo "Skin" — Video.js v10 Player Customization

The player is the most used UI element. It must feel custom, not like a stock video player.

### Custom Skin Elements

1. **Control bar** — Translucent dark with blur (backdrop-filter: blur(12px)). Auto-hides after 2s.
2. **Progress bar** — 3px thin. Violet base, amber accent on hover, white scrubber thumb. Gradient violet→amber on played section.
3. **Play button** — Minimal. No giant circle. Just a play triangle icon in the center, subtle white with 60% opacity, grows to 80% on hover.
4. **Volume** — Thin slider, same gradient as progress bar. Speaker icon that changes state.
5. **Quality selector** — Text dropdown: "Auto · 1080p · 720p · 480p · 360p · Audio"
6. **Speed selector** — Text dropdown: "0.5x · 0.75x · 1x · 1.25x · 1.5x · 2x"
7. **Theater mode** — Toggle that switches watch page to wider player layout, hides header.
8. **Picture-in-picture** — Standard PiP button.
9. **Fullscreen** — Standard fullscreen button.

### Live Player Specifics

When a stream is live:

- **LIVE badge** — Small pill, top-right of player or integrated into control bar. "--accent" colored (violet), not red. Soft pulse animation (once every 3s).
- **Viewer count** — Displayed next to LIVE badge. "12K watching"
- **Latency indicator** — Small text: "~3s delay" or "~8s delay" (low vs standard latency)
- **Theater mode + chat** — When both active, player goes to 70% width, chat takes 30% on right.

---

## 11. User Journal Logs — Living the Experience

### Alex — Regular Viewer, 24

**Day 1: First Arrival**

> Got sent a link to a Wiitoo stream. The page loads fast. No "sign up" popup — the player starts playing immediately. Dark background. Video looks crisp. The title is big and readable — "Late Night Vibes" — in a nice font. Not like YouTube's cramped 14px.
>
> I see the creator info below. Avatar, name, follow button. I click follow. One click. No confirmation. No email. Done.
>
> I scroll down to comments. There aren't many yet — maybe 30. They're threaded nicely. Someone pinned a "welcome to the first stream" comment at the top. Cute. I type something and it posts without a captcha.
>
> I notice I can add reactions to comments. I don't have to write a reply, I can just click a fire emoji. I do that.
>
> The vibe is... quiet. In a good way. Nothing is yelling at me to subscribe. I'm just watching.

**Day 14: Returning**

> I'm back because I got a notification that one of my followed creators went live. The Following feed on the home page shows me everything chronologically. No algorithm pushing random stuff. I appreciate this.
>
> I click the stream. It loads. This time I notice a small chat icon in the player controls. I click it. Chat slides in from the right. I type "hello" — it posts after a 5-second wait (I'm not subbed — fair enough).
>
> Some guy in chat is being loud. I right-click his name, "Hide messages." Poof. Gone. He never knows. I feel like I have actual control.
>
> I tip $3 in USDC because it's cheap and I like supporting creators. The transaction is like $0.0002. Incredible.

**Day 30: Regular**

> I subscribe to my favorite creator. $5/month. The Paddle checkout opens in a modal — I don't leave Wiitoo. Done. Now I have a small violet dot next to my name in chat. No fanfare. Just a quiet signal.
>
> Later I watch a VOD. The comments below have timestamp links. I click "at 12:34" and the player seeks there. Small feature, huge difference.

---

### Maya — Creator, 28 (Wiitoo Exclusive)

**Apply Day:**

> I got invited to be an Exclusive Creator. My content cards get a subtle gradient border. My name gets a small filled dot — ember-colored. It's not a huge ego thing, but it feels like the platform invested in me.
>
> My category (Music) is a "Super Leader Category" — it has its own featured section on the browse page. New viewers find me easily. Not through an algorithm — through a curated section that tells them "this is what Wiitoo is great at."

**First Stream:**

> I start streaming from OBS. RTMP key in my creator dashboard. I set chat to Relaxed mode — 30s slow mode for everyone. I want chill vibes, not chaos.
>
> The viewer count climbs. Chat is moving at a pace I can actually read. I respond to people. It feels like a conversation, not a performance.
>
> Someone tips $10. The message slides in with a warm amber glow. It catches my eye. I thank them live. The message is now pinned in the VOD for this stream — permanent artifact of the moment.

**Studio View:**

> I check studio.wiitoo.com. Clean dashboard. Revenue: $342 this month from subs + tips. Retention curves showing me exactly where viewers drop off. A heatmap showing which parts of my stream got clipped most. The analytics tell me *why* something worked, not just that it worked.

---

### Jordan — Power Viewer, 31

**First Impressions:**

> I've been on every platform. Twitch 7 years. YouTube 10. Kick when it launched. Wiitoo feels different.
>
> It's not trying to be Twitch but better. It's trying to be something else. Dark but warm. The comments are actually readable because they stop at 2 levels deep. I can mute anyone from my chat view. No drama.
>
> The player doesn't break when I resize my window. The title isn't fighting for space with 12 other UI elements. Every time I scroll past a creator's card and it has that subtle gradient border, I think "oh, Wiitoo Picks — I should check this out."

**The Crown Moment:**

> I tipped $10 during a live stream. The animation was simple — beautiful even. A warm gold glow. The creator saw it instantly, read it aloud, reacted. Later, watching the VOD, I saw my message preserved with the amber background. It felt like I mattered, not just a transaction.
>
> This is what none of the other platforms understand. Tipping isn't about the money (even though creators need it). It's about connection. Wiitoo gets that. The UI reflects it.

---

## 12. Implementation Guidelines

### Tech Stack

| Need | Choice |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 (custom palette, no defaults) |
| **Components** | shadcn/ui (customized, not default theme) |
| **Server state** | TanStack Query |
| **Auth** | Auth.js (JWT sessions) |
| **UI state** | Zustand (player state, drawer state, preferences) |
| **Real-time** | Socket.io-client (chat WebSocket) |
| **Player** | Video.js v10 (custom skin) |
| **Animation** | Framer Motion (purposeful, state-communicating) |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide (consistent, clean icon set) |

### Directory Structure (Viewer App)

```
frontend/
├── app/
│   ├── layout.tsx                ← Root layout, providers, theme
│   ├── page.tsx                  ← Home page (browse, feeds)
│   ├── watch/[slug]/
│   │   ├── page.tsx              ← Watch page
│   │   ├── player.tsx            ← Video.js v10 wrapper
│   │   ├── video-info.tsx        ← Title, creator, metadata
│   │   ├── comments.tsx          ← Comments section
│   │   ├── chat-drawer.tsx       ← Live chat (if live)
│   │   └── sidebar.tsx           ← Recommended content
│   ├── browse/
│   │   ├── page.tsx              ← Browse all
│   │   └── [category]/
│   │       └── page.tsx          ← Category page
│   ├── creator/[slug]/
│   │   └── page.tsx              ← Creator folder view
│   ├── search/
│   │   ├── page.tsx              ← Search results
│   └── auth/
│       ├── login/page.tsx
│       ├── register/page.tsx
│       └── verify/page.tsx
├── components/
│   ├── ui/                       ← Customized shadcn components
│   ├── layout/
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── content/
│   │   ├── content-card.tsx      ← The atomic card unit
│   │   ├── content-grid.tsx      ← Grid wrapper for cards
│   │   ├── creator-folder.tsx    ← Folder mode view
│   │   └── wiitoo-picks.tsx      ← Exclusive creators section
│   ├── player/
│   │   ├── wiitoo-player.tsx     ← Custom player wrapper
│   │   ├── player-controls.tsx    ← Custom control bar
│   │   └── player-skin.css       ← Video.js skin overrides
│   ├── chat/
│   │   ├── chat-drawer.tsx       ← Chat panel
│   │   ├── chat-message.tsx      ← Individual message
│   │   └── chat-input.tsx        ← Message input
│   └── comments/
│       ├── comment-thread.tsx    ← Threaded comment
│       └── comment-input.tsx     ← Write a comment
├── lib/
│   ├── api.ts                    ← API client (TanStack Query)
│   ├── ws.ts                     ← WebSocket chat client
│   ├── auth.ts                   ← Auth.js config
│   └── store.ts                  ← Zustand stores
├── styles/
│   └── globals.css               ← Custom palette, Tailwind config
└── package.json
```

---

*This document is a living artifact. As we build and learn, it evolves. The principles here guide every decision, but they are not rigid rules — they are the foundation of taste.*