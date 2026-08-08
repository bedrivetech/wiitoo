'use client';

import { useRef, useEffect, useCallback, RefObject } from 'react';
import gsap from 'gsap';

/* ────────────────────────────────────────────
 *  useGsapMount
 *  Fires an entrance animation when the component mounts.
 *  Pass a unique key to re-trigger on change.
 * ──────────────────────────────────────────── */
export function useGsapMount<T extends HTMLElement>(
  key: string,
  config: {
    from?: gsap.TweenVars;
    to?: gsap.TweenVars;
    duration?: number;
    ease?: string;
  } = {}
) {
  const ref = useRef<T>(null);
  const {
    from = { opacity: 0, y: 24, scale: 0.97, filter: 'blur(4px)' },
    to = { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    duration = 0.45,
    ease = 'power3.out',
  } = config;

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, from, { ...to, duration, ease });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ref;
}

/* ────────────────────────────────────────────
 *  useGsapStagger
 *  Stagger-enters child elements (matched by selector).
 * ──────────────────────────────────────────── */
export function useGsapStagger<T extends HTMLElement>(
  key: string,
  selector: string,
  config: {
    from?: gsap.TweenVars;
    to?: gsap.TweenVars;
    stagger?: number;
    duration?: number;
    ease?: string;
  } = {}
) {
  const ref = useRef<T>(null);
  const {
    from = { opacity: 0, y: 20 },
    to = { opacity: 1, y: 0 },
    stagger = 0.04,
    duration = 0.35,
    ease = 'power2.out',
  } = config;

  useEffect(() => {
    if (ref.current) {
      const children = ref.current.querySelectorAll(selector);
      if (children.length > 0) {
        gsap.fromTo(children, from, { ...to, duration, stagger, ease });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ref;
}

/* ────────────────────────────────────────────
 *  useGsapHover
 *  Adds hover enter/leave animations to a ref.
 * ──────────────────────────────────────────── */
export function useGsapHover<T extends HTMLElement>(
  enter: gsap.TweenVars = { scale: 1.02 },
  leave: gsap.TweenVars = { scale: 1 },
  duration = 0.2
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleEnter = () => {
      gsap.to(el, { ...enter, duration, ease: 'power2.out', overwrite: 'auto' });
    };
    const handleLeave = () => {
      gsap.to(el, { ...leave, duration, ease: 'power2.out', overwrite: 'auto' });
    };

    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [enter, leave, duration]);

  return ref;
}

/* ────────────────────────────────────────────
 *  useGsapToggle
 *  Animates a panel/backdrop when a boolean toggle changes.
 *  Returns a ref and a callback to call on toggle.
 *  Inline GSAP — no CSS transition classes needed.
 * ──────────────────────────────────────────── */
export function useGsapToggle<T extends HTMLElement>(
  isOpen: boolean,
  config: {
    inVars?: gsap.TweenVars;
    outVars?: gsap.TweenVars;
    duration?: number;
    ease?: string;
  } = {}
) {
  const ref = useRef<T>(null);
  const {
    inVars = { opacity: 1, scale: 1, y: 0 },
    outVars = { opacity: 0, scale: 0.95, y: 8 },
    duration = 0.2,
    ease = 'power2.out',
  } = config;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isOpen) {
      gsap.fromTo(el, outVars, { ...inVars, duration, ease, overwrite: 'auto' });
    } else {
      gsap.to(el, { ...outVars, duration, ease: 'power2.in', overwrite: 'auto' });
    }
  }, [isOpen]);

  return ref;
}

/* ────────────────────────────────────────────
 *  useGsapShake
 *  Shakes an element on trigger change.
 * ──────────────────────────────────────────── */
export function useGsapShake<T extends HTMLElement>(trigger: string | number | boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { x: 0 },
        {
          x: 6,
          duration: 0.06,
          repeat: 5,
          yoyo: true,
          ease: 'power2.inOut',
          overwrite: 'auto',
        }
      );
    }
  }, [trigger]);

  return ref;
}

/* ────────────────────────────────────────────
 *  useGsapAnimation — run any GSAP animation programmatically
 * ──────────────────────────────────────────── */
export function useGsapAnimation<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const animate = useCallback(
    (vars: gsap.TweenVars, fromVars?: gsap.TweenVars) => {
      if (!ref.current) return;
      if (fromVars) {
        gsap.fromTo(ref.current, fromVars, { ...vars, overwrite: 'auto' });
      } else {
        gsap.to(ref.current, { ...vars, overwrite: 'auto' });
      }
    },
    []
  );

  return { ref, animate };
}