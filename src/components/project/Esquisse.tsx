'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './esquisse.module.css';

/**
 * Le vrai dessin apparaît comme s'il était hachuré au crayon : des traits courts,
 * partant du point de fuite et gagnant toute la feuille. Le dessin original reste intact.
 * Sans animation (ou sans JS) : l'image s'affiche directement.
 */
export default function Esquisse({
  src, srcSmall, w, h, alt, caption, fuite = [0.5, 0.5], duree = 2800, eager = false, className, sizes = '(max-width: 900px) 100vw, 50vw',
}: {
  src: string; srcSmall: string; w: number; h: number; alt: string; caption?: string;
  fuite?: [number, number]; duree?: number; eager?: boolean; className?: string; sizes?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'static' | 'wait' | 'draw' | 'done'>('static');

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setPhase('wait');
    let raf = 0, started = false, alive = true;
    const img = new Image();
    img.decoding = 'async';
    img.src = innerWidth > 900 ? src : srcSmall;
    const ready = img.decode().catch(() => undefined);

    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      io.disconnect();
      const go = () => ready.then(() => alive && run());
      // à l'accueil, on attend la fin de l'ouverture (logo)
      if (document.documentElement.dataset.intro) window.addEventListener('lp:intro-fin', () => setTimeout(go, 200), { once: true });
      else go();
    }, { threshold: 0.2 });
    io.observe(box.current!);

    function run() {
      if (!img.naturalWidth) { setPhase('done'); return; }
      setPhase('draw');
      const c = cv.current!, ctx = c.getContext('2d')!;
      const dpr = Math.min(2, devicePixelRatio || 1);
      const r = c.getBoundingClientRect();
      const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
      c.width = W; c.height = H;
      const mask = document.createElement('canvas');
      mask.width = W; mask.height = H;
      const m = mask.getContext('2d')!;
      m.lineCap = 'round';

      // hachures : traits courts, inclinés, triés du point de fuite vers les bords
      const N = 4200, k = W / 900;
      const fx = fuite[0] * W, fy = fuite[1] * H, dmax = Math.hypot(Math.max(fx, W - fx), Math.max(fy, H - fy));
      type T = { x: number; y: number; a: number; l: number; e: number; o: number; key: number };
      const traits: T[] = [];
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < N; i++) {
        const x = rnd() * W, y = rnd() * H;
        const cross = i % 3 === 0;
        traits.push({
          x, y,
          a: (cross ? 0.55 : -0.95) + (rnd() - 0.5) * 0.25,
          l: (24 + rnd() * 70) * k,
          e: (2.5 + rnd() * 7) * k,
          o: 0.45 + rnd() * 0.5,
          key: Math.hypot(x - fx, y - fy) / dmax + rnd() * 0.22,
        });
      }
      traits.sort((p, q) => p.key - q.key);

      const t0 = performance.now();
      let drawn = 0;
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / duree);
        const target = Math.floor(Math.min(1, t / 0.8) * N);
        for (; drawn < target; drawn++) {
          const s = traits[drawn];
          const dx = Math.cos(s.a) * s.l / 2, dy = Math.sin(s.a) * s.l / 2;
          m.strokeStyle = `rgba(0,0,0,${s.o})`;
          m.lineWidth = s.e;
          m.beginPath(); m.moveTo(s.x - dx, s.y - dy); m.lineTo(s.x + dx, s.y + dy); m.stroke();
        }
        if (t > 0.72) { m.fillStyle = `rgba(0,0,0,${(t - 0.72) / 0.28 * 0.45})`; m.fillRect(0, 0, W, H); }
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(mask, 0, 0);
        if (t < 1) raf = requestAnimationFrame(frame);
        else setPhase('done');
      };
      raf = requestAnimationFrame(frame);
    }
    return () => { alive = false; io.disconnect(); cancelAnimationFrame(raf); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, srcSmall, duree, fuite[0], fuite[1]]);

  return (
    <figure className={`${styles.esquisse} ${className || ''}`} data-phase={phase}>
      <div ref={box} className={styles.box} style={{ aspectRatio: `${w} / ${h}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} srcSet={`${srcSmall} 1000w, ${src} 2000w`} sizes={sizes} alt={alt} width={w} height={h} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} />
        <canvas ref={cv} aria-hidden="true" />
      </div>
      {caption && <figcaption className={styles.cap}>{caption}</figcaption>}
    </figure>
  );
}
