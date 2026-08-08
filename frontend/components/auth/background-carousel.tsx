'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Cinematic Images ───
 *  Dark, moody, high-quality — matched to Wiitoo's "warm darkness" brand.
 *  Violet-amber tones, cinematic lighting, deep shadows.
 */
const CINEMATIC_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&q=85&auto=format&fit=crop',  // neon cityscape
    label: 'city nights',
  },
  {
    src: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=1920&q=85&auto=format&fit=crop',  // northern lights
    label: 'aurora',
  },
  {
    src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&q=85&auto=format&fit=crop',  // gaming setup
    label: 'gaming',
  },
  {
    src: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe70?w=1920&q=85&auto=format&fit=crop',  // concert crowd
    label: 'live',
  },
  {
    src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1920&q=85&auto=format&fit=crop',  // silhouette performer
    label: 'stage',
  },
  {
    src: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1920&q=85&auto=format&fit=crop',  // night sky
    label: 'night',
  },
  {
    src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=85&auto=format&fit=crop',  // synthwave grid
    label: 'synthwave',
  },
  {
    src: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&q=85&auto=format&fit=crop',  // neon rain
    label: 'neon',
  },
];

/* ─── Vibe-specific backgrounds ───
 *  When user has selected vibes, show matching imagery.
 */
const VIBE_BACKGROUNDS: Record<string, string> = {
  gaming: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&q=85&auto=format&fit=crop',
  music: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=85&auto=format&fit=crop',
  tech: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=85&auto=format&fit=crop',
  creative: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1920&q=85&auto=format&fit=crop',
  sports: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=1920&q=85&auto=format&fit=crop',
  'talk-shows': 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1920&q=85&auto=format&fit=crop',
  education: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=85&auto=format&fit=crop',
  entertainment: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1920&q=85&auto=format&fit=crop',
  irl: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=85&auto=format&fit=crop',
  asmr: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=85&auto=format&fit=crop',
};

interface BackgroundCarouselProps {
  /** Vibes the user has selected — shows matching imagery when available */
  selectedVibes?: string[];
  /** Override: show a specific step style (welcome = brighter, vibe = darker) */
  mood?: 'default' | 'welcome' | 'login';
}

export function BackgroundCarousel({ selectedVibes = [], mood = 'default' }: BackgroundCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0])); // first is always "loaded"
  const [vibeImage, setVibeImage] = useState<string | null>(null);

  // Determine which images to use
  const images = vibeImage
    ? [{ src: vibeImage, label: 'vibe' }]
    : CINEMATIC_IMAGES;

  // When vibes change, try to show matching imagery
  useEffect(() => {
    if (selectedVibes.length > 0) {
      const matchedVibe = selectedVibes.find((v) => VIBE_BACKGROUNDS[v]);
      if (matchedVibe) {
        setVibeImage(VIBE_BACKGROUNDS[matchedVibe]);
        return;
      }
    }
    setVibeImage(null);
  }, [selectedVibes]);

  // Carousel rotation (only when not showing a single vibe image)
  useEffect(() => {
    if (vibeImage) return; // don't rotate when showing a matched vibe image
    if (mood === 'welcome') return; // welcome has its own overlay

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CINEMATIC_IMAGES.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [vibeImage, mood]);

  // Preload images
  useEffect(() => {
    const allImages = vibeImage
      ? [vibeImage]
      : CINEMATIC_IMAGES.map((img) => img.src);

    allImages.forEach((src, i) => {
      if (imagesLoaded.has(i)) return;
      const img = new window.Image();
      img.onload = () => setImagesLoaded((prev) => new Set(prev).add(i));
      img.src = src;
    });
  }, [vibeImage]);

  // Determine overlay opacity based on mood
  const overlayOpacity = mood === 'welcome' ? 0.4 : mood === 'login' ? 0.65 : 0.55;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Background images with cross-fade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={vibeImage ? 'vibe' : currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${vibeImage || CINEMATIC_IMAGES[currentIndex].src})`,
              filter: 'saturate(0.7) brightness(0.6) contrast(1.1)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay — brand-matched, ensures readability */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(11, 11, 11, ${overlayOpacity + 0.2}) 0%,
              rgba(11, 11, 11, ${overlayOpacity}) 40%,
              rgba(11, 11, 11, ${overlayOpacity - 0.05}) 60%,
              rgba(11, 11, 11, ${overlayOpacity + 0.1}) 100%
            )
          `,
        }}
      />

      {/* Brand vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 100%,
              rgba(124, 58, 237, 0.06) 0%,
              transparent 60%
            )
          `,
        }}
      />

      {/* Top amber glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)',
        }}
      />

      {/* Side violet light leaks */}
      <div
        className="absolute top-1/4 left-0 w-[1px] h-[40%]"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.08), transparent)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-0 w-[1px] h-[40%]"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(245,158,11,0.06), transparent)',
        }}
      />

      {/* Moving light texture — simulates video/lighting dynamics */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              transparent 0%,
              rgba(255,255,255,0.03) 50%,
              transparent 100%
            )
          `,
          backgroundSize: '400% 100%',
          animation: 'lightSweep 12s ease-in-out infinite',
        }}
      />

      {/* Overlay noise texture for film grain feel */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '256px 256px',
        }}
      />
    </div>
  );
}