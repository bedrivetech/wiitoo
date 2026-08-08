'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api-client';

type ConvertStep = 'intro' | 'setup' | 'done';

export default function ConvertPage() {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<ConvertStep>('intro');
  const [creatorUsername, setCreatorUsername] = useState(user?.username || '');
  const [category, setCategory] = useState('tech');
  const [bio, setBio] = useState('');
  const [differentName, setDifferentName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ channel: string; status: string } | null>(null);
  const [error, setError] = useState('');

  const categories = [
    { value: 'gaming', label: '🎮 Gaming' },
    { value: 'music', label: '🎵 Music' },
    { value: 'tech', label: '💻 Tech' },
    { value: 'creative', label: '🎨 Creative Arts' },
    { value: 'sports', label: '🏋️ Sports & Fitness' },
    { value: 'talk-shows', label: '🎙️ Talk Shows' },
    { value: 'education', label: '📚 Education' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'irl', label: '🌍 IRL' },
    { value: 'asmr', label: '🌙 ASMR & Chill' },
  ];

  const handleConvert = async () => {
    if (!creatorUsername.trim()) { setError('Choose a creator name'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await api.convertToCreator({
        creator_username: creatorUsername.trim(),
        category,
        bio: bio || undefined,
      });
      setResult({ channel: data.creator_channel, status: data.status });
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
                Become a Creator
              </h1>
              <p className="text-small mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                You&apos;ve been watching. Now it&apos;s time to create.
              </p>
            </div>

            {/* Perks */}
            <div className="grid gap-4">
              {[
                { icon: '📡', title: 'Go Live Instantly', desc: 'Stream from OBS, Streamlabs, or any RTMP client. Your audience is waiting.' },
                { icon: '💰', title: 'Monetize Your Content', desc: 'Subscriptions, tips (PayPal, USDC), superchat, and 90% revenue share.' },
                { icon: '🔄', title: 'Simulcast Everywhere', desc: 'Restream to YouTube, Twitch, and Kick — all from one dashboard.' },
                { icon: '📊', title: 'Deep Analytics', desc: 'Know your audience. Viewership trends, peak moments, revenue breakdowns.' },
                { icon: '🎬', title: 'VOD Library', desc: 'Every stream saves automatically. Build your content library over time.' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-4 p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}
                >
                  <span className="text-title-3 flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-small font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
                    <p className="text-tiny mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => setStep('setup')}
              className="w-full py-3 rounded-xl text-small font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
            >
              Start Creating →
            </button>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
                Set Up Your Creator Profile
              </h1>
              <p className="text-small mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Your viewer account stays the same — this sets up your creator side.
              </p>
            </div>

            <div className="rounded-xl p-6 border space-y-5"
              style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}
            >
              {/* Creator name */}
              <div>
                <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Creator Username
                </label>
                <input
                  type="text"
                  value={creatorUsername}
                  onChange={(e) => setCreatorUsername(e.target.value)}
                  placeholder="Your creator handle"
                  className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none"
                  style={{ backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}
                />
                <p className="text-tiny mt-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
                  This can be the same as your viewer name, or something new.
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Primary Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none"
                  style={{ backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell future viewers about yourself..."
                  className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none resize-none"
                  style={{ backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-tiny"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('intro')}
                className="px-5 py-2.5 rounded-lg text-small font-medium"
                style={{ border: '1px solid var(--color-bg-border)', color: 'var(--color-text-secondary)' }}
              >
                Back
              </button>
              <button
                onClick={handleConvert}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-small font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
              >
                {loading ? 'Setting up...' : 'Go Live Setup →'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))' }}
            >
              <span className="text-4xl">🎉</span>
            </motion.div>

            <h1 className="text-title-1 font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              You&apos;re a creator!
            </h1>
            <p className="text-small mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Welcome to the creator community. Your channel is live.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mt-2 mb-8"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
              <span className="text-tiny font-medium" style={{ color: 'var(--color-success)' }}>
                /{result?.channel} — {result?.status}
              </span>
            </div>

            <div className="flex justify-center gap-3">
              <a
                href="/studio/stream"
                className="px-6 py-2.5 rounded-xl text-small font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                Go Live Now
              </a>
              <a
                href="/studio"
                className="px-6 py-2.5 rounded-xl text-small font-medium"
                style={{ border: '1px solid var(--color-bg-border)', color: 'var(--color-text-secondary)' }}
              >
                Open Dashboard
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}