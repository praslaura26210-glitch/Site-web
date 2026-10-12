import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { couverture } from './ProjetsGrille';
import styles from './home.module.css';

/** Inclinaison de chaque magazine posé, un peu au hasard. */
const PENTES = [-2.5, 1.5, -1, 2, -1.8, 1];

/**
 * Page Projets : la collection. Au fond, la boîte en carton où on range les magazines, avec le dessin du
 * couloir imprimé dessus ; devant, les projets, tous visibles, comme des magazines sortis de la boîte et posés.
 * Un clic sur un magazine ouvre la page du projet (et son livre).
 */
export default function Collection({ projets, lang, titre }: { projets: Projet[]; lang: Lang; titre: string }) {
  const dedans = projets.slice(0, 3).map((p) => couverture(p));
  return (
    <div className={styles.coll}>
      <div className={styles.collFond} aria-hidden="true">
        <div className={styles.boite3d}>
          <span className={`${styles.bxFace} ${styles.bxFond}`} />
          <span className={`${styles.bxFace} ${styles.bxBas}`} />
          <span className={`${styles.bxFace} ${styles.bxGauche}`} />
          {/* trois magazines rangés, qui dépassent de la boîte */}
          {dedans.map(({ img, pos }, i) => (
            <span key={img.src} className={styles.bxMag} style={{ ['--i' as string]: i }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.srcSmall} alt="" loading="lazy" style={pos ? { objectPosition: pos } : undefined} />
            </span>
          ))}
          <span className={`${styles.bxFace} ${styles.bxDroite}`} />
          <span className={`${styles.bxFace} ${styles.bxAvant}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/site/dessin-couverture-1000.webp" alt="" loading="lazy" />
            <span className={styles.bxEtiquette}><b>Laura Pras</b>{titre}</span>
          </span>
        </div>
      </div>
      <ul className={styles.collMags}>
        {projets.map((p, i) => {
          const { img, pos } = couverture(p);
          return (
            <li key={p.slug} className={styles.collLi} style={{ ['--r' as string]: `${PENTES[i % PENTES.length]}deg`, ['--k' as string]: i }}>
              <Link href={`/${lang}/projets/${p.slug}/`} className={styles.collMag}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.srcSmall} alt="" width={img.w} height={img.h} loading={i < 3 ? 'eager' : 'lazy'} style={pos ? { objectPosition: pos } : undefined} />
                <span className={styles.collN}>N° {String(i + 1).padStart(2, '0')}{p.annee ? ` — ${p.annee}` : ''}</span>
                <span className={styles.collT}>{p.titre}</span>
                <span className={styles.collP}>{p.programme}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
