'use client';

import { useState } from 'react';
import Link from 'next/link';
import ContentCard from '@/components/browse/content-card';
import { useAuthStore } from '@/lib/auth-store';
import { videos } from '@/lib/mock-data';

export default function HistoryPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock history: just show some VODs with random watch times
  const historyVideos = videos
    .filter((v) => !v.isLive)
    .map((v) => ({
      ...v,
      watchedAt: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      progress: Math.random(),
    }))
    .sort(
      (a, b) =>
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
    );

  const filtered = searchTerm
    ? historyVideos.filter((v) =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : historyVideos;

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
          </svg>
        </div>
        <h2
          className="text-title-3 mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Sign in to see your history
        </h2>
        <p className="text-small mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
          Watch history helps you find videos you&apos;ve seen before
        </p>
        <Link
          href={{ pathname: '/auth', query: { redirect: '/history' } }}
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-title-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Watch history
        </h1>
        <button
          className="px-3 py-1.5 rounded-lg text-small font-medium transition-all"
          style={{
            color: 'var(--color-text-tertiary)',
            border: '1px solid var(--color-bg-border)',
          }}
          onClick={() => {
            if (confirm('Clear all watch history?')) {
              // Mock clear
            }
          }}
        >
          Clear all history
        </button>
      </div>

      {/* Search filter */}
      <div className="relative max-w-xs mb-6">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-2.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-small rounded-lg outline-none transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-inset)',
            border: '1px solid var(--color-bg-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* History grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-small" style={{ color: 'var(--color-text-tertiary)' }}>
            {searchTerm ? 'No videos found' : 'No watch history yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((video) => (
            <div key={video.id} className="group">
              <ContentCard video={video} />
              {/* Watched timestamp */}
              <p
                className="text-tiny mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Watched{' '}
                {new Date(video.watchedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              {/* Progress bar */}
              <div
                className="w-full h-1 rounded-full mt-1 overflow-hidden"
                style={{ backgroundColor: 'var(--color-bg-border)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(video.progress * 100)}%`,
                    background:
                      'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-400))',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}