'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ModerationPage() {
  const [banWords, setBanWords] = useState('spam, scam, discord.gg/');
  const [emoteOnly, setEmoteOnly] = useState(false);
  const [followerOnly, setFollowerOnly] = useState(false);
  const [followerMinutes, setFollowerMinutes] = useState(10);
  const [slowMode, setSlowMode] = useState(false);
  const [slowSeconds, setSlowSeconds] = useState(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
          Moderation
        </h1>
        <p className="text-small mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Keep your chat safe and on-brand
        </p>
      </div>

      {/* Chat Filters */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-6 border space-y-5"
        style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}
      >
        <h2 className="text-subtitle" style={{ color: 'var(--color-text-primary)' }}>
          Chat Filters
        </h2>

        {/* Ban Words */}
        <div>
          <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Banned Words & Phrases
          </label>
          <textarea
            value={banWords}
            onChange={(e) => setBanWords(e.target.value)}
            rows={3}
            placeholder="Comma-separated words to auto-block"
            className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none resize-none"
            style={{ backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}
          />
          <p className="text-tiny mt-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
            Messages containing these words will be hidden automatically.
          </p>
        </div>

        {/* Toggles */}
        <div className="space-y-4">
          <ToggleItem label="Emote-only Mode" desc="Only emotes and long-time users can chat" enabled={emoteOnly} onChange={setEmoteOnly} />
          <ToggleItem label="Follower-only Mode" desc="Only followers can chat" enabled={followerOnly} onChange={setFollowerOnly} />
          <ToggleItem label="Slow Mode" desc="Limit how often users can send messages" enabled={slowMode} onChange={setSlowMode} />
        </div>

        {/* Slow mode seconds */}
        {slowMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Slow Mode Interval
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={60}
                value={slowSeconds}
                onChange={(e) => setSlowSeconds(parseInt(e.target.value))}
                className="flex-1"
                style={{ accentColor: 'var(--color-brand-500)' }}
              />
              <span className="text-small font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                {slowSeconds}s
              </span>
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* Moderators */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-6 border"
        style={{ backgroundColor: 'var(--color-bg-raised)', borderColor: 'var(--color-bg-border)' }}
      >
        <h2 className="text-subtitle mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Moderators
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Add a moderator by username..."
            className="flex-1 px-3.5 py-2.5 rounded-lg text-small outline-none"
            style={{ backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}
          />
          <button
            className="px-4 py-2.5 rounded-lg text-small font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))' }}
          >
            Add
          </button>
        </div>
        <p className="text-tiny mt-3 px-1" style={{ color: 'var(--color-text-muted)' }}>
          Moderators can delete messages, timeout users, and manage bans during your streams.
        </p>
      </motion.section>

      {/* Save */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <button
          className="px-6 py-2.5 rounded-lg text-small font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))' }}
        >
          Save Moderation Settings
        </button>
      </motion.div>
    </div>
  );
}

function ToggleItem({ label, desc, enabled, onChange }: {
  label: string; desc: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 pr-4">
        <p className="text-small font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </p>
        <p className="text-tiny mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {desc}
        </p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
        style={{
          backgroundColor: enabled ? 'var(--color-brand-500)' : 'var(--color-bg-border)',
        }}
      >
        <motion.div
          className="w-4 h-4 rounded-full bg-white absolute top-1"
          animate={{ left: enabled ? 22 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}