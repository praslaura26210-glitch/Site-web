'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Media } from '@/lib/media';
import PlanViewer from './PlanViewer';
import styles from './project.module.css';

type Labels = { precedent: string; suivant: string; agrandir: string; fermer: string; hint: string; zoomIn: string; zoomOut: string; reset: string };

/**
 * Visionneuse : un grand dessin à la fois, sur toute la largeur. Flèches (ou clavier, ou glissé du doigt)
 * pour passer au suivant ; la liste des dessins dessous ; un clic l'ouvre en grand avec zoom.
 */
export default function Visionneuse({ items, labels, credit, aside }: { items: Media[]; labels: Labels; credit?: string; aside?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  const x0 = useRef<number | null>(null);
  const n = items.length;
  const go = useCallback((k: number) => setI((v) => (v + k + n) % n), [n]);
  const m = items[i];

  useEffect(() => {
    if (!open) return;
    dlg.current?.showModal();
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);
  useEffect(() => {
    [items[(i + 1) % n], items[(i - 1 + n) % n]].forEach((x) => { const im = new Image(); im.src = x.src; });
  }, [i, items, n]);

  const vectoriel = m.kind === 'plan' && m.src === m.svg;
  return (
    <div className={`${styles.vis} rv`} data-aside={aside ? '' : undefined} data-items={JSON.stringify(items.map((x) => ({ src: x.src, svg: x.svg, full: x.full, w: x.w, h: x.h, legende: x.legende, dessin: x.kind === 'plan' || !!x.scan, vect: x.kind === 'plan' && x.src === x.svg })))} data-credit={credit}>
      <div
        className={styles.visScene}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}
        onPointerDown={(e) => (x0.current = e.clientX)}
        onPointerUp={(e) => {
          if (x0.current == null) return;
          const dx = e.clientX - x0.current;
          x0.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          else setOpen(true);
        }}
        aria-label={`${m.legende}. ${labels.agrandir}`}
        role="button"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={m.src} className={m.kind === 'plan' || m.scan ? styles.visDessin : undefined} src={m.src} alt={m.legende} width={Math.round(m.w)} height={Math.round(m.h)} draggable={false} />
      </div>
      {n > 1 && (
        <>
          <button type="button" className={`${styles.visNav} ${styles.visPrev}`} onClick={() => go(-1)} aria-label={labels.precedent}>
            <svg viewBox="0 0 24 12" width="22" height="11" aria-hidden="true"><path d="M24 6H2M7 1 2 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
          </button>
          <button type="button" className={`${styles.visNav} ${styles.visNext}`} onClick={() => go(1)} aria-label={labels.suivant}>
            <svg viewBox="0 0 24 12" width="22" height="11" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
          </button>
        </>
      )}
      <div className={styles.visBas}>
        <span className={styles.visCompte}>{String(i + 1).padStart(2, '0')}<span> / {String(n).padStart(2, '0')}</span></span>
        <ol className={styles.visListe}>
          {items.map((x, k) => (
            <li key={x.src}><button type="button" aria-current={k === i || undefined} onClick={() => setI(k)}>{x.legende}</button></li>
          ))}
        </ol>
      </div>
      {aside && <div className={styles.visAside}>{aside}</div>}
      {open && (
        <dialog ref={dlg} className={styles.lightbox} onClose={() => setOpen(false)} aria-label={m.legende}>
          <button type="button" className={styles.lbFermer} onClick={() => dlg.current?.close()} aria-label={labels.fermer} autoFocus>✕</button>
          <PlanViewer
            className={styles.lbViewer}
            plans={[{ id: m.src, label: m.legende, svg: m.svg, preview: vectoriel ? undefined : m.src, full: m.full, ratio: m.w / m.h }]}
            labels={{ hint: labels.hint, zoomIn: labels.zoomIn, zoomOut: labels.zoomOut, reset: labels.reset }}
          />
          {credit && <p className={styles.lbCredit}>{credit}</p>}
        </dialog>
      )}
    </div>
  );
}
