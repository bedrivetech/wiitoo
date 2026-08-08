'use client';

import { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { EmberParticles } from '@/components/auth/ember-particles';

/* ─── Types ─── */
type AuthStep = 'login' | 'register-name' | 'register-email' | 'register-password' | 'verify' | 'welcome' | 'reset' | 'reset-verify' | 'reset-password';

interface AuthContextType {
  step: AuthStep;
  goTo: (step: AuthStep) => void;
  email: string;
  setEmail: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
}

const AuthContext = createContext<AuthContextType>(null!);
const useAuthContext = () => useContext(AuthContext);

/* ─── Page Entry ─── */
export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  const goTo = useCallback((s: AuthStep) => setStep(s), []);

  return (
    <AuthContext.Provider value={{ step, goTo, email, setEmail, displayName, setDisplayName }}>
      <div className="relative min-h-screen overflow-hidden bg-bg-base">
        {/* Gradient ambient background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-600/3 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-ember-500/3 blur-[120px]" />
        </div>

        <EmberParticles focusIntensity={step === 'welcome' ? 0.8 : 0.3} />

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {step === 'login' && <LoginScreen key="login" />}
              {step === 'register-name' && <RegisterNameStep key="reg-name" />}
              {step === 'register-email' && <RegisterEmailStep key="reg-email" />}
              {step === 'register-password' && <RegisterPasswordStep key="reg-pw" />}
              {step === 'verify' && <OtpScreen key="otp" />}
              {step === 'welcome' && <WelcomeOverlay key="welcome" />}
              {step === 'reset' && <ResetEmailStep key="reset" />}
              {step === 'reset-verify' && <ResetOtpStep key="reset-otp" />}
              {step === 'reset-password' && <ResetPasswordStep key="reset-pw" />}
            </AnimatePresence>
          </div>
        </div>

        {/* Brand watermark */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
          <span className="text-tiny tracking-[0.2em] uppercase text-text-muted/30 select-none">
            Wiitoo
          </span>
        </div>
      </div>
    </AuthContext.Provider>
  );
}

/* ─── Shared Glass Card ─── */
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl p-8 border backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: 'rgba(13, 13, 13, 0.75)',
        borderColor: 'var(--color-bg-border)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Wiitoo Wordmark ─── */
function WiitooLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-body', md: 'text-title-1', lg: 'text-hero' };
  return (
    <div className="text-center mb-6">
      <span className={`${sizes[size]} font-bold tracking-tight text-gradient-brand`}>wiitoo</span>
    </div>
  );
}

