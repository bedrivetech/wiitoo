'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function StreamKeysPage() {
  const [streamKey] = useState(() =>
    'wiitoo_' + Array.from({ length: 24 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('')
  );
  const [rtmpUrl] = useState('rtmp://ingest.wiitoo.com/live');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<'key' | 'url' | null>(null);

  const copy = async (val: string, type: 'key' | 'url') => {
    await navigator.clipboard.writeText(val);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
          Stream Keys
        </h1>
        <p className="text-small mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Use these credentials in OBS, Streamlabs, or any RTMP client
        </p>
      </div>

      {/* RTMP URL */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-5 border"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-bg-border)',
        }}
      >
        <label className="block text-tiny uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
          RTMP Server URL
        </label>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-3.5 py-2.5 rounded-lg text-small font-mono"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              border: '1px solid var(--color-bg-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {rtmpUrl}
          </div>
          <button
            onClick={() => copy(rtmpUrl, 'url')}
            className="px-3.5 py-2.5 rounded-lg text-small font-medium transition-all"
            style={{
              border: '1px solid var(--color-bg-border)',
              color: copied === 'url' ? 'var(--color-success)' : 'var(--color-text-secondary)',
            }}
          >
            {copied === 'url' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </motion.div>

      {/* Stream Key */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-5 border"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-bg-border)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-tiny uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Stream Key
          </label>
          <span className="text-tiny" style={{ color: 'var(--color-text-tertiary)' }}>
            Keep this secret
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-3.5 py-2.5 rounded-lg text-small font-mono"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              border: '1px solid var(--color-bg-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {showKey ? streamKey : streamKey.slice(0, 8) + '························'}
          </div>
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2.5 rounded-lg text-small transition-all"
            style={{
              border: '1px solid var(--color-bg-border)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => copy(streamKey, 'key')}
            className="px-3.5 py-2.5 rounded-lg text-small font-medium transition-all"
            style={{
              border: '1px solid var(--color-bg-border)',
              color: copied === 'key' ? 'var(--color-success)' : 'var(--color-text-secondary)',
            }}
          >
            {copied === 'key' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-tiny mt-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
          If your key is compromised, generate a new one below.
        </p>
        <button
          className="mt-3 px-4 py-2 rounded-lg text-tiny font-medium transition-all"
          style={{
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--color-error)',
            backgroundColor: 'rgba(239, 68, 68, 0.04)',
          }}
        >
          Reset Stream Key
        </button>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl p-5 border"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-bg-border)',
        }}
      >
        <h2 className="text-subtitle mb-3" style={{ color: 'var(--color-text-primary)' }}>
          How to Stream
        </h2>
        <div className="space-y-2 text-small" style={{ color: 'var(--color-text-secondary)' }}>
          <p>1. Open <strong>OBS Studio</strong>, <strong>Streamlabs</strong>, or your preferred streaming software.</p>
          <p>2. Go to <strong>Settings → Stream</strong>.</p>
          <p>3. Set <strong>Service</strong> to <strong>Custom RTMP</strong>.</p>
          <p>4. Paste the <strong>RTMP URL</strong> and <strong>Stream Key</strong> from above.</p>
          <p>5. Click <strong>Start Streaming</strong> — you'll be live on Wiitoo.</p>
        </div>
      </motion.div>
    </div>
  );
}