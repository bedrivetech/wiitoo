'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import type { VideoData } from '@/lib/types';
import { useUiStore } from '@/lib/store';

/* ── Helpers ── */

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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

/* ── Thumbnail placeholder ── */

export function ThumbnailPlaceholder({ title, isLive }: { title: string; isLive: boolean }) {
  const hue = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-full aspect-video rounded-lg flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 20%, 12%), hsl(${(hue + 40) % 360}, 15%, 8%))`,
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-text-muted opacity-40"
      >
        {isLive ? (
          <rect x="4" y="4" width="16" height="16" rx="4" />
        ) : (
          <polygon points="10 8 16 12 10 16 10 8" />
        )}
      </svg>
    </div>
  );
}

/* ── Props ── */

interface ContentCardProps {
  video: VideoData;
  size?: 'standard' | 'large';
}

/* ── Component ── */

export default function ContentCard({ video, size = 'standard' }: ContentCardProps) {
  const [hoverIntensity, setHoverIntensity] = useState(0);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExclusive = video.creator.isExclusive;
  const isLive = video.isLive;

  const handleMouseEnter = () => {
    // Delay preview effect slightly to avoid flash on quick mouse passes
    hoverTimer.current = setTimeout(() => setHoverIntensity(1), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverIntensity(0);
  };

  return (
    <Link
      href={isLive ? `/watch/${video.id}?live=1` : `/watch/${video.id}`}
      className={`group block rounded-lg transition-all duration-200 ${
        isExclusive ? 'relative' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Exclusive gradient border */}
      {isExclusive && (
        <div
          className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(245,158,11,0.15))',
            zIndex: 0,
          }}
        />
      )}

      <div className="relative z-[1]">
        {/* Thumbnail */}
        <div className="relative overflow-hidden rounded-lg">
          {/* Glow rings */}
          {isLive && isExclusive && (
            <div className="absolute -inset-[1px] rounded-lg animate-ember-glow pointer-events-none" />
          )}
          {isLive && !isExclusive && (
            <div className="absolute -inset-[1px] rounded-lg animate-pulse-live opacity-30 pointer-events-none" />
          )}

          {/* Hover scale + preview simulation */}
          <div
            className="transform transition-all duration-300 ease-out"
            style={{
              transform: `scale(${1 + hoverIntensity * 0.02})`,
              filter: hoverIntensity ? `brightness(${1 + hoverIntensity * 0.08}) saturate(${1 + hoverIntensity * 0.1})` : undefined,
            }}
          >
            {video.posterUrl ? (
              <img
                src={video.posterUrl}
                alt={video.title}
                className="w-full aspect-video object-cover rounded-lg"
              />
            ) : (
              <ThumbnailPlaceholder title={video.title} isLive={isLive} />
            )}

            {/* Preview shimmer overlay — simulates hover preview */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300"
              style={{
                opacity: hoverIntensity,
                background: 'linear-gradient(135deg, transparent 0%, rgba(124,58,237,0.06) 25%, rgba(245,158,11,0.04) 50%, transparent 75%)',
              }}
            />
          </div>

          {/* Top-left badge */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {isLive && (
              <span className="px-1.5 py-0.5 bg-live text-white text-[11px] font-semibold rounded-[3px] flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-live" />
                LIVE
              </span>
            )}
            {!isLive && isExclusive && (
              <span
                className="px-1.5 py-0.5 text-[11px] font-semibold rounded-[3px] shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(245,158,11,0.12))',
                  color: 'rgba(196, 181, 253, 0.9)',
                }}
              >
                ★ Wiitoo
              </span>
            )}
          </div>

          {/* Bottom-right info */}
          <div className="absolute bottom-2 right-2">
            {!isLive && video.duration > 0 && (
              <span className="px-1 py-[1px] bg-black/80 text-white text-[11px] font-medium rounded-[3px]">
                {formatDuration(video.duration)}
              </span>
            )}
            {isLive && video.liveViewers !== undefined && (
              <span className="px-1.5 py-0.5 bg-black/70 text-text-secondary text-[11px] font-medium rounded-[3px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-live" />
                {formatCount(video.liveViewers)} watching
              </span>
            )}
          </div>
        </div>

        {/* Meta below thumbnail */}
        <div className={`mt-2.5 ${size === 'large' ? 'px-0.5' : ''}`}>
          <h3
            className={`font-semibold text-text-primary leading-snug line-clamp-2 ${
              size === 'large' ? 'text-[15px]' : 'text-[14px]'
            }`}
          >
            {video.title}
          </h3>

          {/* Creator row */}
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-small text-text-tertiary truncate">
              {video.creator.displayName}
            </span>
            {isExclusive && (
              <span className="w-1.5 h-1.5 rounded-full bg-ember-400 inline-block flex-shrink-0" />
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-1 text-tiny text-text-muted mt-0.5">
            {isLive ? (
              <span className="text-live text-[11px] font-semibold">
                {formatCount(video.liveViewers ?? 0)} watching
              </span>
            ) : (
              <>
                <span>{formatCount(video.views)} views</span>
                <span className="text-text-disabled">·</span>
                <span>{timeAgo(video.publishedAt)}</span>
              </>
            )}
            {video.category && (
              <>
                <span className="text-text-disabled">·</span>
                <span>{video.category}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}