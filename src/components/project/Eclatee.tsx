import type { Lang } from '@/i18n';
import { ECLATEES } from '@/lib/eclatees';
import { tr } from '@/lib/tr';
import styles from './project.module.css';

/**
 * L'axonométrie éclatée, en calques : d'abord la structure rassemblée, en grand ; un clic et le cadre s'ouvre
 * sur le dessin entier, les pièces se séparent une à une et vont prendre leur place, puis les pointillés de
 * rappel apparaissent. Un autre clic rassemble tout (le clic passe par data-retourne, experience/index.ts).
 */
export default function Eclatee({ slug, lang }: { slug: string; lang: Lang }) {
  const e = ECLATEES[slug];
  if (!e) return null;
  const L = tr(lang, {
    fr: { eclater: 'Cliquez sur la structure : elle se décompose', rassembler: 'Cliquez à nouveau pour la rassembler' },
    en: { eclater: 'Click the structure: it comes apart', rassembler: 'Click again to put it back together' },
    it: { eclater: 'Cliccate sulla struttura: si scompone', rassembler: 'Cliccate di nuovo per ricomporla' },
  });
  const n = Math.max(...e.calques.map((c) => c.o));
  const he = (e.h / e.w) * 100;
  const v = (k: string, x: number | string) => ({ [`--${k}`]: x }) as Record<string, number | string>;
  return (
    <figure className={`${styles.ecl} rv`} data-portrait={e.h > e.w || undefined} style={{ ...v('ratio', e.w / e.h), ...v('ha', e.cam.h), ...v('he', he), ...v('s', e.cam.s), ...v('tx', e.cam.tx), ...v('ty', e.cam.ty) }}>
      <button type="button" className={styles.eclScene} data-retourne="" aria-pressed="false" aria-label={`${e.legende[lang]} — ${L.eclater}`}>
        <span className={styles.eclMonde}>
          {e.calques.map((c) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={c.nom} src={`/media/${slug}/eclatee/${c.nom}.webp`} alt="" draggable={false} loading="lazy" data-calque={c.nom} data-fixe={c.fixe || undefined} data-cache={c.cache || undefined}
              style={{ left: `${c.x}%`, top: `${(c.y * e.h) / e.w}cqw`, width: `${c.w}%`, ...v('dx', c.dx), ...v('dy', c.dy), ...v('o', c.o), ...v('r', n - c.o) }} />
          ))}
        </span>
      </button>
      <figcaption className={styles.eclLegende}>
        <span>{e.legende[lang]}</span>
        <span className={styles.eclAide}><i aria-hidden="true" /><span data-etat="rassemble">{L.eclater}</span><span data-etat="eclate">{L.rassembler}</span></span>
      </figcaption>
    </figure>
  );
}
