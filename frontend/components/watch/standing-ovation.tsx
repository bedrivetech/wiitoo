'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StandingOvationProps {
  count: number;
  onOvation?: () => void;
}

/**
 * Standing Ovation — the theatrical replacement for "Like".
 * 
 * - Gives 1 ovation per video (no army-liking)
 * - Animated hands clapping + glow burst effect
 * - Count animates on change
 * - Feels like applause, not a metric
 */
export function StandingOvation({ count, onOvation }: StandingOvationProps) {
  const [ovated, setOvated] = useState(false);
  const [burst, setBurst] = useState(false);
  const [displayCount, setDisplayCount] = useState(count);
  const prevOvated = useRef(false);

  useEffect(() => {
    if (count !== displayCount && !ovated) {
      setDisplayCount(count);
    }
  }, [count, displayCount, ovated]);

  const handleOvation = useCallback(() => {
    if (ovated) return;
    setOvated(true);
    setBurst(true);
    setDisplayCount((p) => p + 1);
    onOvation?.();
    setTimeout(() => setBurst(false), 1200);
  }, [ovated, onOvation]);

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleOvation}
        disabled={ovated}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-tiny font-medium transition-all duration-300 ${
          ovated
            ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
            : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
        }`}
        aria-label={ovated ? 'Standing ovation given' : 'Give a standing ovation'}
      >
        {/* Animated hands */}
        <motion.span
          className="relative inline-flex"
          animate={ovated ? { rotate: [0, -15, 10, -5, 0], scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Default: clapping hands */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill={ovated ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={ovated ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 11V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
        </motion.span>

        {/* Ovation count */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayCount}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`font-medium tabular-nums ${ovated ? 'text-amber-400' : ''}`}
          >
            {displayCount}
          </motion.span>
        </AnimatePresence>

        {/* Ovation label */}
        <span className={`${ovated ? 'text-amber-400/80' : ''}`}>
          {ovated ? 'Ovations' : 'Ovation'}
        </span>
      </button>

      {/* ── Burst particles ── */}
      <AnimatePresence>
        {burst && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute -top-4 -right-2 pointer-events-none"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 6) * Math.PI * 2) * 40,
                  y: Math.sin((i / 6) * Math.PI * 2) * 40 - 10,
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.8, 0],
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: i % 2 === 0 
                    ? 'linear-gradient(135deg, #f59e0b, #f97316)' 
                    : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tooltip on hover when already ovated ── */}
      {ovated && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          You gave this a standing ovation
        </div>
      )}
    </div>
  );
}