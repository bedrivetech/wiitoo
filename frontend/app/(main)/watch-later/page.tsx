'use client';

import Link from 'next/link';
import ContentCard from '@/components/browse/content-card';
import { useAuthStore } from '@/lib/auth-store';
import { videos } from '@/lib/mock-data';

export default function WatchLaterPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Mock watch later: empty to show empty state, then random subset
  const watchLaterVideos = videos
    .filter((v) => !v.isLive)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: 'var(--color-brand-400)' }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
            <path d="M12 2v2" />
          </svg>
        </div>
        <h2
          className="text-title-3 mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Sign in to see your watch later
        </h2>
        <p className="text-small mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
          Save videos to watch later and never lose track
        </p>
        <Link
          href={{ pathname: '/auth', query: { redirect: '/watch-later' } }}
          className="py-2.5 px-6 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background:
              'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
          }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <h1
        className="text-title-2 mb-6"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Watch later
      </h1>

      {watchLaterVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: 'var(--color-brand-400)' }}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
              <path d="M12 2v2" />
            </svg>
          </div>
          <p
            className="text-title-3 mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Save videos to watch later
          </p>
          <p className="text-small mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
            Find something you like and save it for later
          </p>
          <Link
            href="/"
            className="py-2.5 px-6 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background:
                'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
            }}
          >
            Browse videos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {watchLaterVideos.map((video) => (
            <ContentCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}