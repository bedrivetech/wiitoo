'use client';

import ContentCard from '@/components/browse/content-card';
import type { VideoData, Creator } from '@/lib/types';
import { formatCount } from '@/lib/utils';

/* ── Props ── */

interface FolderViewProps {
  creator: Creator;
  videos: VideoData[];
}

/* ── Component ── */

export default function FolderView({ creator, videos }: FolderViewProps) {
  const liveVideos = videos.filter((v) => v.isLive);
  const vodVideos = videos.filter((v) => !v.isLive);

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-small text-text-tertiary mb-6">
        <a href="/browse" className="hover:text-text-secondary transition-colors">
          Browse
        </a>
        <span className="text-text-disabled">/</span>
        <span className="text-text-primary">{creator.displayName}</span>
      </div>

      {/* Creator header */}
      <div className="flex items-start gap-5 mb-8">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {creator.isExclusive && (
            <div
              className="absolute -inset-[2px] rounded-full animate-ember-glow pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(245,158,11,0.15))',
              }}
            />
          )}
          <div className="w-20 h-20 rounded-full bg-bg-elevated flex items-center justify-center relative z-[1]">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-text-muted"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-title-2 text-text-primary truncate">
              {creator.displayName}
            </h1>
            {creator.isExclusive && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-brand-400), var(--color-ember-400))',
                }}
              />
            )}
          </div>
          <p className="text-small text-text-tertiary mt-0.5">
            @{creator.username}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-tiny text-text-muted">
            <span>{formatCount(creator.followers)} followers</span>
          </div>

          {/* Bio */}
          <p className="text-small text-text-secondary mt-3 max-w-xl leading-relaxed">
            {creator.isExclusive
              ? 'A Wiitoo Exclusive creator pushing the boundaries of their craft. Catch them live or dive into their library.'
              : 'Content creator making waves on Wiitoo. Follow to never miss a stream.'}
          </p>

          {/* Category */}
          {videos[0]?.category && (
            <div className="flex items-center gap-2 mt-3">
              <a
                href={`/browse/${videos[0].category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="px-2.5 py-1 bg-bg-elevated text-tiny text-text-secondary rounded-md hover:bg-bg-hover transition-colors"
              >
                {videos[0].category}
              </a>
              {creator.isExclusive && (
                <span className="px-2.5 py-1 rounded-md text-tiny"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))',
                    color: 'rgba(196, 181, 253, 0.85)',
                  }}
                >
                  ★ Wiitoo Picks
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <button
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-small font-semibold rounded-lg transition-all"
            >
              Follow
            </button>
            <button
              className="px-4 py-1.5 bg-bg-elevated border border-bg-border text-text-primary text-small font-medium rounded-lg hover:bg-bg-hover transition-all"
            >
              Subscribe
            </button>
            <button
              className="px-4 py-1.5 bg-ember-500/10 border border-ember-500/20 text-ember-400 text-small font-medium rounded-lg hover:bg-ember-500/15 transition-all"
            >
              Send Tip
            </button>
          </div>
        </div>
      </div>

      {/* Live section */}
      {liveVideos.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-live rounded-full animate-pulse-live" />
            <h2 className="text-title-3 text-text-primary">
              Live now
            </h2>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {liveVideos.map((video) => (
              <ContentCard key={video.id} video={video} size="standard" />
            ))}
          </div>
        </section>
      )}

      {/* VOD section */}
      {vodVideos.length > 0 && (
        <section>
          <h2 className="text-title-3 text-text-primary mb-4">
            All videos
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {vodVideos.map((video) => (
              <ContentCard key={video.id} video={video} size="standard" />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {videos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-tertiary">No content yet</p>
        </div>
      )}
    </div>
  );
}