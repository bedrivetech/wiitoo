'use client';

import Link from 'next/link';
import ContentCard from '@/components/browse/content-card';
import { useAuthStore } from '@/lib/auth-store';
import { videos } from '@/lib/mock-data';

export default function LikedPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Mock liked videos: random subset of VODs
  const likedVideos = videos
    .filter((v) => !v.isLive)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)
    .map((v) => ({
      ...v,
      likedAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }))
    .sort(
      (a, b) =>
        new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime()
    );

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
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
        </div>
        <h2
          className="text-title-3 mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Sign in to see your liked videos
        </h2>
        <p className="text-small mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
          All the videos you&apos;ve liked in one place
        </p>
        <Link
          href="/auth/login?redirect=/liked"
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
        Liked videos
      </h1>

      {likedVideos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-small" style={{ color: 'var(--color-text-tertiary)' }}>
            No liked videos yet
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-small font-medium hover:underline"
            style={{ color: 'var(--color-brand-400)' }}
          >
            Browse videos
          </Link>
        </div>
      ) : (
        <>
          <p
            className="text-small mb-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Sorted by date liked
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {likedVideos.map((video) => (
              <div key={video.id}>
                <ContentCard video={video} />
                <p
                  className="text-tiny mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Liked{' '}
                  {new Date(video.likedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}