'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useUiStore } from '@/lib/store';

interface WiitooPlayerProps {
  src: string;
  poster?: string;
  isLive?: boolean;
  title?: string;
  liveViewers?: number;
}

export function WiitooPlayer({
  src,
  poster,
  isLive = false,
  title,
  liveViewers,
}: WiitooPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(false);

  const toggleChat = useUiStore((s) => s.toggleChat);
  const isChatOpen = useUiStore((s) => s.isChatOpen);

  /* ── Init video.js ── */
  useEffect(() => {
    if (!videoRef.current || playerRef.current) return;

    const player = videojs(videoRef.current, {
      controls: false,
      autoplay: false,
      muted: false,
      preload: 'auto',
      poster,
      html5: {
        hls: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
        },
      },
      liveui: isLive,
    });

    player.src({ src, type: 'application/x-mpegURL' });

    player.on('play', () => {
      setPlaying(true);
      hideControlsAfterDelay();
    });
    player.on('pause', () => {
      setPlaying(false);
      setShowControls(true);
    });
    player.on('timeupdate', () => {
      const ct = player.currentTime();
      const dur = player.duration();
      if (ct !== undefined) setCurrentTime(ct);
      if (dur !== undefined) setDuration(dur);
    });
    player.on('volumechange', () => {
      const vol = player.volume();
      const mut = player.muted();
      if (vol !== undefined) setVolume(vol);
      if (mut !== undefined) setMuted(mut);
    });
    player.on('fullscreenchange', () => {
      const fs = player.isFullscreen();
      if (fs !== undefined) setIsFullscreen(fs);
    });

    playerRef.current = player;

    /* Show controls initially, hide after 3s if playing */
    setTimeout(() => {
      if (player.tech(true)) {
        setShowControls(false);
      }
    }, 3000);

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, isLive]);

  /* ── Control visibility ── */
  const hideControlsAfterDelay = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  /* ── Actions ── */
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (playing) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, [playing]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.muted(!muted);
  }, [muted]);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!playerRef.current) return;
    playerRef.current.volume(val);
    playerRef.current.muted(false);
    setVolume(val);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!playerRef.current) return;
    playerRef.current.currentTime(val);
    setCurrentTime(val);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;
    if (playerRef.current.isFullscreen()) {
      playerRef.current.exitFullscreen();
    } else {
      playerRef.current.requestFullscreen();
    }
  }, []);

  /* ── Format time ── */
  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const buffered = 0; /* would come from player.buffered() */

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black overflow-hidden group"
      onMouseMove={showControlsTemporarily}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
      onDoubleClick={toggleFullscreen}
    >
      {/* <video> element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain wiitoo-player-skin"
        playsInline
      />

      {/* ── Top-left: live badge ── */}
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5 bg-live/90 backdrop-blur-sm rounded-md px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse-live" />
            <span className="text-white text-tiny font-semibold tracking-wider">LIVE</span>
          </div>
          {liveViewers !== undefined && (
            <div className="bg-black/50 backdrop-blur-sm rounded-md px-2 py-1">
              <span className="text-white/80 text-tiny font-mono">
                {liveViewers.toLocaleString()} watching
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Center play button (big) ── */}
      <button
        onClick={togglePlay}
        className={`absolute inset-0 flex items-center justify-center z-10 transition-all duration-300 ${
          showControls || !playing
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {!playing && (
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-600/90 hover:bg-brand-500 transition-all duration-200 flex items-center justify-center shadow-xl shadow-brand-600/20 backdrop-blur-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </button>

      {/* ── Bottom gradient fade ── */}
      <div
        className={`absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-300 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* ── Controls bar ── */}
      <div
        className={`absolute inset-x-0 bottom-0 px-3 pb-2 md:px-4 md:pb-3 transition-all duration-300 z-20 ${
          showControls
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Progress bar */}
        <div
          className="relative h-1 bg-white/15 rounded-full mb-3 cursor-pointer group/progress"
          onMouseEnter={() => setHoverProgress(true)}
          onMouseLeave={() => setHoverProgress(false)}
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-600 to-ember-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-all ${
              hoverProgress ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
          {!isLive && (
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Left: Play, volume, time */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={togglePlay}
              className="text-white/90 hover:text-white transition-colors p-0.5"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleMute}
              className="text-white/70 hover:text-white transition-colors p-0.5"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>

            <div className="hidden sm:block w-20">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="w-full h-1 accent-brand-500 cursor-pointer"
                aria-label="Volume"
              />
            </div>

            {!isLive && (
              <span className="text-white/60 text-tiny font-mono tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>

          {/* Right: Chat toggle, settings, fullscreen */}
          <div className="flex items-center gap-1 md:gap-2">
            {isLive && (
              <button
                onClick={toggleChat}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-tiny font-medium transition-all duration-200 ${
                  isChatOpen
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                    : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                aria-label="Toggle chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Chat
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="text-white/60 hover:text-white transition-colors p-1.5"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}