'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './project.module.css';

/** Image qui se dévoile de haut en bas à son arrivée à l'écran. Visible d'emblée si pas de JS ou animations réduites. */
export default function Reveal({ src, srcSmall, alt, w, h, caption, className }: { src: string; srcSmall: string; alt: string; w: number; h: number; caption?: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setStateR] = useState<'static' | 'wait' | 'in'>('static');
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight) return; // déjà visible : on ne cache rien
    setStateR('wait');
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStateR('in'); io.disconnect(); } }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <figure ref={ref} className={`${styles.reveal} ${className || ''}`} data-state={state} style={{ margin: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} srcSet={`${srcSmall} 1000w, ${src} 2000w`} sizes="(max-width: 900px) 100vw, 60vw" alt={alt} width={w} height={h} loading="lazy" decoding="async" />
      {caption && <figcaption className={styles.cap}>{caption}</figcaption>}
    </figure>
  );
}
