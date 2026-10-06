'use client';
import { useEffect, useRef } from 'react';
import { live } from '@/lib/store';

/** Curseur discret : un point de terre cuite, un cercle sur les liens. Pointeur fin uniquement. */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fine = matchMedia('(pointer: fine)').matches;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onMove = (e: PointerEvent) => {
      live.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      live.pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    if (!fine || reduced) return () => window.removeEventListener('pointermove', onMove);
    const el = ref.current!;
    document.documentElement.classList.add('has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      const tgt = e.target as Element | null;
      const drag = tgt?.closest('[data-cursor="drag"]');
      const link = !drag && tgt?.closest('a, button, [role="slider"], label, input');
      el.classList.toggle('is-link', !!link);
      el.classList.toggle('is-drag', !!drag);
    };
    const loop = () => {
      x += (tx - x) * 0.28; y += (ty - y) * 0.28;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const leave = () => (el.style.opacity = '0');
    const enter = () => (el.style.opacity = '1');
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);
  return <div ref={ref} className="cursor" aria-hidden="true" />;
}
