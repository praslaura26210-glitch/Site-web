import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { couverture, TOILES } from './ProjetsGrille';
import styles from './home.module.css';

/** La hauteur et l'épaisseur de chaque livre (px) : pas tous pareils, comme sur une vraie étagère. */
const FORMATS = [[318, 54], [292, 44], [336, 60], [304, 48], [284, 56], [326, 46]];

/**
 * Accueil : la collection, une étagère. Le dessin du couloir, encadré, est posé contre le mur ; les projets
 * sont rangés à côté, debout, dos toilés de couleur. Au survol un livre sort de l'étagère et se tourne : on
 * voit sa couverture. Au clic il s'ouvre (page du livre). Un lien mène aussi à la liste des projets.
 */
export default function Collection({ projets, lang, voir }: { projets: Projet[]; lang: Lang; voir: string }) {
  return (
    <div className={styles.col}>
      <div className={styles.biblio}>
        <div className={styles.bibRang}>
          <figure className={styles.bibCadre} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/site/dessin-couverture-1000.webp" alt="" loading="lazy" />
          </figure>
          <ul className={styles.bibLivres}>
            {projets.map((p, i) => {
              const { img, pos } = couverture(p);
              const [h, e] = FORMATS[i % FORMATS.length];
              const toile = TOILES[i % TOILES.length];
              return (
                <li key={p.slug} className={styles.bibLivre} style={{ ['--h' as string]: `${h}px`, ['--e' as string]: `${e}px`, ['--toile' as string]: toile.fond, ['--toileEncre' as string]: toile.encre }}>
                  <span className={styles.bibCouv} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.srcSmall} alt="" loading="lazy" style={{ objectPosition: pos || '50% 50%' }} />
                  </span>
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
      </div>
      <p className={styles.colBas}><Link href={`/${lang}/projets/`} className={styles.colBouton}>{voir}</Link></p>
    </div>
  );
}
