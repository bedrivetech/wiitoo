'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Mock — simulate network delay
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl p-8 border text-center"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderColor: 'var(--color-bg-border)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: 'var(--color-brand-400)' }}
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>

            <h1
              className="text-title-2 mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Check your email
            </h1>
            <p className="text-small mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
              If an account exists for <strong style={{ color: 'var(--color-text-secondary)' }}>{email}</strong>,
              you&apos;ll receive a password reset link shortly.
            </p>

            <Link
              href="/auth/login"
              className="inline-block py-2.5 px-6 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
              }}
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="text-center mb-8">
            <h1
              className="text-title-2 mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Reset password
            </h1>
            <p style={{ color: 'var(--color-text-tertiary)' }} className="text-small">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
              }}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center mt-6 text-small" style={{ color: 'var(--color-text-tertiary)' }}>
            <Link
              href="/auth/login"
              className="font-medium hover:underline"
              style={{ color: 'var(--color-brand-400)' }}
            >
              Back to Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}