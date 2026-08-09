'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import FeedSection from '@/components/browse/feed-section';
import WiitooPicks from '@/components/browse/wiitoo-picks';
import {
  liveStreams,
  vodStreams,
  exclusiveVideos,
} from '@/lib/mock-data';
import { useAuthStore } from '@/lib/auth-store';
import gsap from 'gsap';

export default function HomePage() {
  const [feedMode, setFeedMode] = useState<'for-you' | 'following'>('following');
  const user = useAuthStore((s) => s.user);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const followingBtnRef = useRef<HTMLButtonElement>(null);
  const foryouBtnRef = useRef<HTMLButtonElement>(null);

  // Animate the indicator pill on toggle
  useEffect(() => {
    if (!indicatorRef.current) return;
    const activeBtn = feedMode === 'following' ? followingBtnRef.current : foryouBtnRef.current;
    if (!activeBtn) return;
    gsap.to(indicatorRef.current, {
      x: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      duration: 0.25,
      ease: 'power2.out',
    });
  }, [feedMode]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5">
      {/* ── Welcome banner (hero) ── */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-brand-900/60 via-bg-base to-ember-950/30 border border-bg-border">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-ember-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-[1] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-title-1 text-text-primary">
              {user ? `Welcome back, ${user.display_name || user.username}` : 'Welcome to Wiitoo'}
            </h1>
            <p className="text-small text-text-tertiary mt-1 max-w-lg">
              {user
                ? 'Your feed is ready. Catch up on what you missed.'
                : 'A new kind of live streaming platform. Watch, create, connect.'}
            </p>
          </div>
          {!user && (
            <Link
              href="/auth"
              className="shrink-0 px-5 py-2 rounded-lg text-small font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          )}
        </div>
      </div>

      {/* ── Feed mode toggle (pill-style) ── */}
      <div className="relative flex items-center gap-1 mb-6 bg-bg-raised rounded-lg p-1 w-fit border border-bg-border">
        {/* Sliding indicator */}
        <div
          ref={indicatorRef}
          className="absolute top-1 bottom-1 rounded-md bg-bg-elevated border border-bg-border shadow-sm"
          style={{ transition: 'none' }}
        />
        <button
          ref={followingBtnRef}
          onClick={() => setFeedMode('following')}
          className={`relative z-[1] px-4 py-1.5 text-small font-medium rounded-md transition-colors ${
            feedMode === 'following' ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Following
        </button>
        <button
          ref={foryouBtnRef}
          onClick={() => setFeedMode('for-you')}
          className={`relative z-[1] px-4 py-1.5 text-small font-medium rounded-md transition-colors ${
            feedMode === 'for-you' ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          For You
        </button>
      </div>

      {/* ── Wiitoo Picks ── */}
      {exclusiveVideos.length > 0 && (
        <div className="mb-10">
          <WiitooPicks videos={exclusiveVideos} />
        </div>
      )}

      {/* ── Following / For You ── */}
      {feedMode === 'following' && (
        <div className="space-y-10">
          {liveStreams.length > 0 && (
            <FeedSection
              title="Live now"
              subtitle={`${liveStreams.length} streams happening right now`}
              videos={liveStreams}
              cardSize="standard"
            />
          )}

          {vodStreams.length > 0 && (
            <FeedSection
              title="Recent videos"
              subtitle="From creators you follow"
              videos={vodStreams}
              cardSize="standard"
            />
          )}

          {liveStreams.length === 0 && vodStreams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-bg-raised flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">Nothing in your feed yet</h3>
              <p className="text-small text-text-muted max-w-sm">
                Follow some creators to see their latest streams and videos here. Try browsing categories to discover new content.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Trending (For You) ── */}
      {feedMode === 'for-you' && (
        <div className="space-y-10">
          {liveStreams.length > 0 && (
            <FeedSection
              title="Trending live"
              subtitle="What people are watching right now"
              videos={liveStreams}
              cardSize="standard"
            />
          )}

          {vodStreams.length > 0 && (
            <FeedSection
              title="Trending on Wiitoo"
              subtitle="Popular videos from around the platform"
              videos={vodStreams}
              cardSize="standard"
            />
          )}

          {liveStreams.length === 0 && vodStreams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-bg-raised flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">Nothing trending yet</h3>
              <p className="text-small text-text-muted max-w-sm">
                Be the first to watch and share content on Wiitoo. Trending feeds populate as the community grows.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}