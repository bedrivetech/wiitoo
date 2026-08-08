'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import CategoriesBar from '@/components/browse/categories-bar';
import { useAuthStore } from '@/lib/auth-store';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
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
            {isAuthenticated ? (
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
            ) : (
              <Link
                href="/auth"
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
              </Link>
            )}

            {/* User */}
            {isAuthenticated && user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-tiny font-bold transition-colors"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
                    color: 'white',
                    border: userMenuOpen ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
                  }}
                  title="Account"
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl py-1.5 animate-fade-in"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-bg-border)',
                    }}
                  >
                    {/* User info */}
                    <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--color-bg-border)' }}>
                      <p className="text-small font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {user.displayName}
                      </p>
                      <p className="text-tiny mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <DropdownItem href="/settings" icon={<UserIcon />} label="Profile" onClick={() => setUserMenuOpen(false)} />
                      <DropdownItem href="/history" icon={<VideoIcon />} label="Your videos" onClick={() => setUserMenuOpen(false)} />
                      <DropdownItem href="/studio" icon={<StudioIcon />} label="Creator Studio" onClick={() => setUserMenuOpen(false)} />
                      <DropdownItem href="/settings" icon={<SettingsIcon />} label="Settings" onClick={() => setUserMenuOpen(false)} />
                    </div>

                    <div className="border-t" style={{ borderColor: 'var(--color-bg-border)' }}>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 text-small transition-all"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                          e.currentTarget.style.color = 'var(--color-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--color-text-tertiary)';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
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
              </Link>
            )}
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

/* ─── Dropdown Item ─── */

function DropdownItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href as any}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-small transition-all"
      style={{ color: 'var(--color-text-secondary)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
        e.currentTarget.style.color = 'var(--color-text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--color-text-secondary)';
      }}
    >
      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      {label}
    </Link>
  );
}

/* ─── Icons ─── */

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}