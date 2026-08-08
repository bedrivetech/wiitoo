'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

// ── Safe motion stubs ── Wrap native elements in components that discard
// framer-motion props (initial, animate, exit, transition, whileHover, etc.)
// to prevent React 19 from crashing on unknown DOM attributes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripM = (p: Record<string, any>) => {
  const { initial, animate, exit, transition, whileHover, whileTap, whileFocus, whileDrag, whileInView, layout, layoutId, variants, onAnimationStart, onAnimationComplete, ...rest } = p;
  return rest;
};
const mkM = (tag: string) => React.forwardRef((props: any, ref: any) => React.createElement(tag, { ...stripM(props), ref }));
const motion = {
  div: mkM('div'), h1: mkM('h1'), h2: mkM('h2'), p: mkM('p'),
  button: mkM('button'), span: mkM('span'), label: mkM('label'),
  section: mkM('section'), img: mkM('img'),
};
// AnimatePresence replacement — renders children directly
const AnimatePresence = (props: Record<string, any> & { children?: React.ReactNode }) => <>{props.children}</>;
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api-client';
import { EmberParticles } from '@/components/auth/ember-particles';
import { VideoBackground } from '@/components/auth/video-background';

/* ─── Types ─── */
type AuthStep = 'vibe' | 'name' | 'key' | 'otp' | 'welcome' | 'login' | 'reset' | 'reset-otp' | 'reset-key';

interface AuthContextType {
  step: AuthStep;
  goTo: (step: AuthStep) => void;
  email: string;
  setEmail: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  selectedVibes: string[];
  setSelectedVibes: React.Dispatch<React.SetStateAction<string[]>>;
  redirectTo: string | null;
}

const AuthContext = createContext<AuthContextType>(null!);
const useAuthCtx = () => useContext(AuthContext);

/* ─── VIBE DATA ─── */
const VIBES = [
  { id: 'gaming', label: 'Gaming', desc: 'Live plays, esports, walkthroughs', emoji: '🎮', color: '#7c3aed' },
  { id: 'music', label: 'Music', desc: 'Live sets, production, instrumentals', emoji: '🎵', color: '#ec4899' },
  { id: 'tech', label: 'Tech', desc: 'Coding, reviews, hardware', emoji: '💻', color: '#06b6d4' },
  { id: 'creative', label: 'Creative Arts', desc: 'Drawing, design, 3D, crafts', emoji: '🎨', color: '#f59e0b' },
  { id: 'sports', label: 'Sports & Fitness', desc: 'Workouts, analysis, outdoor', emoji: '🏋️', color: '#22c55e' },
  { id: 'talk-shows', label: 'Talk Shows', desc: 'Interviews, discussions, podcasts', emoji: '🎙️', color: '#a855f7' },
  { id: 'education', label: 'Education', desc: 'Tutorials, lectures, science', emoji: '📚', color: '#3b82f6' },
  { id: 'entertainment', label: 'Entertainment', desc: 'Reaction, comedy, variety', emoji: '🎬', color: '#ef4444' },
  { id: 'irl', label: 'IRL', desc: 'Real life, vlogs, travel, food', emoji: '🌍', color: '#14b8a6' },
  { id: 'asmr', label: 'ASMR & Chill', desc: 'Relaxation, ambient, lo-fi', emoji: '🌙', color: '#6366f1' },
];

