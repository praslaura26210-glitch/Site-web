import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { tr } from '@/lib/tr';
import { numeroCollection, rangeCollection } from '@/lib/collection';
import { couverture, TOILES } from './ProjetsGrille';
import styles from './home.module.css';

/**
 * La collection : les livres des projets, de face, rangés côte à côte sur une tablette, dans l'ordre des
 * années ; sous la tablette, la frise des années. Tous les livres ont la même maquette (la toile de couleur,
 * le numéro, la photo dans une fenêtre, le titre) : on comprend que c'est une série. Au survol un livre se
 * soulève ; un clic l'ouvre et on le feuillette.
 */
export function CouvLivre({ p, k, petit = false }: { p: Projet; k: number; petit?: boolean }) {
  const { img, pos } = couverture(p);
  const t = TOILES[k % TOILES.length];
  return (
    <span className={styles.cv} data-petit={petit || undefined} style={{ ['--toile' as string]: t.fond, ['--toileEncre' as string]: t.encre }}>
      <span className={styles.cvN}>N° {numeroCollection(k)}</span>
      <span className={styles.cvFenetre}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.srcSmall} alt="" loading="lazy" style={pos ? { objectPosition: pos } : undefined} />
      </span>
      <span className={styles.cvT}>{p.titre}</span>
      <span className={styles.cvA}>{p.annee}</span>
    </span>
  );
}

export default function Collection({ projets, lang }: { projets: Projet[]; lang: Lang }) {
  const L = tr(lang, {
    fr: { serie: 'Collection', projets: 'projets', ouvrir: 'Ouvrir le livre' },
    en: { serie: 'Collection', projets: 'projects', ouvrir: 'Open the book' },
    it: { serie: 'Collezione', projets: 'progetti', ouvrir: 'Apri il libro' },
  });
  // dans l'ordre des années (et, à année égale, dans l'ordre du book) : N° 01, 02…
  const liste = rangeCollection(projets).map((p) => ({ p }));
  const annees = [...new Set(liste.map((x) => String(x.p.annee || '')))];
  return (
    <div className={styles.coll} style={{ ['--n' as string]: liste.length }}>
      <ul className={styles.collLivres}>
        {liste.map(({ p }, k) => (
          <li key={p.slug} className={styles.collLivre} style={{ ['--k' as string]: k }}>
            <Link href={`/${lang}/livres/${p.slug}/`} className={styles.collLien} aria-label={`${p.titre} — ${L.ouvrir}`}>
              <CouvLivre p={p} k={k} />
              <span className={styles.collProg}>{p.programme}</span>
            </Link>
          </li>
        ))}
      </ul>
      <span className={styles.collTablette} aria-hidden="true" />
      {/* la frise des années, sous la tablette */}
      <ol className={styles.collFrise} aria-hidden="true">
        {annees.map((a) => {
          const debut = liste.findIndex((x) => String(x.p.annee) === a);
          const n = liste.filter((x) => String(x.p.annee) === a).length;
          return <li key={a} style={{ gridColumn: `${debut + 1} / span ${n}` }}><span>{a}</span></li>;
        })}
      </ol>
      <p className={styles.collLegende}>{L.serie} · {liste.length} {L.projets}</p>
    </div>
  );
}
