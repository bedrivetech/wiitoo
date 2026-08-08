'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface CurtainCallProps {
  visible: boolean;
  title: string;
  creatorName: string;
  creatorUsername: string;
}

/**
 * Curtain Call — what you see when a video ends.
 * Instead of aggressive "Up Next" recommendations,
 * you get a theatrical closing sequence.
 * 
 * - Violet curtains close from top/bottom
 * - "Standing Ovation" prompt persists
 * - "Encore" suggests more from the same creator
 * - Soft credits roll feel
 */
export function CurtainCall({
  visible,
  title,
  creatorName,
  creatorUsername,
}: CurtainCallProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden pointer-events-auto"
        >
          {/* ── Curtain drapes ── */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
            className="absolute inset-x-0 top-0 h-1/2 origin-top"
            style={{
              background: 'linear-gradient(180deg, rgba(30,15,60,0.95) 0%, rgba(15,10,30,0.6) 60%, transparent 100%)',
            }}
          />
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
            className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom"
            style={{
              background: 'linear-gradient(0deg, rgba(30,15,60,0.95) 0%, rgba(15,10,30,0.6) 60%, transparent 100%)',
            }}
          />

          {/* ── Curtain fold lines ── */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
            <div className="flex gap-8 rotate-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-0.5 h-96 bg-white rounded-full" />
              ))}
            </div>
          </div>

          {/* ── Content ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative z-10 text-center px-6 max-w-lg"
          >
            {/* Show title */}
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-brand-400/60 font-medium">
                You&apos;ve watched
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white/90 leading-tight mb-1 line-clamp-2">
              {title}
            </h2>
            <p className="text-white/50 text-small mb-6">
              by{' '}
              <Link href={`/creator/${creatorUsername}`} className="text-brand-400 hover:text-brand-300 transition-colors">
                {creatorName}
              </Link>
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
              <div className="w-1 h-1 rounded-full bg-amber-500/50" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            {/* Encore */}
            <p className="text-white/40 text-tiny mb-4 tracking-wider uppercase">
              Encore — more from this creator
            </p>

            <Link
              href={`/creator/${creatorUsername}`}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-small font-medium transition-all ring-1 ring-white/10 hover:ring-white/20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch more from {creatorName.split(' ')[0]}
            </Link>

            {/* Bottom hint */}
            <p className="text-white/20 text-[10px] mt-6">
              Click anywhere to dismiss curtain
            </p>
          </motion.div>

          {/* ── Cinema light beam ── */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-20 opacity-20 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(245,158,11,0.4), transparent)',
              filter: 'blur(4px)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}