'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirect = searchParams.get('redirect') || '/';
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [cooldown]);

  const maskEmail = (e: string) => {
    const [name, domain] = e.split('@');
    if (!domain) return e;
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Pasted code
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      // Focus next empty or last
      const nextEmpty = newOtp.findIndex((d) => !d);
      if (nextEmpty >= 0 && nextEmpty < 6) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOtp(code);
      router.push(redirect || '/' as any);
    } catch {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCooldown(30);
    setCanResend(false);
    setError('');
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

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
          {/* Icon */}
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
          <p className="text-small mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            We sent a verification code to
          </p>
          <p className="text-small font-medium mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {email ? maskEmail(email) : 'your email'}
          </p>

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

          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-12 rounded-lg text-center text-body font-semibold outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: `2px solid ${digit ? 'var(--color-brand-600)' : 'var(--color-bg-border)'}`,
                  color: 'var(--color-text-primary)',
                }}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-small font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mb-4"
            style={{
              background:
                'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
            }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          {/* Resend */}
          <div className="text-small" style={{ color: 'var(--color-text-tertiary)' }}>
            {canResend ? (
              <button
                onClick={handleResend}
                className="font-medium hover:underline"
                style={{ color: 'var(--color-brand-400)' }}
              >
                Resend code
              </button>
            ) : (
              <span>
                Resend code in <span style={{ color: 'var(--color-text-secondary)' }}>{cooldown}s</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8 border animate-pulse" style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--color-bg-border)' }} />
            <div className="h-6 w-40 rounded mx-auto mb-2" style={{ backgroundColor: 'var(--color-bg-border)' }} />
            <div className="h-4 w-56 rounded mx-auto mb-6" style={{ backgroundColor: 'var(--color-bg-border)' }} />
            <div className="flex justify-center gap-2 mb-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="w-11 h-12 rounded-lg" style={{ backgroundColor: 'var(--color-bg-border)' }} />
              ))}
            </div>
            <div className="h-10 rounded" style={{ backgroundColor: 'var(--color-bg-border)' }} />
          </div>
        </div>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}