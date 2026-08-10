'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import Header from '@/components/layout/header';
import { WiitooPlayer } from '@/components/player/wiitoo-player';
import { TitleRow } from '@/components/watch/title-row';
import { InfoRow } from '@/components/watch/info-row';
import { Description } from '@/components/watch/description';
import { CommentsSection } from '@/components/watch/comments-section';
import { ChatDrawer } from '@/components/watch/chat-drawer';
import { ThumbnailPlaceholder } from '@/components/browse/content-card';
import { useUiStore } from '@/lib/store';
import { videos as allMockVideos } from '@/lib/mock-data';
import { WatchPageSkeleton } from '@/components/ui/skeleton';
import type { WatchPageData, ChatMessage, VideoData } from '@/lib/types';

/* ── Helpers ── */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ── Mock data ── */
const MOCK_DATA: WatchPageData = {
  video: {
    id: 'vid-001',
    title: 'The Most Ambitious Crossover Event in Streaming History — Full Breakdown & Analysis',
    creator: {
      id: 'creator-maya',
      username: 'maya_storm',
      displayName: 'Maya Storm',
      followers: 12400,
      following: false,
      subscribed: false,
      isExclusive: true,
      isLive: true,
      badges: [
        { type: 'exclusive', label: 'Wiitoo Exclusive' },
        { type: 'verified', label: 'Verified' },
      ],
    },
    views: 124000,
    likes: 2300,
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    duration: 3720,
    isLive: true,
    liveViewers: 4321,
    description: `This is the moment everyone has been waiting for.

After months of speculation, three of the biggest creators across gaming, music, and art have come together for a live collaboration unlike anything before.

What started as a joke in DMs turned into the most ambitious crossover event in streaming history. Over 12 hours of non-stop content with surprise guests, interactive challenges, and a community-driven narrative that YOU helped shape.

Timestamps:
0:00 - The Setup
12:34 - First Crossover Begins
24:00 - The Challenge
45:30 - Surprise Guest Reveal
1:12:00 - Community Choice Moment

This stream is part of the Wiitoo Exclusives program, supporting creators who push boundaries. Subscribe to Maya to catch future events.

#Crossover #Exclusive #Wiitoo`,
    category: 'Gaming',
    tags: ['crossover', 'collaboration', 'exclusive', 'live-event'],
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    posterUrl: undefined,
  },
  comments: [
    {
      id: 'pin-1',
      author: { username: 'maya_storm', displayName: 'Maya Storm', isExclusive: true },
      text: 'Welcome everyone! Drop a 🔥 if you\'ve been waiting for this!',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      reactions: { fire: 342, heart: 89, laugh: 12 },
      isPinned: true,
      isCreator: true,
      userReacted: 'fire',
    },
    {
      id: 'c1',
      author: { username: 'pixel_runner', displayName: 'Pixel Runner', isExclusive: false },
      text: 'The production quality on this is actually insane. Every other platform should take notes.',
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      reactions: { fire: 128, heart: 34, laugh: 5 },
      timestamp: 45,
      replies: [
        { id: 'c1r1', author: { username: 'maya_storm', displayName: 'Maya Storm', isExclusive: true }, text: 'thank you! the team worked really hard on this one ❤️', createdAt: new Date(Date.now() - 3400000).toISOString(), reactions: { fire: 56, heart: 92, laugh: 2 }, isCreator: true },
        { id: 'c1r2', author: { username: 'nina_codes', displayName: 'Nina Codes', isExclusive: true }, text: 'the lighting setup alone took 3 days lol', createdAt: new Date(Date.now() - 3300000).toISOString(), reactions: { fire: 23, heart: 12, laugh: 8 } },
      ],
    },
    {
      id: 'c2',
      author: { username: 'nina_codes', displayName: 'Nina Codes', isExclusive: true },
      text: 'So proud to be part of this 🙌 What\'s your favorite moment so far?',
      createdAt: new Date(Date.now() - 3200000).toISOString(),
      reactions: { fire: 89, heart: 45, laugh: 3 },
      timestamp: 720,
    },
    {
      id: 'c3',
      author: { username: 'viewer_3492', displayName: 'Jeff K.', isExclusive: false },
      text: 'This is my first time on Wiitoo and I\'m honestly impressed. The quality is next level.',
      createdAt: new Date(Date.now() - 3000000).toISOString(),
      reactions: { fire: 45, heart: 67, laugh: 4 },
    },
    {
      id: 'c4',
      author: { username: 'superfan99', displayName: 'SuperFan99', isExclusive: false },
      text: 'already subbed! best $5 i spend this month 🎉',
      createdAt: new Date(Date.now() - 2800000).toISOString(),
      reactions: { fire: 34, heart: 23, laugh: 1 },
    },
    {
      id: 'c5',
      author: { username: 'ember_vibes', displayName: 'Ember Vibes', isExclusive: true },
      text: 'the crossover energy is unmatched 🔥🔥🔥',
      createdAt: new Date(Date.now() - 2500000).toISOString(),
      reactions: { fire: 67, heart: 12, laugh: 3 },
      timestamp: 180,
    },
    {
      id: 'c6',
      author: { username: 'midnight_owl', displayName: 'Midnight Owl', isExclusive: false },
      text: 'chat is moving so fast i can\'t keep up lol',
      createdAt: new Date(Date.now() - 2200000).toISOString(),
      reactions: { fire: 12, heart: 8, laugh: 34 },
    },
    {
      id: 'c7',
      author: { username: 'tech_wizard', displayName: 'Tech Wizard', isExclusive: false },
      text: 'Does anyone know what camera setup they\'re using? The footage looks cinematic.',
      createdAt: new Date(Date.now() - 2000000).toISOString(),
      reactions: { fire: 8, heart: 15, laugh: 2 },
      timestamp: 1560,
      replies: [
        { id: 'c7r1', author: { username: 'pixel_runner', displayName: 'Pixel Runner', isExclusive: false }, text: 'pretty sure they\'re running Sony FX3s. The depth of field gives it away.', createdAt: new Date(Date.now() - 1800000).toISOString(), reactions: { fire: 18, heart: 6, laugh: 1 } },
      ],
    },
    {
      id: 'sc1',
      author: { username: 'big_spender', displayName: 'Big Spender', isExclusive: false },
      text: 'Incredible content Maya! This is exactly what the platform needed. Keep pushing boundaries!',
      createdAt: new Date(Date.now() - 1500000).toISOString(),
      reactions: { fire: 78, heart: 45, laugh: 2 },
      isSuperchat: true,
      superchatAmount: 50,
    },
  ],
};

