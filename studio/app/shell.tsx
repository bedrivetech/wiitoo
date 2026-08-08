'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export default function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isConvertPage = pathname === '/convert';

  // Only show sidebar for the main studio pages (not the convert flow)
  if (isConvertPage) {
    return (
      <div className="min-h-screen bg-bg-base">
        <header
          className="flex items-center justify-between px-6 py-3 border-b"
          style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}
        >
          <a href="/studio" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))', color: 'white' }}>
              W
            </div>
            <span className="text-small font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Studio</span>
          </a>
          <a href="/studio"
            className="text-tiny px-3 py-1.5 rounded-lg transition-all"
            style={{ border: '1px solid var(--color-bg-border)', color: 'var(--color-text-tertiary)' }}>
            Dashboard
          </a>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      {/* Sidebar */}
      <StudioSidebar collapsed={sidebarCollapsed} pathname={pathname} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudioHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} pathname={pathname} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function StudioHeader({ onToggleSidebar, pathname }: { onToggleSidebar: () => void; pathname: string }) {
  const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/stream': 'Stream Keys',
    '/vods': 'VODs',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
    '/moderation': 'Moderation',
  };
  const title = pageTitles[pathname] || 'Studio';

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors lg:hidden"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))', color: 'white' }}>
            W
          </div>
          <span className="text-small font-semibold hidden sm:inline" style={{ color: 'var(--color-text-secondary)' }}>
            {title}
          </span>
        </div>
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-tiny"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
          Live Demo
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="px-3 py-1.5 rounded-lg text-tiny font-medium transition-all"
          style={{ border: '1px solid var(--color-bg-border)', color: 'var(--color-text-secondary)' }}
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('wiitoo-auth');
              window.location.href = 'http://localhost:3000';
            }
          }}
        >
          View site
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-tiny font-bold"
          style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))', color: 'white' }}>
          {typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('wiitoo-auth') || '{}')?.state?.user?.display_name?.[0] || 'Y') : 'Y'}
        </div>
      </div>
    </header>
  );
}

function StudioSidebar({ collapsed, pathname }: { collapsed: boolean; pathname: string }) {
  const navGroups = [
    {
      label: 'Main',
      items: [
        { href: '/studio', label: 'Dashboard', icon: '📊' },
        { href: '/studio/stream', label: 'Stream Keys', icon: '📡' },
        { href: '/studio/vods', label: 'VODs', icon: '🎬' },
      ],
    },
    {
      label: 'Engage',
      items: [
        { href: '/studio/analytics', label: 'Analytics', icon: '📈' },
        { href: '/studio/moderation', label: 'Moderation', icon: '🛡️' },
      ],
    },
    {
      label: 'Account',
      items: [
        { href: '/studio/settings', label: 'Settings', icon: '⚙️' },
      ],
    },
  ];

  // Check if the current user is a creator or viewer
  // For demo purposes, we show the convert page for viewers
  const isCreator = true; // Will be determined by auth state in production

  return (
    <nav
      className="w-56 flex-shrink-0 border-r flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--color-bg-border)' }}>
        <div>
          <span className="text-title-3 font-bold text-gradient-brand">wiitoo</span>
          <span className="text-tiny ml-2" style={{ color: 'var(--color-text-muted)' }}>studio</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-tiny uppercase tracking-wider px-3 mb-1.5"
              style={{ color: 'var(--color-text-muted)', fontSize: '10px', letterSpacing: '0.15em' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-small transition-all"
                    style={{
                      backgroundColor: isActive ? 'var(--color-bg-hover)' : 'transparent',
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="px-3 py-3 border-t space-y-1"
        style={{ borderColor: 'var(--color-bg-border)' }}>
        <a
          href="/studio/convert"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-small font-medium transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(245,158,11,0.04))',
            color: 'var(--color-brand-400)',
          }}
        >
          <span className="text-base">✨</span>
          {!collapsed && 'Become a Creator'}
        </a>
        <p className="text-[10px] px-3 pt-1" style={{ color: 'var(--color-text-muted)' }}>
          studio.wiitoo.com
        </p>
      </div>
    </nav>
  );
}