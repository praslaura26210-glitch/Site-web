'use client';
import { useEffect, useRef } from 'react';

/** En descendant, on « avance » dans le dessin : il grossit vers son point de fuite (la présentation reste en place, voir .heroScene). */
export default function Avancee({ children, className, fuite }: { children: React.ReactNode; className?: string; fuite: [number, number] }) {
  // la variable --p est posée sur l'élément ; les règles CSS de la scène l'utilisent
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current!;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.5)));
        el.style.setProperty('--p', p.toFixed(4));
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} className={className} style={{ ['--fx' as string]: `${fuite[0] * 100}%`, ['--fy' as string]: `${fuite[1] * 100}%` }}>
      {children}
    </div>
  );
}
