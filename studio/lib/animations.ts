'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';
import gsap from 'gsap';

/* ── Mount fade-up (entrance) ── */
export function useGsapMount(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, delay, duration: 0.4, ease: 'power2.out' });
  }, [delay]);
  return ref;
}

/* ── Staggered children entrance ── */
export function useGsapStagger(selector: string, delay = 0, staggerEach = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const children = el.querySelectorAll(selector);
    if (children.length === 0) return;
    gsap.fromTo(children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, delay, duration: 0.35, stagger: staggerEach, ease: 'power2.out' });
  }, [delay, selector, staggerEach]);
  return ref;
}

/* ── Animate a height bar (for analytics) ── */
export function useGsapBar(open = true) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(el, { height: 0 }, { height: open ? 'auto' : 0, duration: 0.35, ease: 'power2.out' });
  }, [open]);
  return ref;
}

/* ── Animate toggle knob position ── */
export function useGsapToggle(on: boolean, px = 22) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { left: on ? px : 4, duration: 0.25, ease: 'back.out(1.7)' });
  }, [on, px]);
  return ref;
}