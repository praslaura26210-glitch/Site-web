import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { tr } from '@/lib/tr';
import { numeroCollection, rangeCollection } from '@/lib/collection';
import Logo from '@/components/chrome/Logo';
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

function Livre3D({ p, k, pose, lang, ouvrir, fige = false }: { p: Projet; k: number; pose: Pose; lang: Lang; ouvrir: string; fige?: boolean }) {
  const { img, pos } = couverture(p);
  const t = TOILES[k % TOILES.length];
  const El = (fige ? 'span' : Link) as typeof Link;
  return (
    <El
      href={`/${lang}/livres/${p.slug}/`}
      className={styles.b3}
      data-k={k}
      data-couche={pose.couche || undefined}
      aria-label={fige ? undefined : `${p.titre} — ${ouvrir}`}
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
    </El>
  );
}

// l'accueil, comme une photo de coffret : la boîte ouverte sur le côté (deux livres rangés dedans, la tranche vers l'ouverture),
// un livre debout à côté, un couché, et une petite pile de deux devant
const AUTOUR: Pose[] = [
  { x: -128, z: 66, ry: 180 },
  { x: -128, z: 44, ry: 180 },
  { x: 130, z: -150, ry: -8 },
  { x: 250, z: 230, ry: 72, couche: true },
  { x: -170, z: 400, ry: -12, couche: true },
  { x: -150, z: 410, ry: -3, couche: true, pile: 1 },
];
const BOITE = { x: -150, z: -40 };

/**
 * La collection. `boite` (accueil) : une image fixe, la boîte ouverte et les six livres autour ; dessous, la liste des projets.
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
      <div className={styles.c3Scene} {...(boite ? { role: 'img', 'aria-label': `${L.serie} — ${liste.map((p) => p.titre).join(', ')}` } : {})}>
        <div className={styles.c3Monde}>
          <span className={styles.c3Sol} aria-hidden="true" />
          {boite && (
            // la boîte : un cube toilé, ouvert sur le côté droit ; dedans, la couleur de terre ; la liste des titres sur la face, le logo en petit
            <span className={styles.bt} style={{ ['--x' as string]: BOITE.x, ['--z' as string]: BOITE.z }}>
              <span className={styles.btAv}>
                <span className={styles.btMarque}><Logo className={styles.btLogo} poids={2.4} label="" /><i>Laura Pras<br />Portfolio</i></span>
                <span className={styles.btListe}>{liste.map((p) => <b key={p.slug}>{p.titre}</b>)}</span>
              </span>
              <span className={styles.btHaut} />
              <span className={styles.btG} />
              <span className={styles.btFondIn} />
              <span className={styles.btGIn} />
              <span className={styles.btSolIn} />
              <span className={styles.btBord} />
            </span>
          )}
          {liste.map((p, k) => (
            <Livre3D key={p.slug} p={p} k={k} lang={lang} ouvrir={L.ouvrir} fige={boite}
              pose={boite ? AUTOUR[k] : { x: 0, z: -(liste.length - 1 - k) * 78, ry: 0 }} />
          ))}
        </div>
      </div>
      {titres}
    </div>
  );
}
