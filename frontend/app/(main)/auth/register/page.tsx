'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTos, setAgreeTos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!agreeTos) {
      setError('Please agree to the Terms of Service');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, displayName);
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl p-8 border"
          style={{
            backgroundColor: 'var(--color-bg-raised)',
            borderColor: 'var(--color-bg-border)',
          }}
        >
          {/* Heading */}
          <div className="text-center mb-8">
            <h1
              className="text-title-2 mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Join Wiitoo
            </h1>
            <p style={{ color: 'var(--color-text-tertiary)' }} className="text-small">
              Create your account and start watching
            </p>
          </div>

          {error && (
            <div
              className="mb-4 px-3 py-2 rounded-lg text-small"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-error)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-small mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full px-3 py-2.5 rounded-lg text-small outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-600)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-bg-border)')}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-small mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg text-small outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-600)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-bg-border)')}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-small mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2.5 rounded-lg text-small outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-600)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-bg-border)')}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-small mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full px-3 py-2.5 rounded-lg text-small outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-bg-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-600)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-bg-border)')}
              />
            </div>

            {/* TOS */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTos}
                onChange={(e) => setAgreeTos(e.target.checked)}
                className="mt-0.5 accent-brand-600"
                style={{ accentColor: 'var(--color-brand-600)' }}
              />
              <span className="text-small" style={{ color: 'var(--color-text-tertiary)' }}>
                I agree to the{' '}
                <span className="hover:underline" style={{ color: 'var(--color-brand-400)' }}>
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="hover:underline" style={{ color: 'var(--color-brand-400)' }}>
                  Privacy Policy
                </span>
              </span>
            </label>

            {/* Create account button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center mt-6 text-small" style={{ color: 'var(--color-text-tertiary)' }}>
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium hover:underline"
              style={{ color: 'var(--color-brand-400)' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}