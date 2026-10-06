'use client';
import { useEffect } from 'react';

/** Collage : les éléments marqués data-v glissent plus ou moins vite que la page (parallaxe douce). */
export default function Parallaxe() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth < 900) return;
    const els = [...document.querySelectorAll<HTMLElement>('[data-v]')];
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = innerHeight / 2;
        for (const el of els) {
          const r = el.getBoundingClientRect();
          const d = r.top + r.height / 2 - mid;
          el.style.transform = `translate3d(0, ${(-d * Number(el.dataset.v)).toFixed(1)}px, 0)`;
        }
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
