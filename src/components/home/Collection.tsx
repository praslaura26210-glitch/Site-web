import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { couverture } from './ProjetsGrille';
import styles from './home.module.css';

/** L'éventail : l'angle de chaque livre (degrés), du premier au dernier. */
const ANGLES = [-48, -29, -10, 9, 28, 47];

/**
 * Accueil : la collection. Sur la table, la boîte en carton, haute, faite pour ranger les livres debout
 * (comme l'étui de la photo de Laura), avec le dessin du couloir et son nom sur le côté ; elle est vide,
 * parce que les livres sont sortis : ils sont posés devant, en éventail. Un clic sur un livre l'ouvre.
 */
export default function Collection({ projets, lang, titre, aide }: { projets: Projet[]; lang: Lang; titre: string; aide: string }) {
  return (
    <div className={styles.col}>
      <div className={styles.colScene}>
        <div className={styles.colTable}>
          {/* la boîte, vide, au fond de la table */}
          <div className={styles.bx} aria-hidden="true">
            <span className={`${styles.bxF} ${styles.bxSol}`} />
            <span className={`${styles.bxF} ${styles.bxDos}`} />
            <span className={`${styles.bxF} ${styles.bxInG}`} />
            <span className={`${styles.bxF} ${styles.bxInD}`} />
            <span className={`${styles.bxF} ${styles.bxInBas}`} />
            <span className={`${styles.bxF} ${styles.bxG}`} />
            <span className={`${styles.bxF} ${styles.bxD}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/site/dessin-couverture-1000.webp" alt="" loading="lazy" />
              <span className={styles.bxNom}>Laura Pras</span>
              <span className={styles.bxSous}>{titre}</span>
            </span>
            <span className={`${styles.bxF} ${styles.bxHaut}`} />
            <span className={`${styles.bxF} ${styles.bxBord}`} />
          </div>
          {/* les livres, en éventail devant */}
          {projets.map((p, i) => {
            const { img, pos } = couverture(p);
            return (
              <Link key={p.slug} href={`/${lang}/livres/${p.slug}/`} className={styles.bk} style={{ ['--a' as string]: `${ANGLES[i % ANGLES.length]}deg`, ['--i' as string]: i }} aria-label={p.titre}>
                <span className={styles.bkOmbre} aria-hidden="true" />
                <span className={`${styles.bkPages} ${styles.bkP0}`} aria-hidden="true" />
                <span className={`${styles.bkPages} ${styles.bkP1}`} aria-hidden="true" />
                <span className={`${styles.bkPages} ${styles.bkP2}`} aria-hidden="true" />
                <span className={styles.bkCouv}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.srcSmall} alt="" loading="lazy" style={pos ? { objectPosition: pos } : undefined} />
                  <span className={styles.bkN}>N° {String(i + 1).padStart(2, '0')}{p.annee ? ` — ${p.annee}` : ''}</span>
                  <span className={styles.bkT}>{p.titre}</span>
                  <span className={styles.bkNom}>Laura Pras</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <p className={styles.colAide}>{aide}</p>
    </div>
  );
}
