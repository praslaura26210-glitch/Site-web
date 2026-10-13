import type { Lang } from '@/i18n';
import { ECLATEES } from '@/lib/eclatees';
import { tr } from '@/lib/tr';
import styles from './project.module.css';

/**
 * L'axonométrie éclatée, en calques : d'abord la structure rassemblée ; un clic sur le dessin et les pièces se
 * séparent une à une, de bas en haut, puis les pointillés de rappel apparaissent. Un autre clic les rassemble.
 */
export default function Eclatee({ slug, lang }: { slug: string; lang: Lang }) {
  const e = ECLATEES[slug];
  if (!e) return null;
  const L = tr(lang, {
    fr: { eclater: 'Cliquez sur le dessin : la structure se sépare', rassembler: 'Cliquez à nouveau pour la rassembler' },
    en: { eclater: 'Click the drawing: the structure comes apart', rassembler: 'Click again to put it back together' },
    it: { eclater: 'Cliccate sul disegno: la struttura si separa', rassembler: 'Cliccate di nuovo per ricomporla' },
  });
  const n = Math.max(...e.calques.map((c) => c.o));
  return (
    <figure className={`${styles.ecl} rv`} data-portrait={e.h > e.w || undefined}>
      <button type="button" className={styles.eclScene} data-retourne="" aria-pressed="false" aria-label={`${e.legende[lang]} — ${L.eclater}`} style={{ aspectRatio: `${e.w} / ${e.h}`, ['--ratio' as string]: e.w / e.h }}>
        {e.calques.map((c) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={c.nom} src={`/media/${slug}/eclatee/${c.nom}.webp`} alt="" draggable={false} loading="lazy" data-calque={c.nom} data-fixe={c.fixe || undefined}
            style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, ['--dy' as string]: c.dy, ['--o' as string]: c.o, ['--r' as string]: n - c.o }} />
        ))}
      </button>
      <figcaption className={styles.eclLegende}>
        <span>{e.legende[lang]}</span>
        <span className={styles.eclAide}><i aria-hidden="true" /><span data-etat="rassemble">{L.eclater}</span><span data-etat="eclate">{L.rassembler}</span></span>
      </figcaption>
    </figure>
  );
}
