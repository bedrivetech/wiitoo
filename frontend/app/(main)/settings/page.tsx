'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [autoplay, setAutoplay] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1
        className="text-title-2 mb-8"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Settings
      </h1>

      <div className="space-y-8">
        {/* ── Profile Section ── */}
        <section>
          <h2
            className="text-subtitle mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Profile
          </h2>
          <div
            className="rounded-xl p-5 border space-y-4"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderColor: 'var(--color-bg-border)',
            }}
          >
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-body font-bold"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
                  color: 'white',
                }}
              >
                {isAuthenticated && user
                  ? user.displayName.charAt(0).toUpperCase()
                  : '?'}
              </div>
              <div>
                <p className="text-small font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Avatar
                </p>
                <p className="text-tiny mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  PNG, JPG or WEBP. 1:1 ratio recommended.
                </p>
              </div>
              <button
                className="ml-auto px-3 py-1.5 rounded-lg text-small font-medium transition-all"
                style={{
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Change
              </button>
            </div>

            {/* Display Name */}
            <div>
              <label
                className="block text-small mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-small outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-600)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-bg-border)')}
              />
            </div>

            {/* Bio */}
            <div>
              <label
                className="block text-small mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 rounded-lg text-small outline-none resize-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-600)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-bg-border)')}
              />
            </div>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
              }}
            >
              {saved ? 'Saved!' : 'Save profile'}
            </button>
          </div>
        </section>

        {/* ── Preferences Section ── */}
        <section>
          <h2
            className="text-subtitle mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Preferences
          </h2>
          <div
            className="rounded-xl p-5 border space-y-4"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderColor: 'var(--color-bg-border)',
            }}
          >
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Theme
                </p>
                <p className="text-tiny mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  Choose dark or light mode
                </p>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                className="px-3 py-1.5 rounded-lg text-small outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Autoplay */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Autoplay
                </p>
                <p className="text-tiny mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  Automatically play next video
                </p>
              </div>
              <button
                onClick={() => setAutoplay(!autoplay)}
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{
                  backgroundColor: autoplay ? 'var(--color-brand-600)' : 'var(--color-bg-border)',
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{
                    left: autoplay ? '22px' : '2px',
                  }}
                />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Reduced motion
                </p>
                <p className="text-tiny mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  Minimize animations and transitions
                </p>
              </div>
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{
                  backgroundColor: reducedMotion ? 'var(--color-brand-600)' : 'var(--color-bg-border)',
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{
                    left: reducedMotion ? '22px' : '2px',
                  }}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ── Account Section ── */}
        <section>
          <h2
            className="text-subtitle mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Account
          </h2>
          <div
            className="rounded-xl p-5 border space-y-4"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderColor: 'var(--color-bg-border)',
            }}
          >
            {/* Email */}
            <div>
              <label
                className="block text-small mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 rounded-lg text-small cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <p className="text-tiny mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Email cannot be changed
              </p>
            </div>

            {/* Change Password */}
            <button
              className="w-full text-left px-3 py-2.5 rounded-lg text-small font-medium transition-all"
              style={{
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Change password
            </button>

            {/* Delete Account */}
            <button
              className="w-full text-left px-3 py-2.5 rounded-lg text-small font-medium transition-all"
              style={{
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--color-error)',
              }}
            >
              Delete account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}