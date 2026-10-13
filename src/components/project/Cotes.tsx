import type { Lang } from '@/i18n';
import type { Media } from '@/lib/media';
import { CHIFFRES } from '@/lib/sequences';
import styles from './project.module.css';

/** y en % de la hauteur du dessin → unités du viewBox (le dessin fait 100 de large, 130 de haut). */
const Y = (p: number) => +(p * 1.3006).toFixed(2);

/**
 * Escalier suspendu, la conception : l'axonométrie reste à l'écran pendant qu'on lit les chiffres à côté.
 * Chaque chiffre, quand il passe au milieu de l'écran, éclaire la partie du dessin qu'il concerne : les deux
 * niveaux pour la hauteur, le limon, l'angle au pied de l'escalier, le garde-corps du palier
 * (experience/anim.ts pose data-etape). Les tracés sont des repères posés sur le dessin, pas des cotes mesurées.
 */
export default function Cotes({ slug, m, lang }: { slug: string; m: Media; lang: Lang }) {
  const chiffres = CHIFFRES[slug] || [];
  return (
    <div className={styles.cotes} data-etapes="" data-etape="0">
      <figure className={styles.cotesFig}>
        <div className={styles.cotesDessin} style={{ aspectRatio: `${m.w} / ${m.h}`, ['--r' as string]: m.w / m.h }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.src} alt={m.legende} loading="lazy" />
          <span className={styles.cotesSpot} aria-hidden="true" />
          <svg viewBox="0 0 100 130.06" aria-hidden="true">
            {/* 0 : les deux niveaux */}
            <g data-montre="0">
              <path d={`M1 ${Y(91)} H10`} /><path d={`M0 ${Y(91) - 2.4} l1.6 2.4 l1.6 -2.4 z`} className={styles.cotesPlein} />
              <text x="0" y={Y(91) + 4.2}>±0,00</text>
              <path d={`M45 ${Y(22.4)} H57.5`} /><path d={`M45 ${Y(22.4) - 2.4} l1.6 2.4 l1.6 -2.4 z`} className={styles.cotesPlein} />
              <text x="45" y={Y(22.4) - 3.4}>+2,93</text>
            </g>
            {/* 1 : le limon, de bout en bout */}
            <g data-montre="1">
              <path d={`M5 ${Y(88.5)} L61 ${Y(25.5)}`} pathLength={1} className={styles.cotesTrait} />
            </g>
            {/* 2 : l'angle au pied */}
            <g data-montre="2">
              <path d={`M5 ${Y(88.5)} H22`} strokeDasharray="1 1" />
              <path d={`M15 ${Y(88.5)} A10 10 0 0 0 ${(5 + 10 * Math.cos(0.991)).toFixed(2)} ${(Y(88.5) - 10 * Math.sin(0.991)).toFixed(2)}`} pathLength={1} className={styles.cotesTrait} />
              <text x="16.5" y={Y(88.5) - 4}>38,5°</text>
            </g>
            {/* 3 : le garde-corps du palier */}
            <g data-montre="3">
              <path d={`M76.2 ${Y(3.6)} L93.4 ${Y(12.8)} V${Y(28)}`} pathLength={1} className={styles.cotesTrait} />
            </g>
          </svg>
        </div>
        <figcaption>{m.legende}</figcaption>
      </figure>
      <ol className={styles.cotesEtapes}>
        {chiffres.map((x, i) => (
          <li key={x.label.fr} data-etape={i}>
            <span className={styles.cotesN}>{String(i + 1).padStart(2, '0')} / {String(chiffres.length).padStart(2, '0')}</span>
            <b>{x.valeur[lang]}</b>
            <span>{x.label[lang]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
