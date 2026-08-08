'use client';

import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
}

export function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${shareUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const platformShare = (platform: string) => {
    const encoded = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title || '');
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      reddit: `https://reddit.com/submit?url=${encoded}&title=${encodedTitle}`,
      telegram: `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
    };
    const u = urls[platform];
    if (u) window.open(u, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-200 ease-out ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-2xl p-5 border border-bg-border bg-bg-elevated shadow-2xl transition-all duration-200 ease-out ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">Share</h3>
          <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { key: 'twitter', icon: '𝕏', label: 'X' },
            { key: 'facebook', icon: 'f', label: 'Facebook' },
            { key: 'reddit', icon: 'R', label: 'Reddit' },
            { key: 'telegram', icon: '✈', label: 'Telegram' },
            { key: 'whatsapp', icon: '💬', label: 'WhatsApp' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => platformShare(p.key)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-bg-hover transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-bg-raised flex items-center justify-center text-base group-hover:bg-bg-active transition-colors">
                {p.icon}
              </div>
              <span className="text-[10px] text-text-tertiary">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-bg-raised border border-bg-border text-tiny text-text-muted truncate">
            {shareUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className="shrink-0 px-4 py-2 rounded-lg text-tiny font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <button
          onClick={handleCopyEmbed}
          className="w-full text-left px-3 py-2 rounded-lg text-tiny text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-all"
        >
          {embedCopied ? '✓ Embed code copied' : 'Copy embed code'}
        </button>
      </div>
    </div>
  );
}