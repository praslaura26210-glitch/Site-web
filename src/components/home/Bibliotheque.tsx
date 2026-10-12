import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { couverture } from './ProjetsGrille';
import styles from './home.module.css';

/** Teinte du papier de chaque livre (tranche et bandeau), prise dans la palette du site. */
const TEINTES = ['#EDE7DF', '#2B211C', '#A46B57', '#E2D8CC', '#5E5049', '#D7CFC4'];

/**
 * Page Projets : la bibliothèque. Chaque projet est un livre posé de face, avec son épaisseur ;
 * au survol il pivote un peu et se soulève ; un clic l'ouvre en mini-magazine qu'on feuillette
 * (experience/livres.ts). Sans JavaScript, le livre mène à la page du projet.
 */
export default function Bibliotheque({ projets, lang, ouvrir }: { projets: Projet[]; lang: Lang; ouvrir: string }) {
  return (
    <ul className={styles.etagere} data-etagere>
      {projets.map((p, i) => {
        const { img, pos } = couverture(p);
        const teinte = TEINTES[i % TEINTES.length];
        const sombre = ['#2B211C', '#A46B57', '#5E5049'].includes(teinte);
        return (
          <li key={p.slug} className={`${styles.livreLi} rv`}>
            <a href={`/${lang}/projets/${p.slug}/`} className={styles.livre} data-livre={p.slug} data-xp-libre="" aria-label={`${ouvrir} : ${p.titre}`} style={{ ['--teinte' as string]: teinte, ['--encreLivre' as string]: sombre ? '#FFFFFF' : '#2B211C' }}>
              <span className={styles.livreObjet}>
                <span className={styles.livreTranche} aria-hidden="true"><span>{p.titre}</span></span>
                <span className={styles.livreCouv}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.srcSmall} alt="" width={img.w} height={img.h} loading={i < 3 ? 'eager' : 'lazy'} style={pos ? { objectPosition: pos } : undefined} />
                  <span className={styles.livreBandeau}>
                    <span className={styles.livreN}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.livreT}>{p.titre}</span>
                    <span className={styles.livreA}>{[p.lieu, p.annee].filter(Boolean).join(' · ')}</span>
                  </span>
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
