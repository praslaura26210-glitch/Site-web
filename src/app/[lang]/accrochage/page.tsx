import Link from 'next/link';
import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/accrochage/', `${t.xp.accrochage} · Laura Pras`, t.xp.accrochageTitre);
}

/**
 * L'accrochage : tous les projets sur une même table, comme un mur de jury.
 * La table est construite dans le navigateur (experience/accrochage.ts) à partir des données du site.
 */
export default async function Accrochage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return (
    <section className="xp-ac" data-accrochage aria-labelledby="titre-accrochage">
      <div className="xp-ac-vue" data-ac-vue tabIndex={0} role="application" aria-label={t.xp.accrochageAide} />
      <header className="xp-ac-tete">
        <p className="eyebrow">{t.xp.accrochage}</p>
        <h1 id="titre-accrochage" className="xp-ac-h1">{t.xp.accrochageTitre}</h1>
      </header>
      <div className="xp-ac-carte" data-ac-carte aria-hidden="true" />
      <div className="xp-ac-bas">
        <div className="xp-ac-projets" data-ac-projets><button type="button" className="xp-ac-tout" data-ac-tout>{t.xp.toutVoir}</button></div>
        <p className="xp-ac-info" data-ac-info aria-live="polite">{t.xp.accrochageAide}</p>
        <div className="xp-ac-zoom">
          <button type="button" data-ac-moins aria-label={t.projet.zoomOut}>−</button>
          <span data-ac-pct />
          <button type="button" data-ac-plus aria-label={t.projet.zoomIn}>+</button>
        </div>
      </div>
      <noscript><p className="xp-ac-sansjs"><Link href={`/${lang}/projets/`} className="lien">{t.xp.accrochageSansJs}</Link></p></noscript>
    </section>
  );
}
