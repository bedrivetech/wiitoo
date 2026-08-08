'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useUiStore } from '@/lib/store';
import type { ChatMessage } from '@/lib/types';

/* ── Mock chat data ── */
const MOCK_CHAT: ChatMessage[] = [
  { id: 'c1', username: 'pixel_runner', displayName: 'Pixel Runner', text: 'This is incredible! Been waiting for this all week 🔥', badge: 'sub', timestamp: Date.now() - 60000 },
  { id: 'c2', username: 'nina_codes', displayName: 'Nina Codes', text: 'the production quality is insane', badge: 'exclusive', timestamp: Date.now() - 45000 },
  { id: 'c3', username: 'viewer_3492', displayName: 'Viewer 88', text: 'first time catching this stream, hi everyone!', timestamp: Date.now() - 30000 },
  { id: 'c4', username: 'superfan99', displayName: 'SuperFan99', text: 'just subbed! let\'s gooo 🎉', badge: 'sub', timestamp: Date.now() - 20000 },
  { id: 'c5', username: 'midnight_owl', displayName: 'Midnight Owl', text: 'chat is moving so fast lol', timestamp: Date.now() - 10000 },
  { id: 'c6', username: 'ember_vibes', displayName: 'Ember Vibes', text: '🔥🔥🔥', badge: 'exclusive', isSuperchat: true, superchatAmount: 25, timestamp: Date.now() - 5000 },
];

/* ── Single chat message ── */
function ChatMessageItem({ msg, index }: { msg: ChatMessage; index: number }) {
  return (
    <div className={`chat-message-enter ${msg.isSuperchat ? 'gradient-ember-horizontal rounded-lg px-2 -mx-2 superchat-enter' : ''}`} style={{ animationDelay: `${index * 0.03}s` }}>
      <div className="flex items-start gap-1.5">
        <span
          className={`shrink-0 text-tiny font-semibold ${
            msg.badge === 'exclusive'
              ? 'text-ember-400'
              : msg.badge === 'sub'
              ? 'text-brand-400'
              : 'text-text-muted'
          }`}
        >
          {msg.displayName}
        </span>
        {msg.isSuperchat && msg.superchatAmount && (
          <span className="shrink-0 text-tiny font-bold text-ember-400">
            ${msg.superchatAmount}
          </span>
        )}
        <span className="text-small text-text-secondary break-words">
          {msg.text}
        </span>
      </div>
    </div>
  );
}

/* ── Chat Drawer ── */
export function ChatDrawer() {
  const isChatOpen = useUiStore((s) => s.isChatOpen);
  const toggleChat = useUiStore((s) => s.toggleChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when chat opens — with a delay to let the slide animation finish
  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 350); // matches GSAP spring damping
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  // Also scroll when new messages arrive (in future when wired to WebSocket)
  const [messages] = useState(MOCK_CHAT);
  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isChatOpen]);

  /* ── GSAP panel animation ── */
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backdropRef.current || !panelRef.current) return;
    gsap.to(backdropRef.current, {
      opacity: isChatOpen ? 1 : 0,
      duration: 0.2,
      pointerEvents: isChatOpen ? 'all' : 'none',
      overwrite: 'auto',
    });
    gsap.to(panelRef.current, {
      x: isChatOpen ? 0 : '100%',
      duration: 0.3,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  }, [isChatOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        style={{ opacity: 0, pointerEvents: 'none' }}
        onClick={isChatOpen ? toggleChat : undefined}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-[360px] max-w-[85vw] z-50 chat-panel flex flex-col"
        style={{ transform: 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-small font-semibold text-text-primary">Live Chat</span>
            <div className="flex items-center gap-1 text-tiny text-live">
              <div className="w-1.5 h-1.5 rounded-full bg-live animate-pulse-live" />
              <span className="font-mono">12</span>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all"
            aria-label="Close chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {messages.map((msg, i) => (
            <ChatMessageItem key={msg.id} msg={msg} index={i} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-bg-border shrink-0">
          <div className="flex items-center gap-2 bg-bg-hover rounded-lg px-3 py-2 border border-bg-border focus-within:border-brand-600/30 transition-colors">
            <input
              type="text"
              placeholder="Send a message..."
              className="flex-1 bg-transparent text-small text-text-primary placeholder-text-muted focus:outline-none"
            />
            <button className="p-1 text-text-muted hover:text-text-secondary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </button>
            <button className="p-1 text-text-muted hover:text-text-secondary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}