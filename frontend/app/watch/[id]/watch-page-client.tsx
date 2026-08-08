'use client';

import { WiitooPlayer } from '@/components/player/wiitoo-player';
import { TitleRow } from '@/components/watch/title-row';
import { InfoRow } from '@/components/watch/info-row';
import { Description } from '@/components/watch/description';
import { CommentsSection } from '@/components/watch/comments-section';
import { ChatDrawer } from '@/components/watch/chat-drawer';
import { useUiStore } from '@/lib/store';
import type { WatchPageData } from '@/lib/types';

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
    publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
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
      author: {
        username: 'maya_storm',
        displayName: 'Maya Storm',
        isExclusive: true,
      },
      text: 'Welcome everyone! Drop a 🔥 if you\'ve been waiting for this!',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      reactions: { fire: 342, heart: 89, laugh: 12 },
      isPinned: true,
      isCreator: true,
      userReacted: 'fire',
    },
    {
      id: 'c1',
      author: {
        username: 'pixel_runner',
        displayName: 'Pixel Runner',
        isExclusive: false,
      },
      text: 'The production quality on this is actually insane. Every other platform should take notes.',
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      reactions: { fire: 128, heart: 34, laugh: 5 },
      timestamp: 45,
      replies: [
        {
          id: 'c1r1',
          author: {
            username: 'maya_storm',
            displayName: 'Maya Storm',
            isExclusive: true,
          },
          text: 'thank you! the team worked really hard on this one ❤️',
          createdAt: new Date(Date.now() - 3400000).toISOString(),
          reactions: { fire: 56, heart: 92, laugh: 2 },
          isCreator: true,
        },
        {
          id: 'c1r2',
          author: {
            username: 'nina_codes',
            displayName: 'Nina Codes',
            isExclusive: true,
          },
          text: 'the lighting setup alone took 3 days lol',
          createdAt: new Date(Date.now() - 3300000).toISOString(),
          reactions: { fire: 23, heart: 12, laugh: 8 },
        },
      ],
    },
    {
      id: 'c2',
      author: {
        username: 'nina_codes',
        displayName: 'Nina Codes',
        isExclusive: true,
      },
      text: 'So proud to be part of this 🙌 What\'s your favorite moment so far?',
      createdAt: new Date(Date.now() - 3200000).toISOString(),
      reactions: { fire: 89, heart: 45, laugh: 3 },
      timestamp: 720,
    },
    {
      id: 'c3',
      author: {
        username: 'viewer_3492',
        displayName: 'Jeff K.',
        isExclusive: false,
      },
      text: 'This is my first time on Wiitoo and I\'m honestly impressed. The quality is next level.',
      createdAt: new Date(Date.now() - 3000000).toISOString(),
      reactions: { fire: 45, heart: 67, laugh: 4 },
    },
    {
      id: 'c4',
      author: {
        username: 'superfan99',
        displayName: 'SuperFan99',
        isExclusive: false,
      },
      text: 'already subbed! best $5 i spend this month 🎉',
      createdAt: new Date(Date.now() - 2800000).toISOString(),
      reactions: { fire: 34, heart: 23, laugh: 1 },
    },
    {
      id: 'c5',
      author: {
        username: 'ember_vibes',
        displayName: 'Ember Vibes',
        isExclusive: true,
      },
      text: 'the crossover energy is unmatched 🔥🔥🔥',
      createdAt: new Date(Date.now() - 2500000).toISOString(),
      reactions: { fire: 67, heart: 12, laugh: 3 },
      timestamp: 180,
    },
    {
      id: 'c6',
      author: {
        username: 'midnight_owl',
        displayName: 'Midnight Owl',
        isExclusive: false,
      },
      text: 'chat is moving so fast i can\'t keep up lol',
      createdAt: new Date(Date.now() - 2200000).toISOString(),
      reactions: { fire: 12, heart: 8, laugh: 34 },
    },
    {
      id: 'c7',
      author: {
        username: 'tech_wizard',
        displayName: 'Tech Wizard',
        isExclusive: false,
      },
      text: 'Does anyone know what camera setup they\'re using? The footage looks cinematic.',
      createdAt: new Date(Date.now() - 2000000).toISOString(),
      reactions: { fire: 8, heart: 15, laugh: 2 },
      timestamp: 1560,
      replies: [
        {
          id: 'c7r1',
          author: {
            username: 'pixel_runner',
            displayName: 'Pixel Runner',
            isExclusive: false,
          },
          text: 'pretty sure they\'re running Sony FX3s. The depth of field gives it away.',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          reactions: { fire: 18, heart: 6, laugh: 1 },
        },
      ],
    },
    {
      id: 'sc1',
      author: {
        username: 'big_spender',
        displayName: 'Big Spender',
        isExclusive: false,
      },
      text: 'Incredible content Maya! This is exactly what the platform needed. Keep pushing boundaries!',
      createdAt: new Date(Date.now() - 1500000).toISOString(),
      reactions: { fire: 78, heart: 45, laugh: 2 },
      isSuperchat: true,
      superchatAmount: 50,
    },
  ],
};

