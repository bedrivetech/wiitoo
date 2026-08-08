'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

export default function StudioPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4">
      <div
        className="relative rounded-2xl p-10 border text-center max-w-md w-full"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-bg-border)',
        }}
      >
        {/* Coming soon tag */}
        <span
          className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-tiny font-semibold"
          style={{
            background:
              'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
            color: 'white',
          }}
        >
          Coming soon
        </span>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))',
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: 'var(--color-brand-400)' }}
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </div>

        <h2
          className="text-title-2 mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Creator Studio
        </h2>
        <p className="text-small mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
          Your creator dashboard is a separate app
        </p>

        <a
          href="https://studio.wiitoo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 py-2.5 px-6 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background:
              'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
          }}
        >
          Launch Studio
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        {!isAuthenticated && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-bg-border)' }} />
              <span className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>
                or
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-bg-border)' }} />
            </div>

            <Link
              href={{ pathname: '/auth', query: { redirect: '/studio' } }}
              className="inline-block py-2 px-4 rounded-lg text-small font-medium transition-all"
              style={{
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Become a creator
            </Link>
          </>
        )}
      </div>
    </div>
  );
}