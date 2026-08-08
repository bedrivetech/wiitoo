'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  hue: number; // 0 = violet, 1 = amber
  life: number;
  maxLife: number;
  driftX: number;
  driftY: number;
}

interface EmberParticlesProps {
  /** 0-1: how strongly particles are attracted toward the center (focus) */
  focusIntensity?: number;
  /** Optional: canvas size override */
  className?: string;
}

export function EmberParticles({ focusIntensity = 0, className = '' }: EmberParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef<number>(0);

  const PARTICLE_COUNT = 60;
  const MAX_LIFE = 200;

  const createParticle = useCallback((w: number, h: number): Particle => {
    const side = Math.random();
    let x: number, y: number;
    if (side < 0.25) { x = Math.random() * w; y = -10; }
    else if (side < 0.5) { x = Math.random() * w; y = h + 10; }
    else if (side < 0.75) { x = -10; y = Math.random() * h; }
    else { x = w + 10; y = Math.random() * h; }

    const angle = Math.atan2(h / 2 - y, w / 2 - x) + (Math.random() - 0.5) * 0.5;
    const speed = 0.15 + Math.random() * 0.35;
    const hue = Math.random() < 0.6
      ? 260 + Math.random() * 30  // violet range
      : 40 + Math.random() * 20;   // amber range

    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0,
      baseOpacity: 0.3 + Math.random() * 0.4,
      hue,
      life: 0,
      maxLife: MAX_LIFE + Math.random() * 100,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: (Math.random() - 0.5) * 0.15,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // Init particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => createParticle(w, h));

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouse);
    document.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const cx = w / 2;
      const cy = h / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;

        // Fade in
        if (p.life < 30) {
          p.opacity = p.baseOpacity * (p.life / 30);
        }
        // Fade out near end
        if (p.life > p.maxLife - 40) {
          p.opacity = p.baseOpacity * ((p.maxLife - p.life) / 40);
        }

        // Drift
        p.x += p.vx + p.driftX;
        p.y += p.vy + p.driftY;

        // Gentle pull toward center (like embers rising)
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 50 && dist < 600) {
          const pull = 0.0003 * focusIntensity;
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;
        }

        // Mouse interaction — gentle repel
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 200 && mDist > 1) {
          const force = (200 - mDist) / 200 * 0.15;
          p.vx += (mdx / mDist) * force;
          p.vy += (mdy / mDist) * force;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Clamp velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 2) {
          p.vx = (p.vx / speed) * 2;
          p.vy = (p.vy / speed) * 2;
        }

        // Respawn if out of bounds or dead
        if (
          p.life > p.maxLife ||
          p.x < -50 || p.x > w + 50 ||
          p.y < -50 || p.y > h + 50
        ) {
          const newP = createParticle(w, h);
          particles[i] = newP;
          continue;
        }

        // Draw
        const isViolet = p.hue > 250;
        const alpha = Math.max(0, Math.min(1, p.opacity));
        ctx.beginPath();

        if (isViolet) {
          ctx.fillStyle = `rgba(124, 58, 237, ${alpha})`;
          ctx.shadowColor = `rgba(124, 58, 237, ${alpha * 0.4})`;
        } else {
          ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`;
          ctx.shadowColor = `rgba(245, 158, 11, ${alpha * 0.4})`;
        }

        ctx.shadowBlur = p.size * 3;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [createParticle, focusIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
      }}
    />
  );
}