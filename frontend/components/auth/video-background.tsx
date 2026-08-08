'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoBackgroundProps {
  /** Vibe the user has selected — shifts overlay tone */
  selectedVibes?: string[];
  /** Override mood (welcome = brighter, login = darker) */
  mood?: 'default' | 'welcome' | 'login';
  /** Video source URL — uses Envato cinematic clip by default */
  videoSrc?: string;
}

/* ─── Brand color weighting by vibe ─── */
const VIBE_TONES: Record<string, { r: number; g: number; b: number }> = {
  gaming: { r: 124, g: 58, b: 237 },      // violet
  music: { r: 236, g: 72, b: 153 },       // pink
  tech: { r: 6, g: 182, b: 212 },         // cyan
  creative: { r: 245, g: 158, b: 11 },    // amber
  sports: { r: 34, g: 197, b: 94 },       // green
  'talk-shows': { r: 168, g: 85, b: 247 },// purple
  education: { r: 59, g: 130, b: 246 },   // blue
  entertainment: { r: 239, g: 68, b: 68 },// red
  irl: { r: 20, g: 184, b: 166 },        // teal
  asmr: { r: 99, g: 102, b: 241 },       // indigo
};

export function VideoBackground({
  selectedVibes = [],
  mood = 'default',
  videoSrc,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [accentColor, setAccentColor] = useState({ r: 124, g: 58, b: 237 });

  // Shift accent based on selected vibes
  useEffect(() => {
    if (selectedVibes.length > 0) {
      const matched = selectedVibes
        .map((v) => VIBE_TONES[v])
        .filter(Boolean);
      if (matched.length > 0) {
        // Average the colors of matched vibes
        const avg = matched.reduce(
          (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
          { r: 0, g: 0, b: 0 }
        );
        avg.r = Math.round(avg.r / matched.length);
        avg.g = Math.round(avg.g / matched.length);
        avg.b = Math.round(avg.b / matched.length);
        setAccentColor(avg);
      }
    } else {
      setAccentColor({ r: 124, g: 58, b: 237 }); // default violet
    }
  }, [selectedVibes]);

  // Try to play on mount (some browsers need user interaction)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — user will need to interact first
        // This is fine; the video will start on first click
      });
    }
  }, []);

  // Overlay opacity based on mood
  const overlayOpacity = mood === 'welcome' ? 0.45 : mood === 'login' ? 0.7 : 0.6;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0b0b0b]">
      {/* Video element — full frame, cinematic crop */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: 'saturate(0.65) brightness(0.4) contrast(1.15)',
            objectPosition: '50% 30%', // Frame the subject (vlogger in center-lower)
          }}
        >
          <source
            src={videoSrc || 'https://video-downloads.elements.envatousercontent.com/files/9cd5e503-b72f-4a29-9c19-dc47f3bdebb0/source.mov?item_id=7bd520af-fa29-4b5a-8b6e-1d3bb06a9c7d&response-content-disposition=attachment%3B+filename%2A%3DUTF-8%27%27man-vlogging-with-stabilizer-in-urban-park-2025-12-17-08-51-12-utc.mov&Expires=1786213861&Signature=QIiYWbifd~60pUmKN40WaYG9zHIGZPHY8m83UTSeuHYA6ke7JmomJ6rkY0lCxTM7UrWupLv7MexcRUwqNUwv849DYeq75FOh0MskU05tiVzLwowPJuFhQN0HYnwDu2vxL5jAbwmj9BgmKHlJdzCOI66yIL1ixkruRfUaljtTgV95brZgklELbqPksngoetwjLM-VuQM8JmjgGpKpro-qMxAOf1ePCM2Mv7cE2llQTo8GFZO0ZXuRbYoMYcXhnRUaQCLQXJlW7BxUW3o9mwSvN51W-gp4UN8zYop9ixA5RM-6S4dF3XCfvQVD8mZ8IP0BaTiY4-iXkCU4iToVHS9txQ__&Key-Pair-Id=APKAJ6HWV4WTNAJ4QQOQ'}
            type="video/mp4"
          />
        </video>
      </div>

      {/* Loading placeholder — shows before video hydrates */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b0b] via-[#111] to-[#0f0f1a]" />
      )}

      {/* Primary gradient overlay — brand-matched darkness */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(8, 8, 12, ${overlayOpacity + 0.2}) 0%,
              rgba(8, 8, 12, ${overlayOpacity + 0.05}) 30%,
              rgba(8, 8, 12, ${overlayOpacity - 0.1}) 50%,
              rgba(8, 8, 12, ${overlayOpacity + 0.15}) 80%,
              rgba(8, 8, 12, ${overlayOpacity + 0.25}) 100%
            )
          `,
        }}
      />

      {/* Edge vignette — draws eye to the center */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 50%,
              transparent 0%,
              rgba(8, 8, 12, 0.15) 50%,
              rgba(8, 8, 12, 0.5) 100%
            )
          `,
        }}
      />

      {/* Accent glow — shifts color based on selected vibes */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 100%,
              rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.08) 0%,
              transparent 70%
            )
          `,
        }}
      />

      {/* Top edge light */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.12), transparent)`,
        }}
      />

      {/* Side light leaks */}
      <div
        className="absolute top-1/3 left-0 w-[1px] h-[30%]"
        style={{
          background: `linear-gradient(180deg, transparent, rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.06), transparent)`,
        }}
      />

      {/* Film grain noise texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '256px 256px',
        }}
      />

      {/* Subtle pulsing brightness overlay — gives the background "life" */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: 'vitalPulse 6s ease-in-out infinite',
        }}
      />
    </div>
  );
}