'use client';
import { useEffect, useRef, useState } from 'react';
import type { Media } from '@/lib/media';
import PlanViewer from './PlanViewer';
import styles from './project.module.css';

export type Labels = { agrandir: string; fermer: string; hint: string; zoomIn: string; zoomOut: string; reset: string };

/** Une image ou un plan de la page projet. Un clic l'ouvre en grand, avec zoom (le plan reste vectoriel). */
export default function Planche({ m, sizes, labels, className, caption = true, eager = false }: { m: Media; sizes: string; labels: Labels; className?: string; caption?: boolean; eager?: boolean }) {
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    dlg.current?.showModal();
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);

  const vectoriel = m.kind === 'plan' && m.src === m.svg;
  return (
    <figure className={`${styles.fig} ${m.kind === 'plan' || m.scan ? styles.dessin : ''} ${className || ''} rv`}>
      <button type="button" className={styles.figBtn} onClick={() => setOpen(true)} aria-label={`${labels.agrandir} : ${m.legende}`} data-cursor="zoom">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={m.srcSmall || m.src}
          srcSet={m.srcSmall ? `${m.srcSmall} 1000w, ${m.src} 2000w` : undefined}
          sizes={m.srcSmall ? sizes : undefined}
          alt={m.legende}
          width={Math.round(m.w)}
          height={Math.round(m.h)}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      </button>
      {caption && <figcaption className={styles.cap}>{m.legende}</figcaption>}
      {open && (
        <dialog ref={dlg} className={styles.lightbox} onClose={() => setOpen(false)} aria-label={m.legende}>
          <div className={styles.lbBar}>
            <p>{m.legende}</p>
            <button type="button" onClick={() => dlg.current?.close()} autoFocus>{labels.fermer} ✕</button>
          </div>
          <PlanViewer
            className={styles.lbViewer}
            plans={[{ id: m.src, label: m.legende, svg: m.svg, preview: vectoriel ? undefined : m.src, full: m.full, ratio: m.w / m.h }]}
            labels={{ hint: labels.hint, zoomIn: labels.zoomIn, zoomOut: labels.zoomOut, reset: labels.reset }}
          />
        </dialog>
      )}
    </figure>
  );
}