const INLINE_CHAT: ChatMessage[] = [
  { id: 'i1', username: 'pixel_runner', displayName: 'Pixel Runner', text: 'This is incredible! Been waiting for this all week 🔥', badge: 'sub', timestamp: Date.now() - 60000 },
  { id: 'i2', username: 'nina_codes', displayName: 'Nina Codes', text: 'the production quality is insane', badge: 'exclusive', timestamp: Date.now() - 45000 },
  { id: 'i3', username: 'viewer_3492', displayName: 'Viewer 88', text: 'first time catching this stream, hi everyone!', timestamp: Date.now() - 30000 },
  { id: 'i4', username: 'superfan99', displayName: 'SuperFan99', text: 'just subbed! let\'s gooo 🎉', badge: 'sub', timestamp: Date.now() - 20000 },
  { id: 'i5', username: 'midnight_owl', displayName: 'Midnight Owl', text: 'chat is moving so fast lol', timestamp: Date.now() - 10000 },
  { id: 'i6', username: 'ember_vibes', displayName: 'Ember Vibes', text: '🔥🔥🔥', badge: 'exclusive', isSuperchat: true, superchatAmount: 25, timestamp: Date.now() - 5000 },
  { id: 'i7', username: 'tech_wizard', displayName: 'Tech Wizard', text: 'what\'s the song at 12:34?', timestamp: Date.now() - 3000 },
  { id: 'i8', username: 'big_spender', displayName: 'Big Spender', text: 'deserves way more viewers honestly', isSuperchat: true, superchatAmount: 15, timestamp: Date.now() - 1000 },
];

/* ── Related videos ── */
const relatedVideos = allMockVideos.filter((v) => v.id !== MOCK_DATA.video.id).slice(0, 8);

