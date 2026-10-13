import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { couverture, TOILES } from './ProjetsGrille';
import styles from './home.module.css';

/** La hauteur et l'épaisseur de chaque livre (px) : pas tous pareils, comme sur une vraie étagère. */
const FORMATS = [[318, 54], [292, 44], [336, 60], [304, 48], [284, 56], [326, 46]];

/**
 * Accueil : la collection, une étagère. À gauche, un livre présenté de face, comme en librairie ; à droite,
 * les autres rangés debout, dos toilés de couleur. Au survol d'un dos, le livre monte un peu et c'est lui
 * qu'on voit de face (les livres ne se recouvrent jamais : on passe de l'un à l'autre sans détour).
 * Un clic ouvre le livre (page du livre). Un lien mène aussi à la liste des projets.
 */
export default function Collection({ projets, lang, voir }: { projets: Projet[]; lang: Lang; voir: string }) {
  return (
    <div className={styles.col}>
      <div className={styles.biblio} data-etagere="" data-choix="0">
        <div className={styles.bibRang}>
          {/* le livre présenté de face : un par projet, superposés ; seul celui qu'on survole se montre */}
          <div className={styles.bibPresentoir}>
            {projets.map((p, i) => {
              const { img, pos } = couverture(p);
              return (
                <Link key={p.slug} href={`/${lang}/livres/${p.slug}/`} className={styles.bibFace} data-i={i} tabIndex={-1} aria-hidden="true" style={{ ['--toile' as string]: TOILES[i % TOILES.length].fond }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.srcSmall} alt="" loading="lazy" style={{ objectPosition: pos || '50% 50%' }} />
                </Link>
              );
            })}
          </div>
          <ul className={styles.bibLivres}>
            {projets.map((p, i) => {
              const [h, e] = FORMATS[i % FORMATS.length];
              const toile = TOILES[i % TOILES.length];
              return (
                <li key={p.slug} className={styles.bibLivre} data-i={i} style={{ ['--h' as string]: `${h}px`, ['--e' as string]: `${e}px`, ['--toile' as string]: toile.fond, ['--toileEncre' as string]: toile.encre }}>
                  <Link className={styles.bibDos} href={`/${lang}/livres/${p.slug}/`} aria-label={p.titre}>
                    <span className={styles.bibFilets} aria-hidden="true" />
                    <span className={styles.bibT}>{p.titre}</span>
                    <span className={styles.bibN}>{String(i + 1).padStart(2, '0')}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <span className={styles.bibSerre} aria-hidden="true" />
        </div>
        <span className={styles.bibPlanche} aria-hidden="true" />
        {/* sous l'étagère : le titre du livre qu'on regarde */}
        <div className={styles.bibLegendes} aria-hidden="true">
          {projets.map((p, i) => (
            <p key={p.slug} className={styles.bibLegende} data-i={i}><span>N° {String(i + 1).padStart(2, '0')}</span>{p.titre}<em>{[p.programme, p.annee].filter(Boolean).join(' · ')}</em></p>
          ))}
        </div>
      </div>
      <p className={styles.colBas}><Link href={`/${lang}/projets/`} className={styles.colBouton}>{voir}</Link></p>
    </div>
  );
}
