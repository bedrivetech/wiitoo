import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wiitoo Studio',
  description: 'Creator dashboard for Wiitoo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <StudioSidebar />
          {/* Main */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <StudioHeader />
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function StudioHeader() {
  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{
        backgroundColor: 'var(--color-bg-raised)',
        borderColor: 'var(--color-bg-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
              color: 'white',
            }}
          >
            W
          </div>
          <span className="text-small font-semibold hidden sm:inline" style={{ color: 'var(--color-text-secondary)' }}>
            Studio
          </span>
        </div>
        {/* Indicator */}
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-tiny"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: 'var(--color-success)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
          Live Demo
        </span>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="text-tiny px-3 py-1.5 rounded-lg transition-all"
          style={{
            border: '1px solid var(--color-bg-border)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          View site
        </a>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-tiny font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
            color: 'white',
          }}
        >
          Y
        </div>
      </div>
    </header>
  );
}

function StudioSidebar() {
  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/stream', label: 'Stream Keys', icon: '📡' },
    { href: '/vods', label: 'VODs', icon: '🎬' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav
      className="w-56 flex-shrink-0 border-r flex flex-col"
      style={{
        backgroundColor: 'var(--color-bg-raised)',
        borderColor: 'var(--color-bg-border)',
      }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--color-bg-border)' }}>
        <span className="text-title-3 font-bold text-gradient-brand">wiitoo</span>
        <span className="text-tiny ml-2" style={{ color: 'var(--color-text-muted)' }}>studio</span>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-small transition-all hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
            style={{
              color: 'var(--color-text-secondary)',
            }}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--color-bg-border)' }}>
        <p className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>
          studio.wiitoo.com
        </p>
      </div>
    </nav>
  );
}