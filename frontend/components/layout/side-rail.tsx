'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { categories } from '@/lib/mock-data';

export default function SideRail() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const isCategoryActive = (slug: string) =>
    pathname === `/browse/${slug}`;

  return (
    <aside className="group/sidebar relative flex-shrink-0">
      {/* Collapsed rail — icons only, always visible */}
      <nav
        className="
          flex flex-col h-screen sticky top-0
          w-14
          bg-bg-base
          border-r border-bg-border
          overflow-hidden
          z-40
        "
      >
        {/* Logo toggle area */}
        <div className="flex items-center justify-center h-12 flex-shrink-0">
          <span className="text-lg font-bold" style={{
            background: 'linear-gradient(135deg, var(--color-brand-400), var(--color-ember-400))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            W
          </span>
        </div>

        {/* Divider */}
        <div className="mx-3 my-1 h-px bg-bg-border" />

        {/* Primary nav — icons only */}
        <div className="flex flex-col items-center gap-0.5 px-1.5">
          <RailIcon
            href="/"
            icon={<HomeIcon />}
            label="Home"
            active={pathname === '/'}
          />
          <RailIcon
            href="/?tab=following"
            icon={<FollowingIcon />}
            label="Following"
            active={pathname === '/?tab=following'}
          />
          <RailIcon
            href="/?tab=picks"
            icon={<PicksIcon />}
            label="Picks"
            active={pathname === '/?tab=picks'}
          />
        </div>

        {/* Divider */}
        <div className="mx-3 my-1.5 h-px bg-bg-border" />

        {/* Categories — icons only, scrollable */}
        <div className="flex-1 flex flex-col items-center gap-0.5 px-1.5 overflow-y-auto scrollbar-none py-0.5">
          {categories.map((cat) => (
            <RailIcon
              key={cat.id}
              href={`/browse/${cat.slug}`}
              icon={catIcons[cat.slug as keyof typeof catIcons] || <DefaultIcon />}
              label={cat.label}
              active={isCategoryActive(cat.slug)}
              isSuper={cat.isSuperLeader}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 my-1 h-px bg-bg-border" />

        {/* Library & bottom — icons only */}
        <div className="flex flex-col items-center gap-0.5 px-1.5 pb-2">
          <RailIcon
            href="/history"
            icon={<HistoryIcon />}
            label="History"
            active={false}
          />
          <RailIcon
            href="/liked"
            icon={<LikedIcon />}
            label="Liked"
            active={false}
          />
          <RailIcon
            href="/settings"
            icon={<SettingsIcon />}
            label="Settings"
            active={false}
          />
        </div>
      </nav>

      {/* Expanded overlay — shown on hover */}
      <nav
        className="
          absolute top-0 left-full z-50
          w-56
          bg-bg-base
          border-r border-bg-border
          h-screen overflow-y-auto
          opacity-0 invisible
          group-hover/sidebar:opacity-100 group-hover/sidebar:visible
          transition-all duration-200 ease-out
          translate-x-[-8px] group-hover/sidebar:translate-x-0
          shadow-2xl
          scrollbar-none
        "
      >
        {/* Logo + label */}
        <div className="flex items-center gap-2 h-12 px-4 flex-shrink-0">
          <span className="text-lg font-bold" style={{
            background: 'linear-gradient(135deg, var(--color-brand-400), var(--color-ember-400))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            wiitoo
          </span>
        </div>

        <div className="mx-4 mb-1 h-px bg-bg-border" />

        {/* Primary nav — with labels */}
        <div className="flex flex-col gap-0.5 px-2">
          <RailLabel
            href="/"
            icon={<HomeIcon />}
            label="Home"
            active={pathname === '/'}
          />
          <RailLabel
            href="/?tab=following"
            icon={<FollowingIcon />}
            label="Following"
            active={pathname === '/?tab=following'}
          />
          <RailLabel
            href="/?tab=picks"
            icon={<PicksIcon />}
            label="Wiitoo Picks"
            active={pathname === '/?tab=picks'}
          />
        </div>

        <div className="mx-4 my-2 h-px bg-bg-border" />

        {/* Categories section header */}
        <div className="px-4 pb-1.5 text-caption text-text-tertiary tracking-wider">
          Categories
        </div>

        <div className="flex flex-col gap-0.5 px-2 pb-2">
          {categories.map((cat) => (
            <RailLabel
              key={cat.id}
              href={`/browse/${cat.slug}`}
              icon={catIcons[cat.slug as keyof typeof catIcons] || <DefaultIcon />}
              label={cat.label}
              active={isCategoryActive(cat.slug)}
              isSuper={cat.isSuperLeader}
            />
          ))}
        </div>

        <div className="mx-4 my-2 h-px bg-bg-border" />

        {/* Library section header */}
        <div className="px-4 pb-1.5 text-caption text-text-tertiary tracking-wider">
          Library
        </div>

        <div className="flex flex-col gap-0.5 px-2 pb-2">
          <RailLabel
            href="/history"
            icon={<HistoryIcon />}
            label="History"
            active={false}
          />
          <RailLabel
            href="/liked"
            icon={<LikedIcon />}
            label="Liked Videos"
            active={false}
          />
          <RailLabel
            href="/watch-later"
            icon={<WatchLaterIcon />}
            label="Watch Later"
            active={false}
          />
        </div>

        <div className="mx-4 my-2 h-px bg-bg-border" />

        <div className="flex flex-col gap-0.5 px-2 pb-4">
          <RailLabel
            href="/settings"
            icon={<SettingsIcon />}
            label="Settings"
            active={false}
          />
          <RailLabel
            href="/studio"
            icon={<StudioIcon />}
            label="Creator Studio"
            active={false}
          />
        </div>
      </nav>
    </aside>
  );
}

/* ─── Collapsed icon button ─── */

function RailIcon({
  href,
  icon,
  label,
  active,
  isSuper,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  isSuper?: boolean;
}) {
  return (
    <Link
      href={href as any}
      title={label}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-xl
        transition-all duration-150
        ${
          active
            ? isSuper
              ? 'text-brand-400 bg-brand-600/15'
              : 'text-text-primary bg-bg-elevated'
            : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover'
        }
      `}
    >
      {icon}
      {isSuper && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
          style={{
            background:
              'linear-gradient(135deg, var(--color-brand-400), var(--color-ember-400))',
          }}
        />
      )}
    </Link>
  );
}

/* ─── Expanded label button ─── */

function RailLabel({
  href,
  icon,
  label,
  active,
  isSuper,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  isSuper?: boolean;
}) {
  return (
    <Link
      href={href as any}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-small font-medium
        transition-all duration-150
        ${
          active
            ? isSuper
              ? 'text-brand-400 bg-brand-600/15'
              : 'text-text-primary bg-bg-elevated'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
        }
      `}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {isSuper && (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background:
              'linear-gradient(135deg, var(--color-brand-400), var(--color-ember-400))',
          }}
        />
      )}
    </Link>
  );
}

/* ─── Icons ─── */

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function FollowingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PicksIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LikedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function WatchLaterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
      <path d="M12 2v2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function DefaultIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

/* ─── Category-specific icons ─── */

const catIcons = {
  music: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  gaming: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="11" x2="10" y2="11" />
      <line x1="8" y1="9" x2="8" y2="13" />
      <line x1="15" y1="12" x2="15.01" y2="12" />
      <line x1="18" y1="10" x2="18.01" y2="10" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
    </svg>
  ),
  creative: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  tech: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  education: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  irl: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  sports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  anime: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  podcasts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  asmr: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
};