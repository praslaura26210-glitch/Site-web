import fs from 'node:fs';
import path from 'node:path';
import type { Media } from '@/lib/media';
import Planche, { type Labels } from './Planche';
import styles from './project.module.css';

/**
 * Un croquis qui se dessine : ses grands traits (relevés sur le croquis, <nom>-traits.json) se tracent un à un
 * quand il arrive à l'écran, puis le croquis lui-même apparaît dessous (experience/anim.ts pose data-vu ;
 * un clic rejoue). À côté, une autre image (le plan masse).
 */
export default function Trace({ slug, nom, m, avec, labels, credit, rejouer }: { slug: string; nom: string; m: Media; avec?: Media; labels: Labels; credit?: string; rejouer: string }) {
  const f = path.join(process.cwd(), 'content/projets', slug, `${nom}-traits.json`);
  const t = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')) as { w: number; h: number; lines: number[][] }) : null;
  return (
    <div className={styles.trace} style={avec ? { gridTemplateColumns: `${m.w / m.h}fr ${avec.w / avec.h}fr`, ['--s' as string]: m.w / m.h + avec.w / avec.h } : undefined}>
      <figure className={styles.traceCroquis}>
        <button type="button" className={styles.traceDessin} data-construire="" aria-label={`${m.legende} — ${rejouer}`} style={{ aspectRatio: `${m.w} / ${m.h}`, width: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.srcSmall || m.src} alt="" loading="lazy" />
          {t && (
            <svg viewBox={`0 0 ${t.w} ${t.h}`} aria-hidden="true" preserveAspectRatio="none">
              {t.lines.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} style={{ ['--k' as string]: i }} />)}
            </svg>
          )}
        </button>
        <figcaption>{m.legende}</figcaption>
      </figure>
      {avec && <div className={styles.traceAvec}><Planche m={avec} sizes="(max-width: 900px) 100vw, 45vw" labels={labels} credit={credit} /></div>}
    </div>
  );
}
