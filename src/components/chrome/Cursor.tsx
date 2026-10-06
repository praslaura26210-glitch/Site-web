'use client';
import { useEffect, useRef } from 'react';

/** Curseur discret : un point d'encre, un cercle sur les liens. Pointeur fin uniquement. */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current!;
    document.documentElement.classList.add('has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;
    let seen = false;
    const move = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; x = tx; y = ty; el.style.opacity = '1'; }
      el.classList.toggle('is-link', !!(e.target as Element | null)?.closest('a, button, [role="button"], input, label'));
    };
    const loop = () => { x += (tx - x) * 0.3; y += (ty - y) * 0.3; el.style.transform = `translate3d(${x}px, ${y}px, 0)`; raf = requestAnimationFrame(loop); };
    const hide = () => (el.style.opacity = '0'), show = () => (el.style.opacity = '1');
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', hide);
    document.addEventListener('pointerenter', show);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', hide);
      document.removeEventListener('pointerenter', show);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);
  return <div ref={ref} className="cursor" aria-hidden="true" style={{ opacity: 0 }} />;
}
