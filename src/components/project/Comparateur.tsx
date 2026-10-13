'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './project.module.css';

type Img = { src: string; w: number; h: number; legende: string };

/**
 * Existant (dessus) / projet (dessous) : on fait glisser le trait pour passer de l'un à l'autre.
 * Au premier passage, le trait balaie une fois pour montrer qu'il se déplace. Clavier : flèches.
 */
type Place = [number, number, number, number];
/** cadre : la boîte commune aux deux images et la place de chacune dedans (pour deux plans à la même échelle) */
export default function Comparateur({ existant, projet, titre, labels, credit, cadre }: { existant: Img; projet: Img; titre: string; credit?: string; labels: { existant: string; projet: string; glisser: string }; cadre?: { w: number; h: number; a: Place; b: Place } }) {
  const place = (q: Place) => (cadre ? { left: `${(q[0] / cadre.w) * 100}%`, top: `${(q[1] / cadre.h) * 100}%`, width: `${(q[2] / cadre.w) * 100}%`, height: `${(q[3] / cadre.h) * 100}%`, objectFit: 'fill' as const } : undefined);
  const [x, setX] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const at = (cx: number) => {
    const r = box.current!.getBoundingClientRect();
    setX(Math.min(100, Math.max(0, ((cx - r.left) / r.width) * 100)));
  };
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const f = (now: number) => {
        if (drag.current) return;
        const t = Math.min(1, (now - t0) / 2000);
        setX(50 + Math.sin(t * Math.PI * 2) * 30 * (1 - t));
        if (t < 1) raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
    }, { threshold: 0.7 });
    io.observe(box.current!);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <figure className={`${styles.fig} rv`}>
      <div
        ref={box}
        className={styles.cmpStage}
        style={{ aspectRatio: cadre ? `${cadre.w} / ${cadre.h}` : `${projet.w} / ${projet.h}`, ['--x' as string]: `${x}%` }}
        onPointerDown={(e) => { drag.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); at(e.clientX); }}
        onPointerMove={(e) => drag.current && at(e.clientX)}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={projet.src} alt={projet.legende} draggable={false} loading="lazy" style={cadre && place(cadre.b)} />
        {cadre ? (
          <span className={`${styles.cmpCalque} ${styles.cmpTop}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={existant.src} alt={existant.legende} draggable={false} loading="lazy" style={place(cadre.a)} />
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.cmpTop} src={existant.src} alt={existant.legende} draggable={false} loading="lazy" />
        )}
        <span className={styles.cmpLine} aria-hidden="true"><i>↔</i></span>
        <span className={`${styles.cmpLab} ${styles.cmpLabG}`}>{labels.existant}</span>
        <span className={`${styles.cmpLab} ${styles.cmpLabD}`}>{labels.projet}</span>
        <input className={styles.cmpRange} type="range" min={0} max={100} value={Math.round(x)} onChange={(e) => setX(+e.target.value)} aria-label={`${titre} : ${labels.glisser}`} />
      </div>
      <figcaption className={styles.cap}>{titre}{credit && <span className={styles.credit}>{credit}</span>}</figcaption>
    </figure>
  );
}