/* ─── ENTRY ─── */
export default function AuthPage() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>('vibe');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Read ?redirect= query param client-side (avoids Suspense boundary)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirect');
    if (r) setRedirectTo(r);
  }, []);

  // If already authenticated, go home or to redirect
  useEffect(() => {
    if (isAuth) {
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        router.push('/');
      }
    }
  }, [isAuth, router, redirectTo]);

  const goTo = useCallback((s: AuthStep) => setStep(s), []);

  return (
    <AuthContext.Provider value={{ step, goTo, email, setEmail, username, setUsername, displayName, setDisplayName, selectedVibes, setSelectedVibes, redirectTo }}>
      {/* ─── Cinematic Background ─── */}
      <VideoBackground
        selectedVibes={step === 'welcome' ? selectedVibes : step === 'vibe' ? [] : selectedVibes}
        mood={step === 'welcome' ? 'welcome' : step === 'login' ? 'login' : 'default'}
      />

      {/* Ember particles overlay */}
      <EmberParticles focusIntensity={step === 'welcome' ? 0.9 : step === 'vibe' ? 0.2 : 0.4} />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-[440px]">
            <AnimatePresence mode="wait">
              {step === 'vibe' && <VibePicker key="vibe" />}
              {step === 'name' && <NameStep key="name" />}
              {step === 'key' && <KeyStep key="key" />}
              {step === 'otp' && <OtpScreen key="otp" />}
              {step === 'welcome' && <WelcomeOverlay key="welcome" />}
              {step === 'login' && <LoginScreen key="login" />}
              {step === 'reset' && <ResetEmailStep key="reset" />}
              {step === 'reset-otp' && <ResetOtpStep key="reset-otp" />}
              {step === 'reset-key' && <ResetKeyStep key="reset-key" />}
            </AnimatePresence>
          </div>
        </div>

        {/* Brand watermark */}
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10"
          animate={{ opacity: step === 'welcome' ? 0 : 1 }}
        >
          <span className="text-tiny tracking-[0.2em] uppercase text-text-muted/30 select-none">
            wiitoo
          </span>
        </motion.div>
    </AuthContext.Provider>
  );
}

/* ─── Shared Components ─── */

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl p-8 border/50 backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: 'rgba(13, 13, 13, 0.75)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </motion.div>
  );
}

function WiitooLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-body', md: 'text-title-1', lg: 'text-hero' };
  return (
    <div className="text-center mb-5">
      <span className={`${sizes[size]} font-bold tracking-tight text-gradient-brand`}>wiitoo</span>
    </div>
  );
}

