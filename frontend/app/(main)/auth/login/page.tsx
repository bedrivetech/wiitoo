'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect || '/' as any);
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
              Welcome back
            </h1>
            <p style={{ color: 'var(--color-text-tertiary)' }} className="text-small">
              Sign in to continue watching
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
                onFocus={(e) =>
                  (e.target.style.borderColor = 'var(--color-brand-600)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = 'var(--color-bg-border)')
                }
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-small outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-base)',
                    border: '1px solid var(--color-bg-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = 'var(--color-brand-600)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = 'var(--color-bg-border)')
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link
                href="/auth/reset-password"
                className="text-small hover:underline"
                style={{ color: 'var(--color-brand-400)' }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-bg-border)' }} />
            <span className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>
              or continue with
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-bg-border)' }} />
          </div>

          {/* Social buttons */}
          <div className="flex gap-3">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-small font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-bg-hover)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-bg-border)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-small font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-bg-hover)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-bg-border)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" color="#9147FF">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
              Twitch
            </button>
          </div>

          {/* Register link */}
          <p className="text-center mt-6 text-small" style={{ color: 'var(--color-text-tertiary)' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="font-medium hover:underline"
              style={{ color: 'var(--color-brand-400)' }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8 border animate-pulse" style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}>
            <div className="h-6 w-40 rounded mx-auto mb-2" style={{ backgroundColor: 'var(--color-bg-border)' }} />
            <div className="h-4 w-52 rounded mx-auto mb-8" style={{ backgroundColor: 'var(--color-bg-border)' }} />
            <div className="space-y-4">
              <div className="h-10 rounded" style={{ backgroundColor: 'var(--color-bg-border)' }} />
              <div className="h-10 rounded" style={{ backgroundColor: 'var(--color-bg-border)' }} />
              <div className="h-10 rounded" style={{ backgroundColor: 'var(--color-bg-border)' }} />
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}