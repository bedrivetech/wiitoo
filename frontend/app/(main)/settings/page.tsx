'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [bio, setBio] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [autoplay, setAutoplay] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [creatorMode, setCreatorMode] = useState<'convert' | 'separate' | null>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-title-2 mb-8 text-text-primary">
        Settings
      </h1>

      <div className="space-y-8">
        {/* ── Profile Section ── */}
        <section>
          <h2 className="text-subtitle mb-4 text-text-primary">Profile</h2>
          <div className="rounded-xl p-5 border border-bg-border bg-bg-raised space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-body font-bold text-white">
                {isAuthenticated && user
                  ? (user.display_name || user.username || '?').charAt(0).toUpperCase()
                  : '?'}
              </div>
              <div>
                <p className="text-small font-medium text-text-primary">Avatar</p>
                <p className="text-tiny mt-0.5 text-text-tertiary">PNG, JPG or WEBP. 1:1 ratio recommended.</p>
              </div>
              <button className="ml-auto px-3 py-1.5 rounded-lg text-small font-medium text-text-secondary border border-bg-border transition-all hover:bg-bg-hover">
                Change
              </button>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-small mb-1.5 text-text-secondary">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-small outline-none transition-colors bg-bg-base border border-bg-border text-text-primary focus:border-brand-600"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-small mb-1.5 text-text-secondary">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 rounded-lg text-small outline-none resize-none transition-colors bg-bg-base border border-bg-border text-text-primary focus:border-brand-600 placeholder:text-text-muted"
              />
            </div>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-small font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 hover:opacity-90 transition-opacity"
            >
              {saved ? 'Saved!' : 'Save profile'}
            </button>
          </div>
        </section>

        {/* ── Preferences Section ── */}
        <section>
          <h2 className="text-subtitle mb-4 text-text-primary">Preferences</h2>
          <div className="rounded-xl p-5 border border-bg-border bg-bg-raised space-y-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-text-primary">Theme</p>
                <p className="text-tiny mt-0.5 text-text-tertiary">Choose dark or light mode</p>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                className="px-3 py-1.5 rounded-lg text-small outline-none transition-colors bg-bg-base border border-bg-border text-text-primary"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Autoplay */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-text-primary">Autoplay</p>
                <p className="text-tiny mt-0.5 text-text-tertiary">Automatically play next video</p>
              </div>
              <ToggleSwitch enabled={autoplay} onChange={() => setAutoplay(!autoplay)} />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-text-primary">Reduced motion</p>
                <p className="text-tiny mt-0.5 text-text-tertiary">Minimize animations and transitions</p>
              </div>
              <ToggleSwitch enabled={reducedMotion} onChange={() => setReducedMotion(!reducedMotion)} />
            </div>
          </div>
        </section>

        {/* ── Creator Section ── */}
        {isAuthenticated && (
          <section>
            <h2 className="text-subtitle mb-4 text-text-primary">Creator</h2>
            <div className="rounded-xl p-5 border border-bg-border bg-bg-raised space-y-4">
              <p className="text-small text-text-secondary">
                Stream live, upload VODs, build your audience. Your current account can become a creator account with a few clicks.
              </p>
              <button
                onClick={() => setShowCreatorModal(true)}
                className="w-full py-2.5 px-4 rounded-lg text-small font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 hover:opacity-90 transition-all"
              >
                Become a Creator
              </button>
            </div>
          </section>
        )}

        {/* ── Account Section ── */}
        <section>
          <h2 className="text-subtitle mb-4 text-text-primary">Account</h2>
          <div className="rounded-xl p-5 border border-bg-border bg-bg-raised space-y-4">
            {/* Email */}
            <div>
              <label className="block text-small mb-1.5 text-text-secondary">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 rounded-lg text-small cursor-not-allowed bg-bg-base border border-bg-border text-text-muted"
              />
              <p className="text-tiny mt-1 text-text-muted">Email cannot be changed</p>
            </div>

            {/* Change Password */}
            <button className="w-full text-left px-3 py-2.5 rounded-lg text-small font-medium text-text-secondary border border-bg-border transition-all hover:bg-bg-hover">
              Change password
            </button>

            {/* Delete Account */}
            <button className="w-full text-left px-3 py-2.5 rounded-lg text-small font-medium border border-error/20 text-error transition-all hover:bg-error/10">
              Delete account
            </button>
          </div>
        </section>
      </div>

      {/* ── Creator Conversion Modal — CSS transition ── */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-200 ease-out ${
          showCreatorModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={() => setShowCreatorModal(false)}
      >
        <div
          className={`w-full max-w-md rounded-2xl p-6 border border-bg-border bg-bg-raised transition-all duration-200 ease-out ${
            showCreatorModal ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
              <h3 className="text-title-2 mb-2 text-text-primary">Become a Creator</h3>
              <p className="text-small mb-6 text-text-tertiary">
                Choose how you want to start creating on Wiitoo.
              </p>

              <div className="space-y-3">
                {/* Convert current */}
                <button
                  onClick={() => setCreatorMode('convert')}
                  className={`w-full text-left rounded-xl p-4 border transition-all ${
                    creatorMode === 'convert'
                      ? 'border-brand-600/30 bg-brand-600/10'
                      : 'border-bg-border bg-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-title-3">🔄</span>
                    <div>
                      <p className="text-small font-medium text-text-primary">Convert this account</p>
                      <p className="text-tiny mt-0.5 text-text-tertiary">
                        Keep your followers, history, and subscriptions. Just add creator features like streaming and uploads.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Separate creator */}
                <button
                  onClick={() => setCreatorMode('separate')}
                  className={`w-full text-left rounded-xl p-4 border transition-all ${
                    creatorMode === 'separate'
                      ? 'border-brand-600/30 bg-brand-600/10'
                      : 'border-bg-border bg-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-title-3">✨</span>
                    <div>
                      <p className="text-small font-medium text-text-primary">Create a new creator account</p>
                      <p className="text-tiny mt-0.5 text-text-tertiary">
                        A separate brand identity with its own name, followers, and stream keys. Linked to your viewer account.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreatorModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-small font-medium border border-bg-border text-text-secondary hover:bg-bg-hover transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCreatorModal(false);
                    router.push('/studio');
                  }}
                  disabled={!creatorMode}
                  className={`flex-1 py-2.5 rounded-xl text-small font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 transition-all ${
                    creatorMode ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  {creatorMode === 'convert'
                    ? 'Enable Creator'
                    : creatorMode === 'separate'
                      ? 'Create Account'
                      : 'Select an option'}
                </button>
              </div>
        </div>
      </div>
    </div>
  );
}

/* ── Toggle Switch ── */
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        enabled ? 'bg-brand-600' : 'bg-bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
          enabled ? 'left-[22px]' : 'left-[2px]'
        }`}
      />
    </button>
  );
}