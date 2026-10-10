import type { Media } from '@/lib/media';
import styles from './project.module.css';

export type Labels = { agrandir: string; fermer: string; hint: string; zoomIn: string; zoomOut: string; reset: string };

/**
 * Une image ou un plan de la page projet. Un clic ouvre la visionneuse plein écran
 * (experience/lightbox.ts) : zoom, et toutes les images du projet à parcourir.
 */
export default function Planche({ m, sizes, labels, className, caption = true, eager = false, credit, pos, ancre }: { m: Media; sizes: string; labels: Labels; className?: string; caption?: boolean; eager?: boolean; credit?: string; pos?: string; ancre?: string }) {
  const vectoriel = m.kind === 'plan' && m.src === m.svg;
  const zoom = { id: ancre, legende: m.legende, svg: m.svg, preview: vectoriel ? undefined : m.src, full: m.full, ratio: m.w / m.h, credit, thumb: m.srcSmall || m.src };
  return (
    <figure id={ancre} className={`${styles.fig} ${m.kind === 'plan' || m.scan ? styles.dessin : ''} ${className || ''} rv`}>
      <button type="button" className={styles.figBtn} aria-label={`${labels.agrandir} : ${m.legende}`} data-zoom={JSON.stringify(zoom)}>
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
          style={pos ? { objectPosition: pos } : undefined}
        />
      </button>
      {caption && <figcaption className={styles.cap}>{m.legende}</figcaption>}
    </figure>
  );
}
