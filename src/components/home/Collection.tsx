import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { couverture } from './ProjetsGrille';
import styles from './home.module.css';

/** De combien chaque livre dépasse de l'étui (px), comme sur la photo de Laura : pas tous pareil. */
const SORTIS = [34, 20, 30, 14, 26, 8];

/**
 * Accueil : la collection. Un étui blanc, vu en axonométrie, avec le dessin du couloir sur le côté ;
 * les projets y sont rangés comme des livres, debout, plus ou moins sortis. Au survol un livre sort,
 * au clic il s'ouvre (page du livre). Un lien mène aussi à la liste des projets.
 */
export default function Collection({ projets, lang, voir }: { projets: Projet[]; lang: Lang; voir: string }) {
  const ep = 44, jeu = 3, pad = 10;
  const W = projets.length * (ep + jeu) - jeu + pad * 2;
  return (
    <div className={styles.col}>
      <div className={styles.etuiScene}>
        <div className={styles.etui} style={{ ['--W' as string]: `${W}px` }}>
          <span className={`${styles.etuiF} ${styles.etuiSol}`} aria-hidden="true" />
          <span className={`${styles.etuiF} ${styles.etuiFond}`} aria-hidden="true" />
          <span className={`${styles.etuiF} ${styles.etuiBas}`} aria-hidden="true" />
          <span className={`${styles.etuiF} ${styles.etuiGauche}`} aria-hidden="true" />
          <ul className={styles.livres}>
            {projets.map((p, i) => {
              const { img, pos } = couverture(p);
              return (
                <li key={p.slug} className={styles.livre} style={{ ['--x' as string]: `${pad + i * (ep + jeu)}px`, ['--t' as string]: `${ep}px`, ['--sort0' as string]: `${SORTIS[i % SORTIS.length]}px`, ['--img' as string]: `url(${img.srcSmall})`, ['--pos' as string]: pos || '50% 50%' }}>
                  <span className={`${styles.livreF} ${styles.livreHaut}`} aria-hidden="true" />
                  <span className={`${styles.livreF} ${styles.livreCouv} ${styles.livreCouvG}`} aria-hidden="true" />
                  <span className={`${styles.livreF} ${styles.livreCouv} ${styles.livreCouvD}`} aria-hidden="true" />
                  <Link className={styles.livreDos} href={`/${lang}/livres/${p.slug}/`} aria-label={p.titre}>
                    <span className={styles.livreEtiq}><span className={styles.livreT}>{p.titre}</span></span>
                    <span className={styles.livreN}>N° {String(i + 1).padStart(2, '0')}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <span className={`${styles.etuiF} ${styles.etuiHaut}`} aria-hidden="true" />
          {/* le grand côté de l'étui, avec le dessin du couloir */}
          <span className={`${styles.etuiF} ${styles.etuiDroite}`} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/site/dessin-couverture-1000.webp" alt="" loading="lazy" />
          </span>
          <span className={`${styles.etuiF} ${styles.etuiBord}`} aria-hidden="true" />
        </div>
      </div>
      <p className={styles.colBas}><Link href={`/${lang}/projets/`} className={styles.colBouton}>{voir}</Link></p>
    </div>
  );
}
