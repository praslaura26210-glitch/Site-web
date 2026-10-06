import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import styles from './home.module.css';

/** Image de couverture de chaque projet dans les grilles. */
export const COUVERTURES: Record<string, { nom: string; pos?: string }> = {
  'entre-deux-regards': { nom: 'perspective-exterieure', pos: '40% 50%' },
  'le-passage-des-artistes': { nom: 'maquette-1' },
  'pilates-room': { nom: 'rendu-accueil' },
  'escalier-suspendu': { nom: 'rendu' },
  'la-ruche': { nom: 'maquette-1' },
  'illusion-d-envol': { nom: 'maquette' },
};

export function couverture(p: Projet) {
  const c = COUVERTURES[p.slug];
  return { img: p.images.find((i) => i.nom === c?.nom) || p.images[0], pos: c?.pos };
}

/** Grille « magazine » des six projets : trois colonnes, la colonne du milieu décalée. */
export default function ProjetsGrille({ projets, lang, headingLevel = 3 }: { projets: Projet[]; lang: Lang; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <ol className={styles.grille}>
      {projets.map((p, i) => {
        const { img, pos } = couverture(p);
        return (
          <li key={p.slug} className={`${styles.carte} rv`}>
            <Link href={`/${lang}/projets/${p.slug}/`}>
              <div className={styles.carteImg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.srcSmall} srcSet={`${img.srcSmall} 1000w, ${img.src} 2000w`} sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw" alt="" width={img.w} height={img.h} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" style={pos ? { objectPosition: pos } : undefined} />
              </div>
              <div className={styles.carteTxt}>
                <span className={styles.carteN}>{String(i + 1).padStart(2, '0')}</span>
                <H className={styles.carteT}>{p.titre}</H>
                <p className={styles.carteP}>{p.programme}{p.annee ? ` · ${p.annee}` : ''}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
