'use client';
import { useEffect } from 'react';

/** Les éléments marqués data-v glissent un peu plus vite que la page : effet de profondeur (écrans larges seulement). */
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
          const d = -(r.top + r.height / 2 - mid) * Number(el.dataset.v);
          el.style.translate = `0 ${Math.max(-36, Math.min(36, d)).toFixed(1)}px`;
        }
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