/* ── Horizontal Related Video Card (YouTube-style) ── */
function RelatedVideoCard({ video }: { video: VideoData }) {
  const [hovered, setHovered] = useState(false);
  const hoverTimer = useRef<any>(null);
  const hue = video.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <Link
      href={video.isLive ? `/watch/${video.id}?live=1` : `/watch/${video.id}`}
      className="group flex gap-2 rounded-lg transition-colors hover:bg-bg-hover p-1 -mx-1"
      onMouseEnter={() => {
        hoverTimer.current = setTimeout(() => setHovered(true), 200);
      }}
      onMouseLeave={() => {
        clearTimeout(hoverTimer.current);
        setHovered(false);
      }}
    >
      {/* Thumbnail — fixed 168px wide */}
      <div className="relative w-[168px] shrink-0">
        <div className="aspect-video rounded-lg overflow-hidden">
          {video.posterUrl ? (
            <img
              src={video.posterUrl}
              alt={video.title}
              className={`w-full h-full object-cover rounded-lg transition-transform duration-300 ${hovered ? 'scale-105' : ''}`}
            />
          ) : (
            <ThumbnailPlaceholder title={video.title} isLive={video.isLive} />
          )}
        </div>
        {/* Duration badge */}
        {!video.isLive && video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-medium px-1 py-[1px] rounded leading-tight">
            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
          </span>
        )}
        {/* Live badge */}
        {video.isLive && (
          <span className="absolute bottom-1 left-1 bg-live text-white text-[10px] font-bold px-1.5 py-[1px] rounded leading-tight flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-small font-medium text-text-primary line-clamp-2 leading-snug mb-1">
          {video.title}
        </h4>
        <p className="text-tiny text-text-muted truncate">{video.creator.displayName}</p>
        <p className="text-tiny text-text-muted">
          {formatCount(video.views)} views &middot; {timeAgo(video.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

/* ── Mini Player ── */
function MiniPlayer({ video }: { video: WatchPageData['video'] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.85, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' }
    );
  }, []);

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50 w-[320px] md:w-[360px]">
      <div className="rounded-xl overflow-hidden border-2 border-bg-border shadow-2xl">
        <WiitooPlayer
          src={video.hlsUrl}
          poster={video.posterUrl}
          isLive={video.isLive}
          title={video.title}
          liveViewers={video.liveViewers}
        />
      </div>
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        <div className="bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5">
          <span className="text-white text-[10px] font-medium truncate block max-w-[200px]">
            {video.title}
          </span>
        </div>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-black/60 backdrop-blur-sm rounded-md p-1 hover:bg-black/80 transition-colors"
          aria-label="Go to player"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 15l-7-7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Inline Chat Drawer ── */
function ChatDrawerInline({ onClose }: { onClose: () => void }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 350);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-bg-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-text-primary">Live Chat</span>
          <div className="flex items-center gap-1 text-tiny text-live">
            <div className="w-1.5 h-1.5 rounded-full bg-live animate-pulse-live" />
            <span className="font-mono">432</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all" aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {INLINE_CHAT.map((msg, i) => (
          <div key={msg.id} className={`chat-message-enter ${msg.isSuperchat ? 'gradient-ember-horizontal rounded-lg px-2 -mx-2 superchat-enter' : ''}`} style={{ animationDelay: `${i * 0.03}s` }}>
            <div className="flex items-start gap-1.5">
              <span className={`shrink-0 text-tiny font-semibold ${msg.badge === 'exclusive' ? 'text-ember-400' : msg.badge === 'sub' ? 'text-brand-400' : 'text-text-muted'}`}>
                {msg.displayName}
              </span>
              {msg.isSuperchat && msg.superchatAmount && (
                <span className="shrink-0 text-tiny font-bold text-ember-400">${msg.superchatAmount}</span>
              )}
              <span className="text-small text-text-secondary break-words">{msg.text}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-bg-border shrink-0">
        <div className="flex items-center gap-2 bg-bg-raised rounded-lg px-3 py-2 border border-bg-border focus-within:border-brand-600/30 transition-colors">
          <input type="text" placeholder="Send a message..." className="flex-1 bg-transparent text-small text-text-primary placeholder-text-muted focus:outline-none" />
          <button className="p-1 text-text-muted hover:text-text-secondary transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Related videos sidebar ── */
function RelatedSidebar() {
  return (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-text-primary mb-3">Related</h3>
      {relatedVideos.map((v) => (
        <RelatedVideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}

/* ── Keyboard shortcut handler ── */
function useVideoKeyboardShortcuts(togglePlay: () => void, seekBy: (s: number) => void, toggleFullscreen: () => void, toggleMute: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case 'k':
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
        case 'arrowleft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'l':
        case 'arrowright':
          e.preventDefault();
          seekBy(10);
          break;
        case ',':
          e.preventDefault();
          seekBy(-1);
          break;
        case '.':
          e.preventDefault();
          seekBy(1);
          break;
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          e.preventDefault();
          const pct = parseInt(e.key) / 10;
          const vid = document.querySelector('video');
          if (vid && vid.duration) vid.currentTime = pct * vid.duration;
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, seekBy, toggleFullscreen, toggleMute]);
}

/* ==================================================================
   MAIN WATCH PAGE CLIENT
   ================================================================== */
export function WatchPageClient({ videoId }: { videoId: string }) {
  const video = MOCK_DATA.video;
  const comments = MOCK_DATA.comments;
  const isChatOpen = useUiStore((s) => s.isChatOpen);
  const closeChat = useUiStore((s) => s.closeChat);
  const [loading] = useState(false);

  /* ── Mini-player state ── */
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  /* ── GSAP refs ── */
  const inlineChatRef = useRef<HTMLDivElement>(null);

  /* ── Animate inline chat on toggle ── */
  useEffect(() => {
    if (!inlineChatRef.current) return;
    gsap.to(inlineChatRef.current, {
      opacity: isChatOpen ? 1 : 0,
      x: isChatOpen ? 0 : 16,
      duration: 0.25,
      ease: 'power2.out',
      pointerEvents: isChatOpen ? 'all' : 'none',
      overwrite: 'auto',
    });
  }, [isChatOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (!playerContainerRef.current) return;
      const rect = playerContainerRef.current.getBoundingClientRect();
      setShowMiniPlayer(rect.bottom < 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Player keyboard shortcuts ── */
  const togglePlay = useCallback(() => {
    const vid = document.querySelector('video');
    if (!vid) return;
    if (vid.paused) vid.play();
    else vid.pause();
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const vid = document.querySelector('video');
    if (!vid || !vid.duration) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + seconds));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = document.querySelector('.wiitoo-player-skin')?.closest('.group') as HTMLElement;
    if (!container) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else container.requestFullscreen();
  }, []);

  const toggleMute = useCallback(() => {
    const vid = document.querySelector('video');
    if (!vid) return;
    vid.muted = !vid.muted;
  }, []);

  useVideoKeyboardShortcuts(togglePlay, seekBy, toggleFullscreen, toggleMute);

  const handleSeekTo = useCallback((seconds: number) => {
    const vid = document.querySelector('video');
    if (vid && vid.duration) vid.currentTime = seconds;
  }, []);

  if (loading) {
    return <WatchPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-bg-base">
      {/* ═══════════════════════════════════════
         HEADER — always present
         ═══════════════════════════════════════ */}
      <Header />

      {/* ═══════════════════════════════════════
         KEYBOARD SHORTCUT HINT BAR
         ═══════════════════════════════════════ */}
      <div className="hidden md:flex items-center justify-center gap-1 py-1 text-tiny text-text-muted/40 bg-bg-base border-b border-bg-border/20">
        <kbd className="px-1 py-0.5 rounded bg-bg-raised text-[10px]">K</kbd> play/pause ·
        <kbd className="px-1 py-0.5 rounded bg-bg-raised text-[10px]">J</kbd> <kbd className="px-1 py-0.5 rounded bg-bg-raised text-[10px]">L</kbd> seek ·
        <kbd className="px-1 py-0.5 rounded bg-bg-raised text-[10px]">F</kbd> fullscreen ·
        <kbd className="px-1 py-0.5 rounded bg-bg-raised text-[10px]">M</kbd> mute ·
        <kbd className="px-1 py-0.5 rounded bg-bg-raised text-[10px]">0-9</kbd> seek %
      </div>

      {/* ═══════════════════════════════════════
         MAIN CONTENT — player + sidebar at same level
         ═══════════════════════════════════════ */}
      <main
        ref={playerContainerRef}
        className="mx-auto px-4 md:px-6 pt-4 pb-8"
        style={{ maxWidth: '1400px' }}
      >
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* ── LEFT COLUMN: Player + details ── */}
          <div className="flex-1 min-w-0">
            {/* Player with rounded corners, naturally in layout */}
            <div className="relative">
              <WiitooPlayer
                src={video.hlsUrl}
                poster={video.posterUrl}
                isLive={video.isLive}
                title={video.title}
                liveViewers={video.liveViewers}
              />

              {/* Desktop inline chat — overlays player, GSAP toggled */}
              <div
                ref={inlineChatRef}
                className="hidden md:block absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
                style={{ opacity: 0, transform: 'translateX(16px)' }}
              >
                <div className="w-[360px] h-full chat-panel overflow-hidden border-l border-white/10 pointer-events-auto">
                  <ChatDrawerInline onClose={closeChat} />
                </div>
              </div>
            </div>

            {/* Below player: title, info, desc, comments */}
            <div className="mt-4">
              <div className={showMiniPlayer ? 'opacity-30 pointer-events-none select-none' : 'space-y-5'}>
                <TitleRow title={video.title} isLive={video.isLive} liveViewers={video.liveViewers} />
                <InfoRow
                  creator={video.creator}
                  views={video.views}
                  likes={video.likes}
                  publishedAt={video.publishedAt}
                />
                <Description text={video.description} />
                <CommentsSection
                  comments={comments}
                  totalComments={comments.length + 47}
                  onSeekTo={handleSeekTo}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Related sidebar at same level as player ── */}
          {!isChatOpen && (
            <div className="hidden lg:block w-[360px] shrink-0">
              <div className="sticky top-20">
                <RelatedSidebar />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Floating Mini-Player ── */}
      {showMiniPlayer && <MiniPlayer video={video} />}

      {/* ── Mobile/tablet chat drawer ── */}
      <ChatDrawer />

      {/* Bottom spacer */}
      <div className="h-20 md:hidden" />
    </div>
  );
}