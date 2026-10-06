'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import PlanViewer from './PlanViewer';
import styles from './project.module.css';

export type Img = { src: string; srcSmall?: string; svg?: string; full?: string; w: number; h: number; legende: string; scan?: boolean; plan?: boolean };
export type Item = { titre: string; a: Img; b?: Img };
type Labels = { existant: string; projet: string; glisser: string; precedent: string; suivant: string; agrandir: string; fermer: string; hint: string; zoomIn: string; zoomOut: string; reset: string };

/** Existant (dessus) / projet (dessous) : on fait glisser le trait. */
function Comparer({ a, b, labels, titre }: { a: Img; b: Img; labels: Labels; titre: string }) {
  const [x, setX] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const at = (cx: number) => {
    const r = box.current!.getBoundingClientRect();
    setX(Math.min(100, Math.max(0, ((cx - r.left) / r.width) * 100)));
  };
  // un balayage, une fois, pour montrer que le trait se déplace
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
    }, { threshold: 0.6 });
    io.observe(box.current!);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div
      ref={box}
      className={styles.cmpStage}
      style={{ aspectRatio: `${b.w} / ${b.h}`, width: `min(100%, calc(var(--h) * ${(b.w / b.h).toFixed(4)}))`, ['--x' as string]: `${x}%` }}
      onPointerDown={(e) => { e.stopPropagation(); drag.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); at(e.clientX); }}
      onPointerMove={(e) => drag.current && at(e.clientX)}
      onPointerUp={(e) => { e.stopPropagation(); drag.current = false; }}
      onPointerCancel={() => (drag.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={b.src} alt={b.legende} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.cmpTop} src={a.src} alt={a.legende} draggable={false} />
      <span className={styles.cmpLine} aria-hidden="true"><i>↔</i></span>
      <span className={`${styles.cmpLab} ${styles.cmpLabG}`}>{labels.existant}</span>
      <span className={`${styles.cmpLab} ${styles.cmpLabD}`}>{labels.projet}</span>
      <input className={styles.cmpRange} type="range" min={0} max={100} value={Math.round(x)} onChange={(e) => setX(+e.target.value)} aria-label={`${titre} : ${labels.glisser}`} />
    </div>
  );
}

/**
 * Visionneuse des dessins d'un projet : un grand dessin à la fois, précédent / suivant
 * (boutons, flèches du clavier, glissé sur téléphone), la liste des dessins, et l'agrandissement avec zoom.
 */
export default function Planches({ items, labels }: { items: Item[]; labels: Labels }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  const start = useRef<number | null>(null);
  const n = items.length;
  const go = useCallback((k: number) => setI((v) => (v + k + n) % n), [n]);
  const it = items[i];
  const zoom = it.b || it.a;

  useEffect(() => {
    if (!open) return;
    dlg.current?.showModal();
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);

  // précharge les dessins voisins
  useEffect(() => {
    [items[(i + 1) % n], items[(i - 1 + n) % n]].forEach((x) => { const im = new Image(); im.src = x.a.srcSmall || x.a.src; });
  }, [i, items, n]);

  const vectoriel = zoom.plan && zoom.src === zoom.svg;
  return (
    <div
      className={`${styles.pl} rv`}
      onKeyDown={(e) => {
        if (e.target instanceof HTMLInputElement) return;
        if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
      }}
    >
      <div
        className={styles.plStage}
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerUp={(e) => {
          if (start.current == null) return;
          const dx = e.clientX - start.current;
          start.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        <div key={i} className={styles.plVue}>
          {it.b ? (
            <Comparer a={it.a} b={it.b} labels={labels} titre={it.titre} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={it.a.scan || it.a.plan ? styles.plDessin : undefined}
              src={it.a.src}
              alt={it.a.legende}
              width={Math.round(it.a.w)}
              height={Math.round(it.a.h)}
              draggable={false}
            />
          )}
        </div>
        {n > 1 && (
          <>
            <button type="button" className={`${styles.plNav} ${styles.plPrev}`} onClick={() => go(-1)} aria-label={labels.precedent}>
              <svg viewBox="0 0 24 12" width="22" height="11" aria-hidden="true"><path d="M24 6H2M7 1 2 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
            </button>
            <button type="button" className={`${styles.plNav} ${styles.plNext}`} onClick={() => go(1)} aria-label={labels.suivant}>
              <svg viewBox="0 0 24 12" width="22" height="11" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
            </button>
          </>
        )}
        <button type="button" className={styles.plZoom} onClick={() => setOpen(true)} aria-label={`${labels.agrandir} : ${it.titre}`}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M6.5 1.5h-5v5M9.5 14.5h5v-5M1.5 1.5l5 5M14.5 14.5l-5-5" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
          {labels.agrandir}
        </button>
      </div>

      <div className={styles.plBar}>
        <span className={styles.plCompte}>{String(i + 1).padStart(2, '0')} <span>/ {String(n).padStart(2, '0')}</span></span>
        <ol className={styles.plListe}>
          {items.map((x, k) => (
            <li key={k}>
              <button type="button" aria-current={k === i || undefined} onClick={() => setI(k)}>{x.titre}</button>
            </li>
          ))}
        </ol>
      </div>

      {open && (
        <dialog ref={dlg} className={styles.lightbox} onClose={() => setOpen(false)} aria-label={zoom.legende}>
          <div className={styles.lbBar}>
            <p>{zoom.legende}</p>
            <button type="button" onClick={() => dlg.current?.close()} autoFocus>{labels.fermer} ✕</button>
          </div>
          <PlanViewer
            className={styles.lbViewer}
            plans={[{ id: zoom.src, label: zoom.legende, svg: zoom.svg, preview: vectoriel ? undefined : zoom.src, full: zoom.full, ratio: zoom.w / zoom.h }]}
            labels={{ hint: labels.hint, zoomIn: labels.zoomIn, zoomOut: labels.zoomOut, reset: labels.reset }}
          />
        </dialog>
      )}
    </div>
  );
}
