import type { VideoData, Comment, Creator } from './types';

/* ─── Creators ─── */

export const creators: Creator[] = [
  {
    id: 'creator-luna',
    username: 'lunabeats',
    displayName: 'Luna Beats',
    avatarUrl: '',
    followers: 28400,
    following: false,
    subscribed: false,
    isExclusive: true,
    isLive: true,
    badges: [{ type: 'exclusive', label: 'Wiitoo' }],
  },
  {
    id: 'creator-pulse',
    username: 'techpulse',
    displayName: 'TechPulse',
    avatarUrl: '',
    followers: 18200,
    following: false,
    subscribed: false,
    isExclusive: true,
    isLive: false,
    badges: [{ type: 'exclusive', label: 'Wiitoo' }],
  },
  {
    id: 'creator-milo',
    username: 'milocreates',
    displayName: 'Milo Creates',
    avatarUrl: '',
    followers: 12400,
    following: false,
    subscribed: false,
    isExclusive: true,
    isLive: true,
    badges: [{ type: 'exclusive', label: 'Wiitoo' }],
  },
  {
    id: 'creator-ari',
    username: 'arivoice',
    displayName: 'ari.',
    avatarUrl: '',
    followers: 9600,
    following: false,
    subscribed: false,
    isExclusive: true,
    isLive: false,
    badges: [{ type: 'exclusive', label: 'Wiitoo' }],
  },
  {
    id: 'creator-nova',
    username: 'novagames',
    displayName: 'Nova',
    avatarUrl: '',
    followers: 34200,
    following: true,
    subscribed: false,
    isExclusive: false,
    isLive: true,
  },
  {
    id: 'creator-sage',
    username: 'sagecookin',
    displayName: 'Sage Cooking',
    avatarUrl: '',
    followers: 8100,
    following: true,
    subscribed: false,
    isExclusive: false,
    isLive: false,
  },
  {
    id: 'creator-rei',
    username: 'reidraws',
    displayName: 'Rei',
    avatarUrl: '',
    followers: 15300,
    following: false,
    subscribed: false,
    isExclusive: false,
    isLive: false,
  },
  {
    id: 'creator-cascade',
    username: 'cascade',
    displayName: 'Cascade',
    avatarUrl: '',
    followers: 22100,
    following: true,
    subscribed: false,
    isExclusive: false,
    isLive: true,
  },
  {
    id: 'creator-finn',
    username: 'finnmakes',
    displayName: 'Finn',
    avatarUrl: '',
    followers: 6700,
    following: false,
    subscribed: false,
    isExclusive: false,
    isLive: false,
  },
  {
    id: 'creator-pixel',
    username: 'pixeltracks',
    displayName: 'Pixel Tracks',
    avatarUrl: '',
    followers: 11900,
    following: false,
    subscribed: false,
    isExclusive: false,
    isLive: false,
  },
];

/* ─── Categories ─── */

export interface Category {
  id: string;
  slug: string;
  label: string;
  isSuperLeader?: boolean;
  description?: string;
  viewerCount?: number;
  streamCount?: number;
}

export const categories: Category[] = [
  { id: 'cat-music', slug: 'music', label: 'Music', isSuperLeader: true, viewerCount: 12800, streamCount: 340 },
  { id: 'cat-creative', slug: 'creative', label: 'Creative', isSuperLeader: true, viewerCount: 7200, streamCount: 210 },
  { id: 'cat-tech', slug: 'tech', label: 'Tech', isSuperLeader: true, viewerCount: 5400, streamCount: 180 },
  { id: 'cat-gaming', slug: 'gaming', label: 'Gaming', viewerCount: 15400, streamCount: 420 },
  { id: 'cat-irl', slug: 'irl', label: 'IRL', viewerCount: 3800, streamCount: 150 },
  { id: 'cat-art', slug: 'art', label: 'Art', viewerCount: 4600, streamCount: 130 },
  { id: 'cat-food', slug: 'food', label: 'Food & Drink', viewerCount: 2900, streamCount: 90 },
  { id: 'cat-movies', slug: 'movies', label: 'Movies & TV', viewerCount: 6100, streamCount: 110 },
];

/* ─── Helper to create video data ─── */

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

const EMBER_GRADIENT =
  'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))';

/* ─── Videos (VODs + Live streams) ─── */

