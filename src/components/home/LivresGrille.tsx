import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { couverture, TOILES } from './ProjetsGrille';
import styles from './home.module.css';

/**
 * Projets : les six projets en livres, trois par rangée, sur le blanc de la page. On voit la couverture
 * (la première image du projet) et le dos toilé ; au survol le livre se tourne vers nous et s'entrouvre
 * sur sa page de titre. Le titre est écrit dessous ; un clic ouvre la page du projet.
 */
export default function LivresGrille({ projets, lang }: { projets: Projet[]; lang: Lang }) {
  return (
    <ul className={styles.bks}>
      {projets.map((p, i) => {
        const { img, pos } = couverture(p);
        const toile = TOILES[i % TOILES.length];
        const n = String(i + 1).padStart(2, '0');
        return (
          <li key={p.slug} className={`${styles.bk} rv`} style={{ ['--i' as string]: i }}>
            <Link href={`/${lang}/projets/${p.slug}/`} className={styles.bkLien}>
              <span className={styles.bkScene} aria-hidden="true">
                <span className={styles.bkVol} style={{ ['--toile' as string]: toile.fond, ['--toileEncre' as string]: toile.encre }}>
                  <span className={styles.bkDos}><span>N° {n}</span></span>
                  <span className={styles.bkPage}><em>N° {n}</em><b>{p.titre}</b><i>{p.annee}</i></span>
                  <span className={styles.bkCouv}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.srcSmall} alt="" loading="lazy" style={{ objectPosition: pos || '50% 50%' }} />
                    <span className={styles.bkCouvDos} />
                  </span>
                </span>
                <span className={styles.bkOmbre} />
              </span>
              <span className={styles.bkT}>{p.titre}</span>
              <span className={styles.bkM}>{[p.programme, p.annee].filter(Boolean).join(' · ')}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