export function WatchPageClient({ videoId }: { videoId: string }) {
  const video = MOCK_DATA.video;
  const comments = MOCK_DATA.comments;
  const isChatOpen = useUiStore((s) => s.isChatOpen);

  const handleSeekTo = (seconds: number) => {
    /* In future: find player ref and seek */
    console.log('Seek to:', seconds);
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* ── Nav bar (minimal for now) ── */}
      <header className="h-14 border-b border-bg-border flex items-center px-4 md:px-6 gap-4">
        <span className="text-title-3 text-gradient-brand font-bold tracking-tight">
          wiitoo
        </span>
        <div className="flex-1 flex justify-center max-w-xl mx-auto">
          <div className="w-full max-w-md flex items-center bg-bg-raised rounded-lg px-3 py-1.5 border border-bg-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="flex-1 bg-transparent text-small text-text-primary placeholder-text-muted px-2 py-0.5 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-tiny font-medium text-text-primary bg-bg-raised rounded-lg border border-bg-border hover:bg-bg-hover transition-colors">
            Log in
          </button>
          <button className="px-3 py-1.5 text-tiny font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">
            Sign up
          </button>
        </div>
      </header>

      {/* ── Player + Content layout ── */}
      <main className="mx-auto max-w-[1360px]">
        {/* Player area — adapts width when chat is open */}
        <div className="relative">
          <div className={isChatOpen ? 'md:pr-[360px]' : ''}>
            <div className="px-0 md:px-6 pt-0 md:pt-6">
              <WiitooPlayer
                src={video.hlsUrl}
                poster={video.posterUrl}
                isLive={video.isLive}
                title={video.title}
                liveViewers={video.liveViewers}
              />
            </div>
          </div>

          {/* Chat drawer — overlaid on desktop, slides over player content */}
          <div className="hidden md:block absolute right-0 top-0 h-full">
            {isChatOpen && (
              <div className="w-[360px] h-full chat-panel rounded-xl overflow-hidden border border-bg-border">
                <ChatDrawerInline onClose={() => useUiStore.getState().closeChat()} />
              </div>
            )}
          </div>
        </div>

        {/* Title — full width below player, not fighting chat */}
        <div className={isChatOpen ? 'md:pr-[360px]' : ''}>
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
            totalComments={comments.length + 47} /* mock total */
            onSeekTo={handleSeekTo}
          />
        </div>
      </main>

      {/* ── Mobile/tablet chat drawer (fixed overlay) ── */}
      <ChatDrawer />

      {/* Bottom spacer for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
}

/* ── Inline chat panel for desktop (slides directly next to player) ── */
import type { ChatMessage } from '@/lib/types';

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

function ChatDrawerInline({ onClose }: { onClose: () => void }) {
  const messagesEndRef = useRefStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-bg-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-text-primary">Live Chat</span>
          <div className="flex items-center gap-1 text-tiny text-live">
            <div className="w-1.5 h-1.5 rounded-full bg-live animate-pulse-live" />
            <span className="font-mono">432</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all"
          aria-label="Close chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {INLINE_CHAT.map((msg) => (
          <div key={msg.id} className={`animate-fade-in ${msg.isSuperchat ? 'gradient-ember-horizontal rounded-lg px-2 -mx-2' : ''}`}>
            <div className="flex items-start gap-1.5">
              <span className={`shrink-0 text-tiny font-semibold ${
                msg.badge === 'exclusive' ? 'text-ember-400' :
                msg.badge === 'sub' ? 'text-brand-400' : 'text-text-muted'
              }`}>
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

      {/* Input */}
      <div className="p-3 border-t border-bg-border shrink-0">
        <div className="flex items-center gap-2 bg-bg-raised rounded-lg px-3 py-2 border border-bg-border focus-within:border-brand-600/30 transition-colors">
          <input
            type="text"
            placeholder="Send a message..."
            className="flex-1 bg-transparent text-small text-text-primary placeholder-text-muted focus:outline-none"
          />
          <button className="p-1 text-text-muted hover:text-text-secondary transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </button>
          <button className="p-1 text-text-muted hover:text-text-secondary transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function useRefStore() {
  const ref = { current: null as HTMLDivElement | null };
  return ref;
}