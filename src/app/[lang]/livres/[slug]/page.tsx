import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LANGS, dict, type Lang } from '@/i18n';
import { ORDRE, getProjet } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import { couverture } from '@/components/home/ProjetsGrille';
import LivrePages from '@/components/home/LivrePages';
import styles from '@/components/home/home.module.css';

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.flatMap((lang) => ORDRE.map((slug) => ({ lang, slug })));
}

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  const p = getProjet(slug, lang);
  return meta(lang, `/livres/${slug}/`, `${p.titre} · Laura Pras`, `${p.programme}. ${p.texte.slice(0, 120).replace(/\s+\S*$/, '')}…`, couverture(p).img.src);
}

/** Le livre d'un projet, sorti de la collection : on fait défiler et les pages tournent (experience/livres.ts). */
export default async function Livre({ params }: Params) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  if (!(ORDRE as readonly string[]).includes(slug)) notFound();
  const t = dict(lang);
  const p = getProjet(slug, lang);
  const { img, pos } = couverture(p);
  const L = tr(lang, { fr: { retour: 'La collection', fiche: 'La fiche du projet' }, en: { retour: 'The collection', fiche: 'Project page' }, it: { retour: 'La collezione', fiche: 'La scheda del progetto' } });
  return (
    <article className={styles.livrePage} data-projet={p.slug}>
      <nav className={`wrap ${styles.livreNav}`} aria-label={p.titre}>
        <Link href={`/${lang}/`} className="lien">← {L.retour}</Link>
        <h1 className={styles.livreTitre}>{p.titre}</h1>
        <Link href={`/${lang}/projets/${p.slug}/`} className="lien">{L.fiche} →</Link>
      </nav>
      <section className="xp-lp" data-livre-projet="" aria-label={p.titre}>
        {/* sans JavaScript : la couverture */}
        <figure className={styles.livreSansJs}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.src} alt="" width={img.w} height={img.h} style={pos ? { objectPosition: pos } : undefined} />
        </figure>
        <LivrePages p={p} lang={lang} t={t} />
      </section>
    </article>
  );
}
