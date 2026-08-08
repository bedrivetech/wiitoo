'use client';

import { useState } from 'react';
import FeedSection from '@/components/browse/feed-section';
import WiitooPicks from '@/components/browse/wiitoo-picks';
import {
  liveStreams,
  vodStreams,
  exclusiveVideos,
} from '@/lib/mock-data';

export default function HomePage() {
  const [feedMode, setFeedMode] = useState<'for-you' | 'following'>('following');

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5">
      {/* Feed mode toggle */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setFeedMode('following')}
          className={`text-small font-medium transition-colors ${
            feedMode === 'following'
              ? 'text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Following
        </button>
        <button
          onClick={() => setFeedMode('for-you')}
          className={`text-small font-medium transition-colors ${
            feedMode === 'for-you'
              ? 'text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
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

          {/* Empty state when nothing to show */}
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

          {/* Empty state when nothing trending */}
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