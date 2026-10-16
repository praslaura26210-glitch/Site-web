import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { tr } from '@/lib/tr';
import { numeroCollection, rangeCollection } from '@/lib/collection';
import { couverture, TOILES } from './ProjetsGrille';
import styles from './home.module.css';

/**
 * La couverture à plat d'un livre de la collection (petits livres à côté du livre ouvert) :
 * la photo sur toute la couverture, la tranche à la couleur du livre.
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

/*
 * Les livres en volume (CSS 3D). Un livre fin : la couverture (la photo), la tranche à la couleur du livre
 * avec son titre, le quatrième de couverture, et les pages (tête, pied, gouttière).
 * Pose : x, z (au sol, en unités --u), rotation autour de la verticale, couché ou debout, penché, hauteur (pile).
 */
type Pose = { x: number; z: number; ry: number; couche?: boolean; rz?: number; pile?: number };

function Livre3D({ p, k, pose, lang, ouvrir }: { p: Projet; k: number; pose: Pose; lang: Lang; ouvrir: string }) {
  const { img, pos } = couverture(p);
  const t = TOILES[k % TOILES.length];
  return (
    <Link
      href={`/${lang}/livres/${p.slug}/`}
      className={styles.b3}
      data-k={k}
      data-couche={pose.couche || undefined}
      aria-label={`${p.titre} — ${ouvrir}`}
      style={{ ['--toile' as string]: t.fond, ['--toileEncre' as string]: t.encre, ['--x' as string]: pose.x, ['--z' as string]: pose.z, ['--ry' as string]: `${pose.ry}deg`, ['--rz' as string]: `${pose.rz || 0}deg`, ['--pile' as string]: pose.pile || 0 }}
    >
      <span className={styles.fC}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.srcSmall} alt="" loading="lazy" draggable={false} style={pos ? { objectPosition: pos } : undefined} />
      </span>
      <span className={styles.fB} />
      <span className={styles.fD}><i>{numeroCollection(k)}</i><b>{p.titre}</b></span>
      <span className={styles.fT} />
      <span className={styles.fH} />
      <span className={styles.fP} />
    </Link>
  );
}

// l'accueil : l'étui au fond, les livres posés devant (un debout contre l'étui, deux couchés, une pile de trois)
const DEVANT: Pose[] = [
  { x: 150, z: -95, ry: -10, rz: -5 },
  { x: -190, z: 250, ry: -16, couche: true },
  { x: 10, z: 300, ry: 12, couche: true },
  { x: 290, z: 175, ry: 4, couche: true },
  { x: 285, z: 172, ry: -6, couche: true, pile: 1 },
  { x: 292, z: 178, ry: 9, couche: true, pile: 2 },
];

/**
 * La collection. `boite` (accueil) : l'étui, avec le dessin du couloir sur la face, et les six livres posés devant.
 * Sans `boite` (page Projets) : les livres debout, en rangée décalée, et dessous une petite photo de chacun pour choisir.
 */
export default function Collection({ projets, lang, boite = false }: { projets: Projet[]; lang: Lang; boite?: boolean }) {
  const L = tr(lang, {
    fr: { ouvrir: 'Ouvrir le livre', nom: 'Laura Pras · Portfolio', serie: 'La collection' },
    en: { ouvrir: 'Open the book', nom: 'Laura Pras · Portfolio', serie: 'The collection' },
    it: { ouvrir: 'Apri il libro', nom: 'Laura Pras · Portfolio', serie: 'La collezione' },
  });
  const liste = rangeCollection(projets);
  const titres = (
    <ol className={styles.c3Titres}>
      {liste.map((p, k) => {
        const { img, pos } = couverture(p);
        return (
          <li key={p.slug} data-k={k}>
            <Link href={`/${lang}/livres/${p.slug}/`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {!boite && <img src={img.srcSmall} alt="" loading="lazy" style={pos ? { objectPosition: pos } : undefined} />}
              <span><i>N° {numeroCollection(k)}</i> {p.titre}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
  return (
    <div className={styles.c3} data-boite={boite || undefined}>
      <div className={styles.c3Scene}>
        <div className={styles.c3Monde}>
          <span className={styles.c3Sol} aria-hidden="true" />
          {boite && (
            <span className={styles.etui} role="img" aria-label={L.nom}>
              <span className={styles.eAv}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/site/dessin-couverture-1000.webp" alt="" draggable={false} />
              </span>
              <span className={styles.eAr} />
              <span className={styles.eG}><b>Laura Pras</b><i>Portfolio</i></span>
              <span className={styles.eD} />
              <span className={styles.eH} />
            </span>
          )}
          {liste.map((p, k) => (
            <Livre3D key={p.slug} p={p} k={k} lang={lang} ouvrir={L.ouvrir}
              pose={boite ? DEVANT[k] : { x: 0, z: -(liste.length - 1 - k) * 78, ry: 0 }} />
          ))}
        </div>
      </div>
      {titres}
    </div>
  );
}
