'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function StudioSettingsPage() {
  const [displayName, setDisplayName] = useState('Your Name');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('tech');
  const [twitter, setTwitter] = useState('');
  const [discord, setDiscord] = useState('');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
          Creator Settings
        </h1>
        <p className="text-small mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Manage your creator profile and preferences
        </p>
      </div>

      {/* Profile */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-bg-border)',
        }}
      >
        <h2 className="text-subtitle mb-5" style={{ color: 'var(--color-text-primary)' }}>
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell your audience about yourself..."
              className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none resize-none"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Primary Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="tech">Tech</option>
              <option value="music">Music</option>
              <option value="gaming">Gaming</option>
              <option value="creative">Creative Arts</option>
              <option value="entertainment">Entertainment</option>
              <option value="education">Education</option>
              <option value="sports">Sports & Fitness</option>
            </select>
          </div>
        </div>
      </motion.section>

      {/* Social Links */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-bg-border)',
        }}
      >
        <h2 className="text-subtitle mb-5" style={{ color: 'var(--color-text-primary)' }}>
          Social Links
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Twitter / X
            </label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/yourhandle"
              className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-tiny uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Discord Invite
            </label>
            <input
              type="text"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="https://discord.gg/yourserver"
              className="w-full px-3.5 py-2.5 rounded-lg text-small outline-none"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
      </motion.section>

      {/* Save */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          className="px-6 py-2.5 rounded-lg text-small font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
          }}
        >
          Save Changes
        </button>
      </motion.div>
    </div>
  );
}