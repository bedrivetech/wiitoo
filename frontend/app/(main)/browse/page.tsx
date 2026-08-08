'use client';

import { useState } from 'react';
import FeedSection from '@/components/browse/feed-section';
import WiitooPicks from '@/components/browse/wiitoo-picks';
import {
  liveStreams,
  vodStreams,
  exclusiveVideos,
} from '@/lib/mock-data';
import { formatCount } from '@/lib/utils';

export default function BrowsePage() {
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
          {/* Live first */}
          {liveStreams.length > 0 && (
            <FeedSection
              title="Live now"
              subtitle={`${liveStreams.length} streams happening right now`}
              videos={liveStreams}
              cardSize="standard"
            />
          )}

          {/* VODs — recent */}
          {vodStreams.length > 0 && (
            <FeedSection
              title="Recent videos"
              subtitle="From creators you follow"
              videos={vodStreams}
              cardSize="standard"
            />
          )}
        </div>
      )}

      {/* ── Trending (For You fallback) ── */}
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
        </div>
      )}
    </div>
  );
}