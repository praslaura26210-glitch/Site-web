import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import Logo from '@/components/chrome/Logo';
import { couverture } from './ProjetsGrille';
import styles from './home.module.css';

/** Pose de chaque magazine dans la boîte : inclinaison (degrés) et hauteur (px), un peu au hasard. */
const POSES = [[-5, 10], [3, -6], [-2, 18], [6, 0], [-4, 8], [2, -10]];

/**
 * Page Projets : une boîte en carton, à l'étiquette de Laura (le dessin du couloir) et à son logo,
 * qui contient les projets comme des magazines. Au survol, le magazine sort de la boîte ;
 * au clic, on ouvre la page du projet (la même que depuis l'accueil).
 */
export default function Bibliotheque({ projets, lang, titre }: { projets: Projet[]; lang: Lang; titre: string }) {
  return (
    <div className={styles.boite}>
      <div className={styles.boiteFond} aria-hidden="true" />
      <ul className={styles.mags}>
        {projets.map((p, i) => {
          const { img, pos } = couverture(p);
          const [r, dy] = POSES[i % POSES.length];
          return (
            <li key={p.slug} className={styles.magLi} style={{ ['--r' as string]: `${r}deg`, ['--dy' as string]: `${dy}px`, zIndex: i + 1 }}>
              <Link href={`/${lang}/projets/${p.slug}/`} className={styles.mag} aria-label={p.titre}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.srcSmall} alt="" width={img.w} height={img.h} loading={i < 4 ? 'eager' : 'lazy'} style={pos ? { objectPosition: pos } : undefined} />
                <span className={styles.magTete}>
                  <span className={styles.magN}>N° {String(i + 1).padStart(2, '0')}{p.annee ? ` — ${p.annee}` : ''}</span>
                  <span className={styles.magT}>{p.titre}</span>
                </span>
                <span className={styles.magPied}>{p.programme}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* la face avant de la boîte, avec le logo tamponné et l'étiquette */}
      <div className={styles.boiteFace} aria-hidden="true">
        <Logo className={styles.boiteLogo} poids={1.2} label="" />
        <span className={styles.boiteEtiquette}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/site/dessin-couverture-1000.webp" alt="" loading="lazy" />
          <span><b>Laura Pras</b>{titre}</span>
        </span>
      </div>
    </div>
  );
}
