'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './project.module.css';

type Data = { w: number; h: number; lines: number[][]; strokes: number[][] };

/**
 * Le croquis se trace à son arrivée à l'écran : lignes de construction, puis traits,
 * puis le dessin original prend le relais. Dessin 2D (canvas), sans WebGL.
 * Sans animation (ou sans JS) : le dessin original s'affiche directement.
 */
export default function Croquis({ json, src, srcSmall, w, h, alt, caption, duree = 2600, eager = false, className }: { json: string; src: string; srcSmall: string; w: number; h: number; alt: string; caption?: string; duree?: number; eager?: boolean; className?: string }) {
  const box = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'static' | 'wait' | 'draw' | 'done'>('static');

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setPhase('wait');
    let data: Data | null = null, raf = 0, started = false;
    fetch(json).then((r) => r.json()).then((d) => { data = d; }).catch(() => setPhase('done'));
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      io.disconnect();
      const wait = () => (data ? run(data) : requestAnimationFrame(wait));
      // à l'accueil, on attend la fin de l'ouverture (logo) pour commencer à dessiner
      if (document.documentElement.dataset.intro) window.addEventListener('lp:intro-fin', () => setTimeout(wait, 250), { once: true });
      else wait();
    }, { threshold: 0.25 });
    io.observe(box.current!);
    function run(d: Data) {
      setPhase('draw');
      const c = cv.current!, ctx = c.getContext('2d')!;
      const dpr = Math.min(2, devicePixelRatio || 1);
      const rect = c.getBoundingClientRect();
      c.width = rect.width * dpr; c.height = rect.height * dpr;
      const k = (rect.width * dpr) / d.w;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const t0 = performance.now(), DUR = duree;
      const total = d.strokes.length;
      const frame = (now: number) => {
        const t = (now - t0) / DUR;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.strokeStyle = 'rgba(43,33,28,.85)';
        // construction : 0 -> 0,35
        ctx.lineWidth = 1.6 * dpr;
        d.lines.forEach(([x0, y0, x1, y1], i) => {
          const p = Math.min(1, Math.max(0, (t - (i / d.lines.length) * 0.25) / 0.12));
          if (p <= 0) return;
          ctx.beginPath(); ctx.moveTo(x0 * k, y0 * k); ctx.lineTo((x0 + (x1 - x0) * p) * k, (y0 + (y1 - y0) * p) * k); ctx.stroke();
        });
        // traits : 0,2 -> 0,85
        ctx.lineWidth = 1 * dpr;
        ctx.strokeStyle = 'rgba(43,33,28,.7)';
        const n = Math.floor(Math.min(1, Math.max(0, (t - 0.2) / 0.65)) * total);
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const s = d.strokes[i];
          ctx.moveTo(s[0] * k, s[1] * k);
          for (let j = 2; j < s.length; j += 2) ctx.lineTo(s[j] * k, s[j + 1] * k);
        }
        ctx.stroke();
        if (t < 1) raf = requestAnimationFrame(frame);
        else setPhase('done');
      };
      raf = requestAnimationFrame(frame);
    }
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [json, duree]);

  return (
    <figure ref={box} className={`${styles.croquis} ${className || ''}`} data-phase={phase} style={{ margin: 0 }}>
      <div className={styles.croquisBox} style={{ aspectRatio: `${w} / ${h}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} srcSet={`${srcSmall} 1000w, ${src} 2000w`} sizes="(max-width: 900px) 100vw, 50vw" alt={alt} width={w} height={h} loading={eager ? 'eager' : 'lazy'} />
        <canvas ref={cv} aria-hidden="true" />
      </div>
      {caption && <figcaption className={styles.cap}>{caption}</figcaption>}
    </figure>
  );
}
