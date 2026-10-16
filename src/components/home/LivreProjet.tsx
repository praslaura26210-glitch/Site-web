import Link from 'next/link';
import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { rangeCollection } from '@/lib/collection';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import { couverture } from './ProjetsGrille';
import { CouvLivre } from './Collection';
import LivrePages from './LivrePages';
import styles from './home.module.css';

/** Les métadonnées de la page d'un livre. */
export function livreMeta(lang: Lang, slug: string) {
  const p = getProjets(lang).find((x) => x.slug === slug)!;
  return meta(lang, `/livres/${slug}/`, `${p.titre} · Laura Pras`, `${p.programme}. ${p.texte.slice(0, 120).replace(/\s+\S*$/, '')}…`, couverture(p).img.src);
}

/**
 * Le livre d'un projet : on le feuillette, les pages tournent au clic (experience/livres.ts).
 * À gauche, les autres livres de la collection ; à droite, le livre suivant. Il n'y a plus de fiche projet.
 */
export default function LivreProjet({ lang, slug }: { lang: Lang; slug: string }) {
  const t = dict(lang);
  const liste = rangeCollection(getProjets(lang));
  const k = liste.findIndex((x) => x.slug === slug);
  const p = liste[k];
  const suivant = liste[(k + 1) % liste.length];
  const { img, pos } = couverture(p);
  const L = tr(lang, { fr: { retour: 'La collection', autres: 'Les autres livres', suivant: 'Livre suivant' }, en: { retour: 'The collection', autres: 'The other books', suivant: 'Next book' }, it: { retour: 'La collezione', autres: 'Gli altri libri', suivant: 'Libro successivo' } });
  const cs = couverture(suivant);
  return (
    <article className={styles.livrePage} data-projet={p.slug}>
      <nav className={`wrap ${styles.livreNav}`} aria-label={p.titre}>
        <Link href={`/${lang}/projets/`} className="lien">← {L.retour}</Link>
        <h1 className={styles.livreTitre}>{p.titre}</h1>
        <span className={styles.livreAn}>{p.annee}</span>
      </nav>
      <div className={styles.livreCorps}>
        <section className="xp-lp" data-livre-projet="" aria-label={p.titre}>
          {/* sans JavaScript : la couverture */}
          <figure className={styles.livreSansJs}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt="" width={img.w} height={img.h} style={pos ? { objectPosition: pos } : undefined} />
          </figure>
          <LivrePages p={p} k={k} suivant={suivant} lang={lang} t={t} />
        </section>
        {/* les autres livres de la collection, rangés à côté ; celui qu'on lit est sorti du rang */}
        <nav className={styles.livreAutres} aria-label={L.autres}>
          <ol>
            {liste.map((x, j) => (
              <li key={x.slug} data-ici={x.slug === slug || undefined}>
                <Link href={`/${lang}/livres/${x.slug}/`} aria-current={x.slug === slug ? 'page' : undefined} aria-label={x.titre} title={x.titre}>
                  <CouvLivre p={x} k={j} petit />
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        {/* le livre suivant, à côté du livre ouvert */}
        <Link href={`/${lang}/livres/${suivant.slug}/`} className={styles.livreSuivant}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cs.img.srcSmall} alt="" loading="lazy" style={cs.pos ? { objectPosition: cs.pos } : undefined} />
          <span>{L.suivant} →</span>
          <b>{suivant.titre}</b>
        </Link>
      </div>
    </article>
  );
}
