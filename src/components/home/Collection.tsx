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

function Livre3D({ p, k, pose, lang, ouvrir, fige = false }: { p: Projet; k: number; pose: Pose; lang: Lang; ouvrir: string; fige?: boolean }) {
  const { img, pos } = couverture(p);
  const t = TOILES[k % TOILES.length];
  const props = {
    className: styles.b3,
    'data-k': k,
    'data-couche': pose.couche || undefined,
    style: { ['--toile' as string]: t.fond, ['--toileEncre' as string]: t.encre, ['--x' as string]: pose.x, ['--z' as string]: pose.z, ['--ry' as string]: `${pose.ry}deg`, ['--rz' as string]: `${pose.rz || 0}deg`, ['--pile' as string]: pose.pile || 0 },
  };
  const faces = (
    <>
      <span className={styles.fC}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.srcSmall} alt="" loading="lazy" draggable={false} style={pos ? { objectPosition: pos } : undefined} />
      </span>
      <span className={styles.fB} />
      <span className={styles.fD}><i>{numeroCollection(k)}</i><b>{p.titre}</b></span>
      <span className={styles.fT} />
      <span className={styles.fH} />
      <span className={styles.fP} />
    </>
  );
  return fige
    ? <span {...props}>{faces}</span>
    : <Link href={`/${lang}/livres/${p.slug}/`} aria-label={`${p.titre} — ${ouvrir}`} {...props}>{faces}</Link>;
}

/** La rangée de livres debout, décalés (comme une collection d'éditeur) : la tranche de chacun, la couverture du dernier. */
function Rangee({ liste, lang, ouvrir, fige = false }: { liste: Projet[]; lang: Lang; ouvrir: string; fige?: boolean }) {
  return (
    <div className={styles.c3Scene}>
      <div className={styles.c3Monde}>
        <span className={styles.c3Sol} aria-hidden="true" />
        {liste.map((p, k) => (
          <Livre3D key={p.slug} p={p} k={k} lang={lang} ouvrir={ouvrir} fige={fige} pose={{ x: 0, z: -(liste.length - 1 - k) * 78, ry: 0 }} />
        ))}
      </div>
    </div>
  );
}

const premiereIdee = (t: string, n = 190) => {
  const phrase = t.split(/(?<=[.!?])\s+/)[0];
  return phrase.length <= n ? phrase : `${phrase.slice(0, n).replace(/\s+\S*$/, '')}…`;
};

/**
 * La collection.
 * `accueil` : la rangée de livres et, en grand, « Voir les projets » ; le tout mène à la page Projets.
 * `projets` : tous les projets en grand, l'un après l'autre,
 * la photo d'un côté, le titre, le programme et quelques lignes de l'autre, pour donner envie de les ouvrir.
 */
export default function Collection({ projets, lang, mode = 'projets' }: { projets: Projet[]; lang: Lang; mode?: 'accueil' | 'projets' }) {
  const L = tr(lang, {
    fr: { ouvrir: 'Ouvrir le livre', serie: 'La collection', projets: 'projets', voir: 'Voir les projets', titre: 'Projets' },
    en: { ouvrir: 'Open the book', serie: 'The collection', projets: 'projects', voir: 'See the projects', titre: 'Projects' },
    it: { ouvrir: 'Apri il libro', serie: 'La collezione', projets: 'progetti', voir: 'Vedi i progetti', titre: 'Progetti' },
  });
  const liste = rangeCollection(projets);
  const annees = `${liste[0].annee} — ${liste[liste.length - 1].annee}`;

  if (mode === 'accueil') {
    return (
      <Link href={`/${lang}/projets/`} className={`${styles.c3} ${styles.cAcc}`} data-accueil="">
        <span className={styles.cAccTexte}>
          <span className="eyebrow">{liste.length} {L.projets} · {annees}</span>
          <span className={styles.cAccT}>{L.voir} <i aria-hidden="true">→</i></span>
        </span>
        <Rangee liste={liste} lang={lang} ouvrir={L.ouvrir} fige />
      </Link>
    );
  }

  return (
    <div className={styles.c3}>
      <header className={styles.cPHaut}>
        <h1 className={styles.cPTitre}>{L.titre}</h1>
        <p className="eyebrow">{liste.length} {L.projets} · {annees}</p>
      </header>
      {/* tous les projets, en grand */}
      <ol className={styles.bandes}>
        {liste.map((p, k) => {
          const { img, pos } = couverture(p);
          const t = TOILES[k % TOILES.length];
          return (
            <li key={p.slug} className={styles.bande} style={{ ['--toile' as string]: t.fond }}>
              <Link href={`/${lang}/livres/${p.slug}/`} className={styles.bandeLien}>
                <span className={styles.bandeImg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.srcSmall} srcSet={`${img.srcSmall} 1000w, ${img.src} 2000w`} sizes="(max-width: 760px) 100vw, 58vw" alt="" loading={k < 2 ? 'eager' : 'lazy'} style={pos ? { objectPosition: pos } : undefined} />
                </span>
                <span className={styles.bandeTxt}>
                  <span className={styles.bandeN}>N° {numeroCollection(k)}</span>
                  <span className={styles.bandeT}>{p.titre}</span>
                  <span className={styles.bandeM}>{[p.programme, p.lieu, p.annee].filter(Boolean).join(' · ')}</span>
                  <span className={styles.bandeX}>{premiereIdee(p.texte)}</span>
                  <span className={styles.bandeO}>{L.ouvrir} →</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