/* ─── Animated Input ─── */
function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
  error,
  autoFocus = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className="space-y-1.5">
      <motion.label
        className="block text-tiny font-medium tracking-wide uppercase"
        style={{ color: focused ? 'var(--color-brand-400)' : 'var(--color-text-muted)' }}
        animate={{ color: focused ? 'var(--color-brand-400)' : 'var(--color-text-muted)' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: focused
              ? '0 0 0 1.5px rgba(124, 58, 237, 0.3), 0 0 20px -8px rgba(124, 58, 237, 0.15)'
              : '0 0 0 1px var(--color-bg-border)',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="relative w-full px-3.5 py-3 rounded-lg text-small outline-none bg-transparent"
          style={{
            color: 'var(--color-text-primary)',
            caretColor: 'var(--color-brand-400)',
          }}
        />
      </div>
      {hint && !error && (
        <p className="text-tiny px-1 pt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {hint}
        </p>
      )}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-tiny px-1 pt-0.5"
          style={{ color: 'var(--color-error)' }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/* ─── Primary Button ─── */
function PrimaryButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.01 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`w-full py-2.5 rounded-xl text-small font-semibold text-white relative overflow-hidden transition-opacity ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
          {children}
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

/* ─── Social Button ─── */
function SocialButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
      whileTap={{ scale: 0.98 }}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-tiny font-medium transition-colors"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-bg-border)',
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─── Progress Orbs ─── */
function ProgressOrbs({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          animate={{
            scale: i === current ? 1.4 : 1,
            backgroundColor: i <= current
              ? 'var(--color-brand-500)'
              : i === current + 1 ? 'var(--color-bg-border)' : 'var(--color-bg-border)',
            boxShadow: i <= current
              ? '0 0 6px rgba(124, 58, 237, 0.4)'
              : 'none',
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

/* ==================================================================
   LOGIN SCREEN
   ================================================================== */
function LoginScreen() {
  const router = useRouter();
  const { goTo, email, setEmail } = useAuthContext();
  const login = useAuthStore((s) => s.login);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Both fields are waiting for you.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      goTo('welcome');
    } catch {
      setError('That didn\'t match. Try again?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <WiitooLogo size="md" />

      <motion.h1
        className="text-title-2 text-center mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Welcome back
      </motion.h1>
      <motion.p
        className="text-small text-center mb-8"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Sign in to pick up where you left off
      </motion.p>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3.5 py-2.5 rounded-lg text-tiny"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: 'var(--color-error)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-3.5">
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoFocus
        />
        <div>
          <AuthInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            placeholder="Enter your key"
          />
          <div className="flex items-center justify-between mt-1.5 px-1">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-tiny"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => goTo('reset')}
              className="text-tiny hover:underline"
              style={{ color: 'var(--color-brand-400)' }}
            >
              Forgot your key?
            </button>
          </div>
        </div>

        <PrimaryButton onClick={handleLogin} loading={loading}>
          Sign in
        </PrimaryButton>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-bg-border)' }} />
        <span className="text-tiny uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          or continue with
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-bg-border)' }} />
      </div>

      {/* Social buttons */}
      <div className="flex gap-3 mb-6">
        <SocialButton onClick={() => {}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </SocialButton>
        <SocialButton onClick={() => {}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" color="#9147FF">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
          Twitch
        </SocialButton>
      </div>

      {/* Register CTA */}
      <motion.p
        className="text-center text-small"
        style={{ color: 'var(--color-text-tertiary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        New here?{' '}
        <button
          onClick={() => {
            setEmail('');
            goTo('register-name');
          }}
          className="font-semibold hover:underline"
          style={{ color: 'var(--color-brand-400)' }}
        >
          Create an account
        </button>
      </motion.p>
    </GlassCard>
  );
}

/* ==================================================================
   REGISTER — STEP 1: Name
   ================================================================== */
function RegisterNameStep() {
  const { goTo, displayName, setDisplayName } = useAuthContext();
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!displayName.trim()) {
      setError('Every great story needs a name.');
      return;
    }
    if (displayName.trim().length < 2) {
      setError('At least 2 characters for your name.');
      return;
    }
    goTo('register-email');
  };

  return (
    <GlassCard>
      <ProgressOrbs total={3} current={0} />

      <motion.h2
        className="text-title-2 text-center mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        What should we call you?
      </motion.h2>
      <motion.p
        className="text-small text-center mb-8"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        This is how others will see you on Wiitoo
      </motion.p>

      <div className="space-y-4">
        <AuthInput
          label="Display Name"
          value={displayName}
          onChange={(v) => { setDisplayName(v); setError(''); }}
          placeholder="e.g. PixelRunner, LunaBeats..."
          hint="You can change this later."
          error={error}
          autoFocus
        />

        <PrimaryButton onClick={handleNext}>
          Continue
        </PrimaryButton>

        <button
          onClick={() => goTo('login')}
          className="w-full text-center text-tiny hover:underline pt-2"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Already have an account? Sign in
        </button>
      </div>
    </GlassCard>
  );
}

/* ==================================================================
   REGISTER — STEP 2: Email
   ================================================================== */
function RegisterEmailStep() {
  const { goTo, email, setEmail } = useAuthContext();
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!email.trim()) {
      setError('We need somewhere to reach you.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('That doesn\'t look like an email address.');
      return;
    }
    goTo('register-password');
  };

  return (
    <GlassCard>
      <ProgressOrbs total={3} current={1} />

      <motion.h2
        className="text-title-2 text-center mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Where can we reach you?
      </motion.h2>
      <motion.p
        className="text-small text-center mb-8"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        No spam. We promise. Just the important stuff.
      </motion.p>

      <div className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); setError(''); }}
          placeholder="you@example.com"
          error={error}
          autoFocus
        />

        <PrimaryButton onClick={handleNext}>
          Continue
        </PrimaryButton>

        <button
          onClick={() => goTo('register-name')}
          className="w-full text-center text-tiny hover:underline pt-2"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Back
        </button>
      </div>
    </GlassCard>
  );
}

/* ==================================================================
   REGISTER — STEP 3: Password
   ================================================================== */
function RegisterPasswordStep() {
  const router = useRouter();
  const { goTo, email, setEmail, displayName, setDisplayName } = useAuthContext();
  const register = useAuthStore((s) => s.register);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = password.length >= 12 ? 1 : password.length >= 8 ? 0.6 : password.length >= 6 ? 0.3 : 0;
  const strengthLabel = password.length === 0 ? '' : password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Okay';

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError('At least 6 characters, please.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(email, password, displayName);
      goTo('verify');
    } catch {
      setError('Something didn\'t work. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password border gradient according to strength
  const borderGradient = strength === 0
    ? 'var(--color-bg-border)'
    : strength <= 0.4
      ? 'rgba(239, 68, 68, 0.4)'
      : strength <= 0.8
        ? 'rgba(245, 158, 11, 0.4)'
        : 'rgba(34, 197, 94, 0.4)';

  return (
    <GlassCard>
      <ProgressOrbs total={3} current={2} />

      <motion.h2
        className="text-title-2 text-center mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        One last thing — choose a key
      </motion.h2>
      <motion.p
        className="text-small text-center mb-8"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Make it yours. At least 6 characters.
      </motion.p>

      <div className="space-y-4">
        <div>
          <label className="block text-tiny font-medium tracking-wide uppercase mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Password
          </label>
          <motion.div
            className="relative rounded-lg"
            animate={{ boxShadow: `0 0 0 1.5px ${borderGradient}` }}
            transition={{ duration: 0.3 }}
            style={{ backgroundColor: 'transparent' }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Create your key"
              autoFocus
              className="relative w-full px-3.5 py-3 rounded-lg text-small outline-none bg-transparent"
              style={{
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-brand-400)',
                boxShadow: `0 0 0 1.5px ${borderGradient}`,
                transition: 'box-shadow 0.3s ease',
              }}
            />
          </motion.div>

          {/* Strength indicator */}
          {password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-2 px-1"
            >
              <div className="flex gap-1 flex-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1 rounded-full flex-1"
                    animate={{
                      backgroundColor: i <= Math.floor(strength * 3)
                        ? strength <= 0.4 ? 'rgba(239, 68, 68, 0.6)'
                          : strength <= 0.8 ? 'rgba(245, 158, 11, 0.6)'
                            : 'rgba(34, 197, 94, 0.6)'
                        : 'var(--color-bg-border)',
                    }}
                    transition={{ duration: 0.2 }}
                  />
                ))}
              </div>
              <span className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>
                {strengthLabel}
              </span>
            </motion.div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-tiny"
            style={{ color: 'var(--color-error)' }}
          >
            {error}
          </motion.p>
        )}

        <PrimaryButton onClick={handleSubmit} loading={loading}>
          Join Wiitoo
        </PrimaryButton>

        <button
          onClick={() => goTo('register-email')}
          className="w-full text-center text-tiny hover:underline pt-2"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Back
        </button>
      </div>
    </GlassCard>
  );
}

/* ==================================================================
   OTP SCREEN — 6 Glowing Cells
   ================================================================== */
function OtpScreen() {
  const router = useRouter();
  const { goTo, email, displayName } = useAuthContext();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
    setCanResend(true);
  }, [cooldown]);

  const maskEmail = (e: string) => {
    if (!e.includes('@')) return e;
    const [name, domain] = e.split('@');
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) newOtp[i] = digits[i] || '';
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((d) => !d);
      if (nextEmpty >= 0) inputRefs.current[nextEmpty]?.focus();
      else inputRefs.current[5]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(code);
      goTo('welcome');
    } catch {
      setShake(true);
      setError('That didn\'t work — try again?');
      setOtp(Array(6).fill(''));
      setTimeout(() => setShake(false), 500);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCooldown(30);
    setCanResend(false);
    setError('');
    setOtp(Array(6).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { opacity: 1, y: 0 }}
      transition={shake ? { duration: 0.4 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard>
        {/* Mail icon */}
        <motion.div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          animate={{ boxShadow: error
            ? '0 0 0 2px rgba(239,68,68,0.2)'
            : '0 0 0 2px rgba(124,58,237,0.15), 0 0 20px -8px rgba(124,58,237,0.15)'
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </motion.div>

        <h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Check your email
        </h1>
        <p className="text-small text-center mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
          We sent a code to
        </p>
        <p className="text-small font-medium text-center mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {email ? maskEmail(email) : 'your email'}
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-3.5 py-2.5 rounded-lg text-tiny text-center"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--color-error)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
          >
            {error}
          </motion.div>
        )}

        {/* ── 6 Glowing Cells ── */}
        <div className="flex justify-center gap-2.5 mb-6">
          {otp.map((digit, i) => {
            const isFocused = i === focusedIndex;
            const isFilled = digit !== '';
            return (
              <motion.div
                key={i}
                className="relative"
                animate={isFilled ? {
                  y: [0, -2, 0],
                } : {}}
                transition={{ duration: 0.2 }}
              >
                <input
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={() => setFocusedIndex(i)}
                  className="w-11 h-13 rounded-xl text-center text-title-3 font-bold outline-none"
                  style={{
                    backgroundColor: isFilled
                      ? 'rgba(124, 58, 237, 0.06)'
                      : 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    border: 'none',
                    boxShadow: isFilled
                      ? '0 0 0 2px rgba(124, 58, 237, 0.3), 0 0 16px -6px rgba(124, 58, 237, 0.2)'
                      : isFocused
                        ? '0 0 0 2px rgba(124, 58, 237, 0.2)'
                        : '0 0 0 1.5px var(--color-bg-border)',
                    caretColor: 'transparent',
                    transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
                  }}
                />
                {/* Placeholder dot for empty cells */}
                {!isFilled && !isFocused && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }} />
                  </div>
                )}
                {/* Amber glow pulse on filled */}
                {isFilled && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                      opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(124,58,237,0.08))',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        <PrimaryButton onClick={handleVerify} loading={loading}>
          Verify
        </PrimaryButton>

        {/* Resend */}
        <div className="text-center mt-4 text-tiny" style={{ color: 'var(--color-text-tertiary)' }}>
          {canResend ? (
            <button onClick={handleResend} className="font-medium hover:underline" style={{ color: 'var(--color-brand-400)' }}>
              Resend code
            </button>
          ) : (
            <span>
              Resend code in <span style={{ color: 'var(--color-text-secondary)' }}>{cooldown}s</span>
            </span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ==================================================================
   WELCOME OVERLAY
   ================================================================== */
function WelcomeOverlay() {
  const router = useRouter();
  const { displayName, email } = useAuthContext();
  const user = useAuthStore((s) => s.user);

  const name = displayName || user?.displayName || 'friend';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 2800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, rgba(0,0,0,0.95) 70%)',
      }}
    >
      {/* Ember particles rise */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 80%, rgba(245,158,11,0.04) 0%, transparent 50%)',
        }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      />

      {/* Wiitoo wordmark */}
      <motion.div
        className="text-3xl font-bold text-gradient-brand mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        wiitoo
      </motion.div>

      {/* Welcome message */}
      <motion.h1
        className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tight text-center leading-tight"
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span className="text-gradient-brand">{name}</span>
        <br />
        <span className="text-2xl md:text-3xl" style={{ color: 'var(--color-text-secondary)' }}>
          Wiitoo is yours.
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-small mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        style={{ color: 'var(--color-text-muted)' }}
      >
        You&apos;re home.
      </motion.p>
    </motion.div>
  );
}

/* ==================================================================
   PASSWORD RESET — STEP 1: Email
   ================================================================== */
function ResetEmailStep() {
  const { goTo, email, setEmail } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    goTo('reset-verify');
  };

  return (
    <GlassCard>
      {/* Lock icon */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Forgot your key?
      </h1>
      <p className="text-small text-center mb-8" style={{ color: 'var(--color-text-tertiary)' }}>
        No worries. Enter your email and we&apos;ll send a code.
      </p>

      <div className="space-y-4">
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
        <PrimaryButton onClick={handleSubmit} loading={loading}>
          Send code
        </PrimaryButton>
        <button onClick={() => goTo('login')} className="w-full text-center text-tiny hover:underline pt-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Remembered? Back to sign in
        </button>
      </div>
    </GlassCard>
  );
}

/* ==================================================================
   PASSWORD RESET — STEP 2: OTP
   ================================================================== */
function ResetOtpStep() {
  const { goTo, email } = useAuthContext();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (cooldown > 0) { const t = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(t); }
    setCanResend(true);
  }, [cooldown]);

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter all 6 digits'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    // For mock, any 6 digits work
    goTo('reset-password');
  };

  const handleResend = () => { setCooldown(30); setCanResend(false); setError(''); setOtp(Array(6).fill('')); inputRefs.current[0]?.focus(); };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) newOtp[i] = digits[i] || '';
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((d) => !d);
      if (nextEmpty >= 0) inputRefs.current[nextEmpty]?.focus();
      else inputRefs.current[5]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const maskEmail = (e: string) => {
    if (!e.includes('@')) return e;
    const [name, domain] = e.split('@');
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
  };

  // Quick inline OTP input (reuse the same visual pattern)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { opacity: 1, y: 0 }}
      transition={shake ? { duration: 0.4 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>Check your email</h1>
        <p className="text-small text-center mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
          We sent a code to <strong style={{ color: 'var(--color-text-secondary)' }}>{email ? maskEmail(email) : 'your email'}</strong>
        </p>

        {error && <div className="mb-4 px-3.5 py-2.5 rounded-lg text-tiny text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>}

        <div className="flex justify-center gap-2.5 mb-6">
          {otp.map((digit, i) => (
            <div key={i} className="relative">
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={6}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-13 rounded-xl text-center text-title-3 font-bold outline-none"
                style={{
                  backgroundColor: digit ? 'rgba(124,58,237,0.06)' : 'var(--color-bg-base)',
                  color: 'var(--color-text-primary)',
                  boxShadow: digit
                    ? '0 0 0 2px rgba(124,58,237,0.3), 0 0 16px -6px rgba(124,58,237,0.2)'
                    : '0 0 0 1.5px var(--color-bg-border)',
                  caretColor: 'transparent',
                  transition: 'box-shadow 0.2s ease',
                }}
              />
              {!digit && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }} /></div>}
            </div>
          ))}
        </div>

        <PrimaryButton onClick={handleVerify} loading={loading}>Verify</PrimaryButton>

        <div className="text-center mt-4 text-tiny" style={{ color: 'var(--color-text-tertiary)' }}>
          {canResend ? (
            <button onClick={handleResend} className="font-medium hover:underline" style={{ color: 'var(--color-brand-400)' }}>Resend code</button>
          ) : (
            <span>Resend code in <span style={{ color: 'var(--color-text-secondary)' }}>{cooldown}s</span></span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ==================================================================
   PASSWORD RESET — STEP 3: New Password
   ================================================================== */
function ResetPasswordStep() {
  const router = useRouter();
  const { goTo } = useAuthContext();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push('/');
  };

  const strength = password.length >= 12 ? 1 : password.length >= 8 ? 0.6 : password.length >= 6 ? 0.3 : 0;
  const strengthLabel = password.length === 0 ? '' : password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Okay';

  return (
    <GlassCard>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>Choose a new key</h1>
      <p className="text-small text-center mb-8" style={{ color: 'var(--color-text-tertiary)' }}>At least 6 characters. Make it yours.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-tiny font-medium tracking-wide uppercase mb-1.5" style={{ color: 'var(--color-text-muted)' }}>New Password</label>
          <input
            type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create your new key" autoFocus
            className="w-full px-3.5 py-3 rounded-lg text-small outline-none"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              color: 'var(--color-text-primary)',
              boxShadow: password
                ? `0 0 0 1.5px ${strength <= 0.4 ? 'rgba(239,68,68,0.4)' : strength <= 0.8 ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.4)'}`
                : '0 0 0 1px var(--color-bg-border)',
              caretColor: 'var(--color-brand-400)',
              transition: 'box-shadow 0.3s ease',
            }}
          />
          {password.length > 0 && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <div className="flex gap-1 flex-1">
                {[0,1,2].map((i) => (
                  <div key={i} className="h-1 rounded-full flex-1"
                    style={{
                      backgroundColor: i <= Math.floor(strength * 3)
                        ? strength <= 0.4 ? 'rgba(239,68,68,0.6)' : strength <= 0.8 ? 'rgba(245,158,11,0.6)' : 'rgba(34,197,94,0.6)'
                        : 'var(--color-bg-border)',
                    }}
                  />
                ))}
              </div>
              <span className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>{strengthLabel}</span>
            </div>
          )}
        </div>

        <PrimaryButton onClick={handleSubmit} loading={loading}>
          Reset password
        </PrimaryButton>

        <button onClick={() => goTo('login')} className="w-full text-center text-tiny hover:underline pt-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Back to sign in
        </button>
      </div>
    </GlassCard>
  );
}