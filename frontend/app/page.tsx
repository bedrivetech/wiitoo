import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gradient-brand mb-4">
          wiitoo
        </h1>
        <p className="text-lg text-text-secondary mb-8 leading-relaxed">
          A new kind of video platform.
          <br />
          <span className="text-text-muted">Live. VOD. Community.</span>
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/watch/vid-001"
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg transition-all shadow-sm shadow-brand-600/20"
          >
            Watch Demo
          </Link>
          <Link
            href="/watch/vid-001"
            className="px-6 py-2.5 bg-bg-raised text-text-primary font-medium rounded-lg border border-bg-border hover:bg-bg-hover transition-all"
          >
            Explore
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-brand-600/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-400">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h3 className="text-small font-semibold text-text-primary">Live</h3>
            <p className="text-tiny text-text-muted mt-0.5">Real-time. No delay.</p>
          </div>
          <div>
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-ember-500/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ember-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-small font-semibold text-text-primary">VOD</h3>
            <p className="text-tiny text-text-muted mt-0.5">Watch anytime.</p>
          </div>
          <div>
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-brand-600/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-small font-semibold text-text-primary">Community</h3>
            <p className="text-tiny text-text-muted mt-0.5">Together matters.</p>
          </div>
        </div>
      </div>
    </div>
  );
}