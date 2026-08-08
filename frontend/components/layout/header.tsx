'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import CategoriesBar from '@/components/browse/categories-bar';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const isBrowse =
    pathname === '/' ||
    pathname.startsWith('/browse') ||
    pathname.startsWith('/creator') ||
    pathname.startsWith('/search');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-lg border-b border-bg-border">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center h-12 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 flex-shrink-0"
          >
            <span
              className="text-xl font-bold tracking-tight"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-brand-400), var(--color-ember-400))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              wiitoo
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center max-w-xs w-full">
            <div className="relative w-full">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                placeholder="Search Wiitoo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-small bg-bg-inset border border-bg-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-600/40 transition-colors"
              />
            </div>
          </form>

          {/* Nav actions */}
          <div className="flex items-center gap-1">
            {/* Upload */}
            <button
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-all"
              title="Upload"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>

            {/* User */}
            <button
              className="w-7 h-7 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center hover:border-text-muted transition-colors"
              title="Account"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-text-tertiary"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Categories bar — show on browse, search, home */}
        {isBrowse && (
          <div className="pb-2 -mx-1 px-1">
            <CategoriesBar />
          </div>
        )}
      </div>
    </header>
  );
}