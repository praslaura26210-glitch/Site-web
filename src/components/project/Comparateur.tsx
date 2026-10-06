'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './project.module.css';

type Img = { src: string; w: number; h: number; legende: string };
export type Paire = { titre: string; existant: Img; projet: Img };

/**
 * Existant / projet : le projet est dessous, l'existant dessus ; on fait glisser le trait
 * pour découvrir l'un ou l'autre. Au clavier : flèches gauche et droite.
 */
export default function Comparateur({ paires, labels }: { paires: Paire[]; labels: { existant: string; projet: string; glisser: string } }) {
  const [cur, setCur] = useState(0);
  const [x, setX] = useState(50);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const vu = useRef(false);
  const p = paires[cur];

  // au premier passage, le trait balaie une fois pour montrer qu'on peut le déplacer
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = stage.current!;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || vu.current) return;
      vu.current = true;
      io.disconnect();
      const t0 = performance.now();
      const f = (now: number) => {
        if (drag.current) return;
        const t = Math.min(1, (now - t0) / 2200);
        setX(50 + Math.sin(t * Math.PI * 2) * 32 * (1 - t));
        if (t < 1) raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const at = (clientX: number) => {
    const r = stage.current!.getBoundingClientRect();
    setX(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <figure className={`${styles.cmp} rv`}>
      {paires.length > 1 && (
        <div className={styles.cmpTabs} role="tablist" aria-label={labels.glisser}>
          {paires.map((q, i) => (
            <button key={q.titre} type="button" role="tab" aria-selected={i === cur} onClick={() => setCur(i)}>{q.titre}</button>
          ))}
        </div>
      )}
      <div
        ref={stage}
        className={styles.cmpStage}
        style={{ aspectRatio: `${p.projet.w} / ${p.projet.h}`, ['--x' as string]: `${x}%` }}
        onPointerDown={(e) => { drag.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); at(e.clientX); }}
        onPointerMove={(e) => drag.current && at(e.clientX)}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.projet.src} alt={p.projet.legende} draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.cmpTop} src={p.existant.src} alt={p.existant.legende} draggable={false} />
        <span className={styles.cmpLine} aria-hidden="true"><i>↔</i></span>
        <span className={`${styles.cmpLab} ${styles.cmpLabG}`}>{labels.existant}</span>
        <span className={`${styles.cmpLab} ${styles.cmpLabD}`}>{labels.projet}</span>
        <input
          className={styles.cmpRange}
          type="range"
          min={0}
          max={100}
          value={Math.round(x)}
          onChange={(e) => setX(+e.target.value)}
          aria-label={`${p.titre} : ${labels.glisser}`}
        />
      </div>
      <figcaption className={styles.cap}>{p.titre}</figcaption>
    </figure>
  );
}