export const videos: VideoData[] = [
  // ── Live streams ──
  {
    id: 'live-luna-beats',
    title: 'late night beats to vibe to — come hang',
    creator: creators[0],
    views: 3400,
    likes: 890,
    publishedAt: new Date().toISOString(),
    duration: 0,
    isLive: true,
    liveViewers: 1200,
    description:
      'just vibing with yall tonight, making some lo-fi beats and chatting. pull up a chair 🎧',
    category: 'Music',
    tags: ['music', 'lofi', 'chill', 'beats'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
  {
    id: 'live-milo-creates',
    title: 'building an interactive LED wall — full build stream',
    creator: creators[2],
    views: 2100,
    likes: 560,
    publishedAt: new Date().toISOString(),
    duration: 0,
    isLive: true,
    liveViewers: 680,
    description:
      'full build stream: soldering, wiring, coding the controller. come learn with me 🔧',
    category: 'Creative',
    tags: ['diy', 'electronics', 'led', 'build'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
  {
    id: 'live-nova',
    title: 'first playthrough — Elden Ring DLC blind',
    creator: creators[4],
    views: 5800,
    likes: 1200,
    publishedAt: new Date().toISOString(),
    duration: 0,
    isLive: true,
    liveViewers: 2300,
    description:
      'going in completely blind, no guides, no spoilers. wish me luck 🫡',
    category: 'Gaming',
    tags: ['elden ring', 'gaming', 'blind playthrough'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
  {
    id: 'live-cascade',
    title: 'code review & chill — open source project',
    creator: creators[7],
    views: 1200,
    likes: 310,
    publishedAt: new Date().toISOString(),
    duration: 0,
    isLive: true,
    liveViewers: 420,
    description:
      'reviewing PRs for the wiitoo web client and vibing. come ask questions about the stack',
    category: 'Tech',
    tags: ['coding', 'opensource', 'react', 'typescript'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },

  // ── VODs ──
  {
    id: 'vid-pulse-review',
    title: 'M4 MacBook Air review — 6 months later, still impressed?',
    creator: creators[1],
    views: 24000,
    likes: 3400,
    publishedAt: hoursAgo(72),
    duration: 1840,
    isLive: false,
    description:
      'six months with the M4 Air as my daily driver. here is my honest long-term review — what holds up, what does not, and whether you should still buy one in 2025.',
    category: 'Tech',
    tags: ['apple', 'macbook', 'review', 'tech'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
  {
    id: 'vid-ari-session',
    title: 'a quiet hour — live session recording',
    creator: creators[3],
    views: 18000,
    likes: 2900,
    publishedAt: hoursAgo(120),
    duration: 3600,
    isLive: false,
    description:
      'a full live recording session. original compositions + a couple covers. recorded in one take at golden hour.',
    category: 'Music',
    tags: ['music', 'live session', 'original', 'acoustic'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
  {
    id: 'vid-sage-pasta',
    title: 'homemade pasta from scratch — no machine, just hands',
    creator: creators[5],
    views: 9200,
    likes: 1400,
    publishedAt: hoursAgo(48),
    duration: 2700,
    isLive: false,
    description:
      'made fresh pasta using only flour, eggs, and my hands. no pasta machine, no shortcuts. full recipe in the description.',
    category: 'Food & Drink',
    tags: ['cooking', 'pasta', 'homemade', 'recipe'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
  {
    id: 'vid-rei-sketchbook',
    title: 'full sketchbook tour — 100 pages, 3 months',
    creator: creators[6],
    views: 15000,
    likes: 2200,
    publishedAt: hoursAgo(96),
    duration: 2400,
    isLive: false,
    description:
      'flipping through my entire sketchbook from the past 3 months. talking through process, mistakes, and what i learned.',
    category: 'Art',
    tags: ['art', 'sketchbook', 'drawing', 'process'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
  {
    id: 'vid-finn-workshop',
    title: 'making a walnut cutting board — full woodworking process',
    creator: creators[8],
    views: 7500,
    likes: 1100,
    publishedAt: hoursAgo(36),
    duration: 3200,
    isLive: false,
    description:
      'from rough lumber to finished board. every step: milling, glue-up, shaping, sanding, and the final oil finish.',
    category: 'Creative',
    tags: ['woodworking', 'diy', 'handmade', 'craft'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
  {
    id: 'vid-pixel-ambient',
    title: 'ambient synth jam — midnight session vol. 3',
    creator: creators[9],
    views: 6400,
    likes: 980,
    publishedAt: hoursAgo(60),
    duration: 1800,
    isLive: false,
    description:
      'third volume of my midnight ambient sessions. all improvised, all hardware synths. put on headphones for the full effect.',
    category: 'Music',
    tags: ['music', 'ambient', 'synth', 'improvisation'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: '',
  },
];

/* ─── Browse helpers ─── */

export const liveStreams = videos.filter((v) => v.isLive);
export const vodStreams = videos.filter((v) => !v.isLive);
export const exclusiveVideos = videos.filter((v) => v.creator.isExclusive);

export const superLeaderCategories = categories.filter((c) => c.isSuperLeader);
export const regularCategories = categories.filter((c) => !c.isSuperLeader);

export function getVideosByCategory(
  categorySlug: string
): VideoData[] {
  const cat = categories.find((c) => c.slug === categorySlug);
  if (!cat) return [];
  return videos.filter(
    (v) => v.category?.toLowerCase().replace(/ & /g, ' ').replace(/ /g, '') ===
      cat.label.toLowerCase().replace(/ & /g, ' ').replace(/ /g, '')
  );
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCreator(username: string): Creator | undefined {
  return creators.find((c) => c.username === username);
}

export function getVideosByCreator(
  username: string
): VideoData[] {
  return videos.filter((v) => v.creator.username === username);
}