import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { tr } from '@/lib/tr';
import { numeroCollection, rangeCollection } from '@/lib/collection';
import { TRAITS } from '@/components/chrome/Logo';
import { couverture, TOILES } from './ProjetsGrille';
import styles from './home.module.css';

/**
 * La couverture d'un livre de la collection : la photo du projet sur toute la couverture,
 * et la tranche, à gauche, à la couleur du livre (avec le titre écrit dessus).
 */
export function CouvLivre({ p, k, petit = false }: { p: Projet; k: number; petit?: boolean }) {
  const { img, pos } = couverture(p);
  const t = TOILES[k % TOILES.length];
  return (
    <span className={styles.cv} data-petit={petit || undefined} style={{ ['--toile' as string]: t.fond, ['--toileEncre' as string]: t.encre }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.srcSmall} alt="" loading="lazy" draggable={false} style={pos ? { objectPosition: pos } : undefined} />
      <span className={styles.cvDos}><span>{p.titre}</span></span>
    </span>
  );
}

/** Le dos d'un livre rangé debout dans la boîte : la tranche, son numéro et son titre. */
function Dos({ p, k }: { p: Projet; k: number }) {
  const t = TOILES[k % TOILES.length];
  return (
    <span className={styles.dos} style={{ ['--toile' as string]: t.fond, ['--toileEncre' as string]: t.encre }}>
      <i>{numeroCollection(k)}</i>
      <b>{p.titre}</b>
    </span>
  );
}

// où sont posés les livres, en vrac : centre x, haut y (en % de la scène), rotation ; puis la même chose sur téléphone
type Pose = [number, number, number, number, number, number];
const DEVANT: Pose[] = [[24, 49, -8, 27, 33, -6], [43, 59, 4, 73, 37, 6], [62, 54, -3, 28, 65, 4], [79, 44, 9, 72, 68, -7]];
const VRAC: Pose[] = [[15, 6, -7, 28, 0, -6], [39, 1, 4, 72, 7, 5], [63, 8, -3, 29, 31, 4], [86, 3, 8, 71, 38, -5], [30, 50, 5, 29, 62, -4], [58, 53, -6, 71, 69, 6]];

/**
 * La collection. `boite` (accueil) : une boîte carrée debout, le logo en blanc dessus ; les deux premiers livres
 * sont rangés dedans (on voit leur tranche dépasser), les autres sont sortis et posés en vrac devant.
 * Sans `boite` (page Projets) : les six livres posés en vrac. Un clic ouvre le livre.
 */
export default function Collection({ projets, lang, boite = false }: { projets: Projet[]; lang: Lang; boite?: boolean }) {
  const L = tr(lang, {
    fr: { ouvrir: 'Ouvrir le livre', nom: 'La collection de Laura Pras' },
    en: { ouvrir: 'Open the book', nom: 'Laura Pras’s collection' },
    it: { ouvrir: 'Apri il libro', nom: 'La collezione di Laura Pras' },
  });
  const liste = rangeCollection(projets);
  const dedans = boite ? liste.slice(0, 2) : [];
  const dehors = boite ? liste.slice(2) : liste;
  const poses = boite ? DEVANT : VRAC;
  return (
    <div className={styles.coll} data-boite={boite || undefined}>
      {boite && (
        <div className={styles.bx} aria-label={L.nom} role="group">
          {/* le fond et l'intérieur de la boîte, vus un peu d'en haut */}
          <svg className={styles.bxFond} viewBox="0 0 130 130" aria-hidden="true">
            <polygon points="0,30 30,0 130,0 100,30" className={styles.bxDedans} />
            <polygon points="30,0 130,0 130,6 30,6" className={styles.bxOmbre} />
          </svg>
          <ul className={styles.bxLivres}>
            {dedans.map((p, j) => (
              <li key={p.slug} style={{ ['--j' as string]: j }}>
                <Link href={`/${lang}/livres/${p.slug}/`} aria-label={`${p.titre} — ${L.ouvrir}`}>
                  <Dos p={p} k={j} />
                </Link>
              </li>
            ))}
          </ul>
          {/* la face avant (le logo en blanc) et le côté */}
          <svg className={styles.bxFace} viewBox="0 0 130 130" aria-hidden="true">
            <polygon points="100,30 130,0 130,100 100,130" className={styles.bxCote} />
            <rect x="0" y="30" width="100" height="100" className={styles.bxAvant} />
            <polyline points="0,30 100,30 130,0" className={styles.bxBord} />
            <g transform="translate(35.3 49) scale(.3)" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
              {TRAITS.map((t, i) => <path key={i} d={t.d} strokeWidth={t.w * 3.4} transform="translate(-12 -16)" />)}
            </g>
            <text x="50" y="97" textAnchor="middle" className={styles.bxNom}>LAURA PRAS</text>
            <text x="50" y="105" textAnchor="middle" className={styles.bxSous}>PORTFOLIO</text>
          </svg>
        </div>
      )}
      <ul className={styles.vrac}>
        {dehors.map((p, j) => {
          const k = liste.indexOf(p);
          const [x, y, r, xm, ym, rm] = poses[j];
          return (
            <li key={p.slug} className={styles.vracLivre} style={{ ['--x' as string]: `${x}%`, ['--y' as string]: `${y}%`, ['--r' as string]: `${r}deg`, ['--xm' as string]: `${xm}%`, ['--ym' as string]: `${ym}%`, ['--rm' as string]: `${rm}deg`, ['--z' as string]: Math.round(y), ['--zm' as string]: Math.round(ym), ['--k' as string]: j }}>
              <Link href={`/${lang}/livres/${p.slug}/`} className={styles.vracLien} aria-label={`${p.titre} — ${L.ouvrir}`}>
                <CouvLivre p={p} k={k} />
                <span className={styles.vracCap}><i>N° {numeroCollection(k)}</i> {p.titre}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
