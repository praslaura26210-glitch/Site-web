import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { resume } from '@/lib/experience';
import { couverture } from './ProjetsGrille';
import styles from './home.module.css';

/** Seconde image de chaque projet, choisie pour montrer une autre facette (dessin, autre vue). */
const SECONDES: Record<string, string> = {
  'entre-deux-regards': 'perspective-cour',
  'le-passage-des-artistes': 'croquis-cour',
  'pilates-room': 'rendu-salle',
  'la-ruche': 'axonometrie-eclatee',
  'illusion-d-envol': 'croquis-perspective',
};

/**
 * Page Projets, comme un magazine : un sommaire numéroté, puis chaque projet en double page
 * (la grande photo d'un côté, le titre, quelques lignes et un dessin de l'autre), en alternance.
 */
export default function ProjetsMagazine({ projets, lang, lire, sommaire }: { projets: Projet[]; lang: Lang; lire: string; sommaire: string }) {
  return (
    <>
      <nav className={styles.mSommaire} aria-label={sommaire}>
        <ol>
          {projets.map((p, i) => (
            <li key={p.slug}>
              <a href={`#p-${p.slug}`} data-ancre="">
                <span className={styles.mSomN}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.mSomT}>{p.titre}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.magazine}>
        {projets.map((p, i) => {
          const { img, pos } = couverture(p);
          const sec = p.images.find((x) => x.nom === SECONDES[p.slug]);
          const dessin = !!sec && /croquis|plan/.test(sec.type);
          const href = `/${lang}/projets/${p.slug}/`;
          const meta = [p.programme, p.lieu, p.annee].filter(Boolean).join(' · ');
          return (
            <article key={p.slug} id={`p-${p.slug}`} className={styles.mArticle} data-sens={i % 2 ? 'g' : 'd'} aria-labelledby={`t-${p.slug}`}>
              <p className={styles.mRubrique}><span>N° {String(i + 1).padStart(2, '0')}</span><span>{p.programme}</span></p>
              <Link href={href} className={`${styles.mCouv} rv`} tabIndex={-1} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.srcSmall} srcSet={`${img.srcSmall} 1000w, ${img.src} 2000w`} sizes="(max-width: 900px) 100vw, 58vw" alt="" width={img.w} height={img.h} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" style={pos ? { objectPosition: pos } : undefined} />
              </Link>
              <div className={styles.mTexte}>
                <span className={styles.mN} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h2 id={`t-${p.slug}`} className={styles.mTitre}><Link href={href}>{p.titre}</Link></h2>
                <p className={styles.mMeta}>{meta}</p>
                <p className={styles.mResume}>{resume(p)}</p>
                <Link href={href} className="lien">{lire} →</Link>
                {sec && (
                  <figure className={`${styles.mSeconde} rv`} data-dessin={dessin || undefined}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sec.srcSmall} alt={sec.legende} width={sec.w} height={sec.h} loading="lazy" decoding="async" />
                    <figcaption>{sec.legende}</figcaption>
                  </figure>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