function AuthInput({
  label, type = 'text', value, onChange, placeholder, hint, error, autoFocus = false, suffix, onKeyDown,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; error?: string; autoFocus?: boolean;
  suffix?: React.ReactNode; onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  return (
    <div className="space-y-1.5">
      <motion.label
        className="block text-tiny font-medium tracking-wide uppercase"
        animate={{ color: focused ? 'var(--color-brand-400)' : 'var(--color-text-muted)' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{ boxShadow: focused ? '0 0 0 1.5px rgba(124,58,237,0.3), 0 0 20px -8px rgba(124,58,237,0.15)' : '0 0 0 1px var(--color-bg-border)' }}
          transition={{ duration: 0.3 }}
        />
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          className="relative w-full px-3.5 py-3 rounded-lg text-small outline-none bg-transparent"
          style={{ color: 'var(--color-text-primary)', caretColor: 'var(--color-brand-400)' }}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {hint && !error && <p className="text-tiny px-1 pt-0.5" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-tiny px-1 pt-0.5" style={{ color: 'var(--color-error)' }}>
          {error}
        </motion.p>
      )}
    </div>
  );
}

function PrimaryButton({ children, onClick, loading = false, disabled = false, className = '' }: {
  children: React.ReactNode; onClick: () => void; loading?: boolean; disabled?: boolean; className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.01 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`w-full py-2.5 rounded-xl text-small font-semibold text-white relative overflow-hidden transition-opacity ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          {children}
        </span>
      ) : children}
    </motion.button>
  );
}

function SocialButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-tiny font-medium transition-colors"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--color-text-primary)', border: '1px solid var(--color-bg-border)' }}
    >
      {children}
    </motion.button>
  );
}

function StepIndicator({ total, current, labels }: { total: number; current: number; labels?: string[] }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i} className="flex items-center gap-3">
          <motion.div
            className="w-2 h-2 rounded-full"
            animate={{
              scale: i === current ? 1.4 : 1,
              backgroundColor: i <= current ? 'var(--color-brand-500)' : 'var(--color-bg-border)',
              boxShadow: i <= current ? '0 0 6px rgba(124,58,237,0.4)' : 'none',
            }}
            transition={{ duration: 0.3 }}
          />
          {labels?.[i] && i <= current && (
            <motion.span
              initial={false}
              className="text-tiny hidden sm:inline"
              style={{ color: i === current ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}
            >
              {labels[i]}
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   STEP 1: VIBE PICKER — "What brings you here?"
   ──────────────────────────────────────────────────────────── */
function VibePicker() {
  const { goTo, selectedVibes, setSelectedVibes } = useAuthCtx();

  // Explicit toggle — reads current state directly for reliability
  const toggle = (id: string) => {
    const isSelected = selectedVibes.includes(id);
    if (isSelected) {
      setSelectedVibes(selectedVibes.filter((c: string) => c !== id));
    } else {
      setSelectedVibes([...selectedVibes, id]);
    }
  };

  // Grid layout: 2 columns, taller cells with illustration feel
  return (
    <GlassCard className="!p-5 sm:!p-6">
      <WiitooLogo size="sm" />

      <motion.h1
        className="text-title-2 text-center mb-1"
        style={{ color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        What brings you here?
      </motion.h1>
      <motion.p
        className="text-small text-center mb-5"
        style={{ color: 'var(--color-text-tertiary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        Pick a few you love. We&apos;ll make Wiitoo feel like yours.
      </motion.p>

      <div className="grid grid-cols-2 gap-2.5 mb-5 max-h-[380px] 2xl:max-h-[420px] overflow-y-auto pr-1 overflow-x-hidden scrollbar-thin scrollbar-thumb-brand-500/20"
        style={{ scrollbarGutter: 'stable' }}>
        {VIBES.map((vibe, i) => {
          const isSelected = selectedVibes.includes(vibe.id);
          return (
            <motion.button
              key={vibe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04, duration: 0.3 }}
              onClick={() => toggle(vibe.id)}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="relative rounded-xl p-3.5 text-left transition-all overflow-hidden group"
              style={{
                backgroundColor: isSelected ? `${vibe.color}14` : 'var(--color-bg-raised)',
                border: isSelected ? `1.5px solid ${vibe.color}40` : '1px solid var(--color-bg-border)',
              }}
            >
              {/* Glow dot */}
              <div
                className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-20 transition-all duration-300"
                style={{
                  background: `radial-gradient(circle, ${vibe.color}, transparent)`,
                  transform: isSelected ? 'scale(2)' : 'scale(0.5)',
                }}
              />
              <span className="text-title-3 block mb-1 relative">{vibe.emoji}</span>
              <p className="text-small font-medium relative" style={{ color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                {vibe.label}
              </p>
              <p className="text-tiny mt-0.5 line-clamp-1 relative" style={{ color: 'var(--color-text-muted)' }}>
                {vibe.desc}
              </p>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: vibe.color }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <PrimaryButton
        onClick={() => goTo('name')}
        disabled={selectedVibes.length < 1}
        className={selectedVibes.length < 1 ? 'opacity-40' : ''}
      >
        {selectedVibes.length === 0
          ? 'Pick at least one'
          : `Continue with ${selectedVibes.length} vibe${selectedVibes.length > 1 ? 's' : ''} →`}
      </PrimaryButton>

      {/* Quick reachability note */}
      {selectedVibes.length === 0 && (
        <motion.p
          className="text-center mt-2 text-tiny"
          style={{ color: 'var(--color-text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Tap any card above to select your vibes
        </motion.p>
      )}

      <motion.p
        className="text-center mt-3 text-tiny"
        style={{ color: 'var(--color-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        You can watch without signing up.{' '}
        <button onClick={() => goTo('login')} className="hover:underline font-medium" style={{ color: 'var(--color-brand-400)' }}>
          I have an account
        </button>
      </motion.p>
    </GlassCard>
  );
}

/* ────────────────────────────────────────────────────────────
   STEP 2: NAME — "What do we call you?"
   ──────────────────────────────────────────────────────────── */
function NameStep() {
  const { goTo, displayName, setDisplayName, username, setUsername } = useAuthCtx();
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = useCallback(async (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) {
      setAvailability('idle');
      setSuggestions([]);
      return;
    }
    setAvailability('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await api.checkUsername(q.trim().toLowerCase());
        setAvailability(result.available ? 'available' : 'taken');
        setSuggestions(result.suggestions || []);
      } catch {
        setAvailability('idle');
      }
    }, 500);
  }, []);

  const handleUsernameChange = (v: string) => {
    const clean = v.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
    setUsername(clean);
    setError('');
    checkUsername(clean);
  };

  const handleDisplayNameChange = (v: string) => {
    setDisplayName(v);
    setError('');
  };

  const handleNext = () => {
    if (!displayName.trim()) {
      setError('Every great story needs a name.');
      return;
    }
    if (!username.trim()) {
      setError('Choose a unique handle.');
      return;
    }
    if (username.length < 2) {
      setError('Username needs at least 2 characters.');
      return;
    }
    if (availability === 'taken') {
      setError('Taken. Try one of the suggestions below.');
      return;
    }
    if (availability === 'idle' || availability === 'checking') {
      setError('Wait for the availability check.');
      return;
    }
    goTo('key');
  };

  return (
    <GlassCard>
      <StepIndicator total={3} current={0} labels={['Name', 'Key', 'Code']} />

      <motion.h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
        What do we call you?
      </motion.h1>
      <motion.p className="text-small text-center mb-7" style={{ color: 'var(--color-text-tertiary)' }}>
        Your vibe is picked. Now, your identity.
      </motion.p>

      <div className="space-y-4">
        {/* Display Name */}
        <AuthInput
          label="Display Name"
          value={displayName}
          onChange={handleDisplayNameChange}
          placeholder="e.g. PixelRunner, LunaBeats..."
          hint="This is your identity here — choose something you love."
          autoFocus
        />

        {/* Username */}
        <div>
          <AuthInput
            label="Username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="pixelrunner"
            hint="Lowercase letters, numbers, dots and underscores."
            error={error}
            suffix={
              username.length >= 2 ? (
                availability === 'checking' ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 rounded-full"
                    style={{ borderColor: 'var(--color-bg-border)', borderTopColor: 'var(--color-brand-400)' }}
                  />
                ) : availability === 'available' ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
                    style={{ color: 'var(--color-success)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.span>
                ) : (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ color: 'var(--color-warning)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </motion.span>
                )
              ) : null
            }
          />

          {/* Suggestions when taken */}
          {availability === 'taken' && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-lg p-3 border"
              style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }}
            >
              <p className="text-tiny mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{username}</span> is taken. Try:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setUsername(s);
                      setAvailability('available');
                      setSuggestions([]);
                    }}
                    className="px-2.5 py-1 rounded-md text-tiny font-medium transition-all hover:translate-x-0.5"
                    style={{ color: 'var(--color-brand-400)', backgroundColor: 'rgba(124,58,237,0.06)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Available indicator */}
          {availability === 'available' && (
            <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
              className="text-tiny mt-1 px-1" style={{ color: 'var(--color-success)' }}>
              {username} is yours
            </motion.p>
          )}
        </div>

        <PrimaryButton onClick={handleNext}>
          Set your Key →
        </PrimaryButton>

        <button onClick={() => goTo('vibe')} className="w-full text-center text-tiny hover:underline pt-1"
          style={{ color: 'var(--color-text-tertiary)' }}>
          ← Change my vibes
        </button>
      </div>
    </GlassCard>
  );
}

/* ────────────────────────────────────────────────────────────
   STEP 3: KEY — "Your Key & Email" (password renamed to Key)
   ──────────────────────────────────────────────────────────── */
function KeyStep() {
  const { goTo, email, setEmail, username, displayName, selectedVibes } = useAuthCtx();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const strength = key.length >= 12 ? 1 : key.length >= 8 ? 0.6 : key.length >= 6 ? 0.3 : 0;
  const strengthLabel = key.length === 0 ? '' : key.length >= 12 ? 'Strong' : key.length >= 8 ? 'Good' : 'Okay';
  const strengthColor = strength === 0 ? 'var(--color-bg-border)' : strength <= 0.4 ? 'var(--color-error)' : strength <= 0.8 ? 'var(--color-warning)' : 'var(--color-success)';

  // Vibe-based key hints
  const keyHint = useMemo(() => {
    if (key.length >= 8) return '';
    const hints: Record<string, string> = {
      gaming: '"Your Key to the arena — make it count."',
      music: '"The right Key sets the tone."',
      tech: '"Build your Key like you\'d build a password manager."',
      creative: '"Your Key is the signature on your masterpiece."',
      sports: '"Train your Key — 8 reps minimum."',
      'talk-shows': '"A strong Key keeps the conversation yours."',
      education: '"Learn this one thing: 8+ characters."',
      entertainment: '"Your Key is the backstage pass."',
      irl: '"Your Key, your world. Protect it."',
      asmr: '"Keep it chill. And secure."',
    };
    const userVibes = selectedVibes.length > 0 ? selectedVibes : ['tech'];
    return hints[userVibes[0]] || hints.tech;
  }, [key.length, selectedVibes]);

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email.');
      return;
    }
    if (key.length < 6) {
      setError('Your Key needs at least 6 characters.');
      return;
    }

    setError('');
    clearError();
    try {
      await register(email, key, username, selectedVibes);
      goTo('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setError(msg);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <GlassCard>
      <StepIndicator total={3} current={1} labels={['Name', 'Key', 'Code']} />

      {/* Key icon */}
      <motion.div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        animate={{
          boxShadow: key.length >= 8
            ? '0 0 0 2px rgba(34,197,94,0.15), 0 0 20px -6px rgba(34,197,94,0.1)'
            : '0 0 0 2px rgba(124,58,237,0.12), 0 0 20px -8px rgba(124,58,237,0.08)',
        }}
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      </motion.div>

      <motion.h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Your Key & Email
      </motion.h1>
      <motion.p className="text-small text-center mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
        Hold your Key close — it unlocks your Wiitoo.
      </motion.p>

      <div className="space-y-4" onKeyDown={handleEnter}>
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); setError(''); clearError(); }}
          placeholder="you@example.com"
          autoFocus
        />

        {/* Key (password) field */}
        <div>
          <label className="block text-tiny font-medium tracking-wide uppercase mb-1.5"
            style={{ color: key.length >= 8 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            Your Key
          </label>
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              animate={{ boxShadow: `0 0 0 1.5px ${strengthColor}40` }}
              transition={{ duration: 0.3 }}
            />
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); clearError(); }}
              placeholder="Create your Key"
              className="relative w-full px-3.5 py-3 rounded-lg text-small outline-none bg-transparent pr-20"
              style={{ color: 'var(--color-text-primary)', caretColor: 'var(--color-brand-400)' }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-tiny px-1.5 py-0.5 rounded transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Strength + Hint row */}
          <div className="flex items-start gap-3 mt-2 px-1">
            <div className="flex-1">
              {key.length > 0 && (
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1 rounded-full flex-1"
                      animate={{
                        backgroundColor: i <= Math.floor(strength * 3)
                          ? strength <= 0.4 ? 'rgba(239,68,68,0.6)' : strength <= 0.8 ? 'rgba(245,158,11,0.6)' : 'rgba(34,197,94,0.6)'
                          : 'var(--color-bg-border)',
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </div>
              )}
              {key.length > 0 && (
                <span className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>
                  {strengthLabel}
                  {key.length < 6 && ` · ${6 - key.length} more chars`}
                </span>
              )}
            </div>
            <motion.p
              className="text-tiny italic max-w-[200px] text-right leading-tight"
              style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}
              key={keyHint}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.3 }}
            >
              {keyHint}
            </motion.p>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="px-3.5 py-2.5 rounded-lg text-tiny"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </motion.div>
        )}

        <PrimaryButton onClick={handleSubmit} loading={loading}>
          {key.length >= 8 ? 'Lock it in →' : 'Continue →'}
        </PrimaryButton>

        <button onClick={() => goTo('name')} className="w-full text-center text-tiny hover:underline pt-1"
          style={{ color: 'var(--color-text-tertiary)' }}>
          ← Back to name
        </button>
      </div>
    </GlassCard>
  );
}

/* ────────────────────────────────────────────────────────────
   STEP 4: OTP — "Check your email"
   ──────────────────────────────────────────────────────────── */
function OtpScreen() {
  const { goTo, email } = useAuthCtx();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const resendOtp = useAuthStore((s) => s.resendOtp);
  const loading = useAuthStore((s) => s.loading);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (cooldown > 0) { const t = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(t); }
    setCanResend(true);
  }, [cooldown]);

  const maskEmail = (e: string) => {
    if (!e.includes('@')) return e;
    const [name, domain] = e.split('@');
    return `${name[0]}${'*'.repeat(Math.max(name.length - 2, 1))}${name[name.length - 1]}@${domain}`;
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
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    try {
      await verifyOtp(email, code);
      goTo('welcome');
    } catch (err: unknown) {
      setShake(true);
      setError(err instanceof Error ? err.message : 'That code didn\'t work');
      setOtp(Array(6).fill(''));
      setTimeout(() => setShake(false), 500);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setCooldown(30);
    setCanResend(false);
    try {
      await resendOtp(email);
    } catch { /* ignore */ }
    setOtp(Array(6).fill(''));
    setError('');
    inputRefs.current[0]?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { opacity: 1, y: 0 }}
      transition={shake ? { duration: 0.4 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard>
        <StepIndicator total={3} current={2} labels={['Name', 'Key', 'Code']} />

        {/* Mail icon */}
        <motion.div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          animate={{
            boxShadow: error
              ? '0 0 0 2px rgba(239,68,68,0.2)'
              : '0 0 0 2px rgba(124,58,237,0.15), 0 0 20px -8px rgba(124,58,237,0.15)',
          }}
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </motion.div>

        <h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
          ✨ Magic code sent
        </h1>
        <p className="text-small text-center mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
          We sent it to
        </p>
        <p className="text-small font-medium text-center mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {email ? maskEmail(email) : 'your email'}
        </p>

        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-3.5 py-2.5 rounded-lg text-tiny text-center"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </motion.div>
        )}

        {/* 6 glowing cells */}
        <div className="flex justify-center gap-2.5 mb-6">
          {otp.map((digit, i) => {
            const isFilled = digit !== '';
            return (
              <motion.div key={i} className="relative"
                animate={isFilled ? { y: [0, -2, 0] } : {}}
                transition={{ duration: 0.2 }}
              >
                <input
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={() => setFocusedIndex(i)}
                  className="w-11 h-13 rounded-xl text-center text-title-3 font-bold outline-none"
                  style={{
                    backgroundColor: isFilled ? 'rgba(124,58,237,0.06)' : 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    border: 'none',
                    boxShadow: isFilled
                      ? '0 0 0 2px rgba(124,58,237,0.3), 0 0 16px -6px rgba(124,58,237,0.2)'
                      : i === focusedIndex
                        ? '0 0 0 2px rgba(124,58,237,0.2)'
                        : '0 0 0 1.5px var(--color-bg-border)',
                    caretColor: 'transparent',
                    transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
                  }}
                />
                {!isFilled && i !== focusedIndex && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }} />
                  </div>
                )}
                {isFilled && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(124,58,237,0.08))' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        <PrimaryButton onClick={handleVerify} loading={loading}>
          Unlock →
        </PrimaryButton>

        <div className="text-center mt-4 text-tiny" style={{ color: 'var(--color-text-tertiary)' }}>
          {canResend ? (
            <button onClick={handleResend} className="font-medium hover:underline" style={{ color: 'var(--color-brand-400)' }}>
              Send new code
            </button>
          ) : (
            <span>New code in <span style={{ color: 'var(--color-text-secondary)' }}>{cooldown}s</span></span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   STEP 5: WELCOME — "Wiitoo is yours."
   ──────────────────────────────────────────────────────────── */
function WelcomeOverlay() {
  const { goTo, displayName, username, selectedVibes, redirectTo } = useAuthCtx();
  const user = useAuthStore((s) => s.user);
  const name = displayName || user?.display_name || username || 'friend';

  const vibeLabels = selectedVibes
    .map((id) => VIBES.find((v) => v.id === id)?.emoji)
    .filter(Boolean)
    .slice(0, 3);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirectTo || '/';
    }, 3000);
    return () => clearTimeout(timer);
  }, [redirectTo]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, rgba(0,0,0,0.95) 70%)' }}
    >
      {/* Ember glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 80%, rgba(245,158,11,0.04) 0%, transparent 50%)' }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      />

      {/* Vibe emojis */}
      {vibeLabels.length > 0 && (
        <motion.div
          className="flex gap-3 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {vibeLabels.map((emoji, i) => (
            <motion.span
              key={i}
              className="text-3xl"
              animate={{ y: [0, -6, 0] }}
              transition={{ delay: i * 0.15, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* Wiitoo wordmark */}
      <motion.div
        className="text-title-1 font-bold text-gradient-brand mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        wiitoo
      </motion.div>

      {/* Main welcome */}
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

      {/* Loading bar */}
      <motion.div
        className="h-0.5 rounded-full mt-10 w-32 overflow-hidden"
        style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-ember-500))' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.8, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   LOGIN SCREEN
   ──────────────────────────────────────────────────────────── */
function LoginScreen() {
  const router = useRouter();
  const { goTo, email, setEmail, redirectTo } = useAuthCtx();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !key.trim()) { setError('Both fields are waiting for you.'); return; }
    clearError();
    setError('');
    try {
      await login(email, key);
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'That didn\'t match. Try again?');
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <GlassCard>
      <WiitooLogo size="md" />

      <motion.h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Welcome back
      </motion.h1>
      <motion.p className="text-small text-center mb-7" style={{ color: 'var(--color-text-tertiary)' }}>
        Sign in to pick up where you left off
      </motion.p>

      {(error || storeError) && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3.5 py-2.5 rounded-lg text-tiny"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.15)' }}>
          {error || storeError}
        </motion.div>
      )}

      <div className="space-y-4" onKeyDown={handleEnter}>
        <AuthInput label="Email" type="email" value={email} onChange={(v) => { setEmail(v); setError(''); clearError(); }} placeholder="you@example.com" autoFocus />
        <div>
          <AuthInput label="Your Key" type={showKey ? 'text' : 'password'} value={key} onChange={(v) => { setKey(v); setError(''); clearError(); }} placeholder="Your Key" />
          <div className="flex items-center justify-between mt-1.5 px-1">
            <button onClick={() => setShowKey(!showKey)} className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button onClick={() => goTo('reset')} className="text-tiny hover:underline" style={{ color: 'var(--color-brand-400)' }}>
              Forgot your Key?
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

      <motion.p className="text-center text-small" style={{ color: 'var(--color-text-tertiary)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        New here?{' '}
        <button onClick={() => { setEmail(''); goTo('vibe'); }}
          className="font-semibold hover:underline" style={{ color: 'var(--color-brand-400)' }}>
          Find your vibe
        </button>
      </motion.p>
    </GlassCard>
  );
}

/* ────────────────────────────────────────────────────────────
   PASSWORD RESET FLOW (adjusted for "Key" terminology)
   ──────────────────────────────────────────────────────────── */

function ResetEmailStep() {
  const { goTo, email, setEmail } = useAuthCtx();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    goTo('reset-otp');
  };
  return (
    <GlassCard>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>Forgot your Key?</h1>
      <p className="text-small text-center mb-8" style={{ color: 'var(--color-text-tertiary)' }}>No worries. Enter your email and we&apos;ll send a code to reset it.</p>
      <div className="space-y-4">
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
        <PrimaryButton onClick={handleSubmit} loading={loading}>Send code</PrimaryButton>
        <button onClick={() => goTo('login')} className="w-full text-center text-tiny hover:underline pt-2" style={{ color: 'var(--color-text-tertiary)' }}>Remembered? Back to sign in</button>
      </div>
    </GlassCard>
  );
}

function ResetOtpStep() {
  const { goTo, email } = useAuthCtx();
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
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    goTo('reset-key');
  };

  const handleResend = () => { setCooldown(30); setCanResend(false); setOtp(Array(6).fill('')); setError(''); inputRefs.current[0]?.focus(); };
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) { const digits = value.replace(/\D/g, '').slice(0, 6); const n = [...otp]; for (let i = 0; i < 6; i++) n[i] = digits[i] || ''; setOtp(n); const next = n.findIndex((d) => !d); if (next >= 0) inputRefs.current[next]?.focus(); else inputRefs.current[5]?.focus(); return; }
    if (!/^\d?$/.test(value)) return;
    const n = [...otp]; n[index] = value; setOtp(n);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => { if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus(); };

  const maskEmail = (e: string) => {
    if (!e.includes('@')) return e;
    const [name, domain] = e.split('@');
    return `${name[0]}${'*'.repeat(Math.max(name.length - 2, 1))}${name[name.length - 1]}@${domain}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { opacity: 1, y: 0 }} transition={shake ? { duration: 0.4 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
      <GlassCard>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
        </div>
        <h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>Check your email</h1>
        <p className="text-small text-center mb-6" style={{ color: 'var(--color-text-tertiary)' }}>We sent a code to <strong style={{ color: 'var(--color-text-secondary)' }}>{email ? maskEmail(email) : 'your email'}</strong></p>
        {error && <div className="mb-4 px-3.5 py-2.5 rounded-lg text-tiny text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>}
        <div className="flex justify-center gap-2.5 mb-6">{otp.map((digit, i) => (<div key={i} className="relative"><input ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={6} value={digit} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} className="w-11 h-13 rounded-xl text-center text-title-3 font-bold outline-none" style={{ backgroundColor: digit ? 'rgba(124,58,237,0.06)' : 'var(--color-bg-base)', color: 'var(--color-text-primary)', boxShadow: digit ? '0 0 0 2px rgba(124,58,237,0.3), 0 0 16px -6px rgba(124,58,237,0.2)' : '0 0 0 1.5px var(--color-bg-border)', caretColor: 'transparent', transition: 'box-shadow 0.2s ease' }} />{!digit && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }} /></div>}</div>))}</div>
        <PrimaryButton onClick={handleVerify} loading={loading}>Verify</PrimaryButton>
        <div className="text-center mt-4 text-tiny" style={{ color: 'var(--color-text-tertiary)' }}>
          {canResend ? <button onClick={handleResend} className="font-medium hover:underline" style={{ color: 'var(--color-brand-400)' }}>Resend code</button> : <span>Resend code in <span style={{ color: 'var(--color-text-secondary)' }}>{cooldown}s</span></span>}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ResetKeyStep() {
  const router = useRouter();
  const { goTo, redirectTo } = useAuthCtx();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (key.length < 6) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      router.push('/');
    }
  };
  const strength = key.length >= 12 ? 1 : key.length >= 8 ? 0.6 : key.length >= 6 ? 0.3 : 0;
  return (
    <GlassCard>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1 className="text-title-2 text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>Choose a new Key</h1>
      <p className="text-small text-center mb-8" style={{ color: 'var(--color-text-tertiary)' }}>At least 6 characters. Make it yours.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-tiny font-medium tracking-wide uppercase mb-1.5" style={{ color: 'var(--color-text-muted)' }}>New Key</label>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Create your new Key" autoFocus
            className="w-full px-3.5 py-3 rounded-lg text-small outline-none"
            style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)',
              boxShadow: key ? `0 0 0 1.5px ${strength <= 0.4 ? 'rgba(239,68,68,0.4)' : strength <= 0.8 ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.4)'}` : '0 0 0 1px var(--color-bg-border)',
              caretColor: 'var(--color-brand-400)', transition: 'box-shadow 0.3s ease' }} />
          {key.length > 0 && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <div className="flex gap-1 flex-1">{[0,1,2].map((i) => (<div key={i} className="h-1 rounded-full flex-1" style={{ backgroundColor: i <= Math.floor(strength * 3) ? strength <= 0.4 ? 'rgba(239,68,68,0.6)' : strength <= 0.8 ? 'rgba(245,158,11,0.6)' : 'rgba(34,197,94,0.6)' : 'var(--color-bg-border)' }} />))}</div>
              <span className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>{key.length >= 12 ? 'Strong' : key.length >= 8 ? 'Good' : 'Okay'}</span>
            </div>
          )}
        </div>
        <PrimaryButton onClick={handleSubmit} loading={loading}>Reset My Key</PrimaryButton>
        <button onClick={() => goTo('login')} className="w-full text-center text-tiny hover:underline pt-2" style={{ color: 'var(--color-text-tertiary)' }}>Back to sign in</button>
      </div>
    </GlassCard>
  );
}