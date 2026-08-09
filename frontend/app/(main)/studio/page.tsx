'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function StudioPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
    if (cardsRef.current) {
      const items = cardsRef.current.querySelectorAll('.studio-card');
      gsap.fromTo(items, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' });
    }
  }, []);

  const router = useRouter();

  const stats = [
    { label: 'Total views', value: '—' },
    { label: 'Followers', value: user?.username ? '0' : '—' },
    { label: 'Videos', value: '0' },
    { label: 'Revenue', value: '$0.00' },
  ];

  const quickActions = [
    {
      title: 'Go Live',
      desc: 'Start streaming to your audience',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-live">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
        </svg>
      ),
      href: '#',
      accent: true,
    },
    {
      title: 'Upload Video',
      desc: 'Share a recorded stream or new content',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      href: '#',
    },
    {
      title: 'Stream Settings',
      desc: 'Configure your stream key and quality',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ember-400">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
      href: '#',
    },
    {
      title: 'Analytics',
      desc: 'View your performance and insights',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      href: '#',
    },
  ];

  const needsCreatorSetup = !isAuthenticated || true; // Always show CTA for now

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      {/* Header */}
      <div ref={headerRef} className="mb-8">
        <h1 className="text-title-2 text-text-primary">Creator Studio</h1>
        <p className="text-small text-text-tertiary mt-1">Manage your content, streams, and audience</p>
      </div>

      {needsCreatorSetup ? (
        /* ── Setup CTA (shown when not yet a creator) ── */
        <div className="rounded-2xl border border-bg-border bg-bg-raised p-8 md:p-10 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600/20 to-ember-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h2 className="text-title-3 text-text-primary mb-2">You&apos;re almost a creator</h2>
          <p className="text-small text-text-tertiary mb-6 max-w-sm mx-auto">
            Set up your creator profile to start streaming, uploading, and building your audience on Wiitoo.
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-small font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 hover:opacity-90 transition-opacity"
          >
            Set up creator profile
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        /* ── Dashboard (when creator is set up) ── */
        <>
          {/* Quick Stats */}
          <div ref={cardsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="studio-card rounded-xl border border-bg-border bg-bg-raised p-4">
                <p className="text-tiny text-text-tertiary">{stat.label}</p>
                <p className="text-title-2 text-text-primary mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <h2 className="text-subtitle text-text-primary mb-3">Quick actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => {}}
                className={`studio-card rounded-xl border p-4 transition-all hover:-translate-y-0.5 text-left ${
                  action.accent
                    ? 'border-live/30 bg-live/5 hover:bg-live/10 hover:border-live/50'
                    : 'border-bg-border bg-bg-raised hover:bg-bg-hover'
                }`}
              >
                <div className="mb-3">{action.icon}</div>
                <p className="text-small font-medium text-text-primary">{action.title}</p>
                <p className="text-tiny text-text-tertiary mt-0.5">{action.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}