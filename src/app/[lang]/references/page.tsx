import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import { getReferences } from '@/lib/references';
import styles from '@/components/pages/pages.module.css';

const L = (lang: Lang) => tr(lang, {
  fr: {
    intro: 'Des projets étudiés dans mon rapport d’études sur l’expérience sensible (2025-2026).',
  },
  en: {
    intro: 'Projects studied in my report on sensory experience (2025-2026).',
  },
  it: {
    intro: 'Progetti studiati nel mio rapporto sull’esperienza sensibile (2025-2026).',
  },
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/references/', `${t.meta.referencesTitle} · Laura Pras`, L(lang).intro);
}

/** La taille de chaque image dans le catalogue, à tour de rôle. */
const TAILLES = ['g', 'p', 'm', 'p', 'm', 'g', 'p'];
/** Une ou deux informations : la première phrase de ce que Laura en dit. */
const premierePhrase = (t: string) => (t.match(/^.*?[.!?»](\s|$)/)?.[0] || t).trim();

/** Références : un catalogue des projets du rapport d'études ; un clic sur une image en dit un peu plus. */
export default async function References({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const l = L(lang);
  const refs = getReferences(lang);
  return (
    <article className={`wrap ${styles.page} ${styles.refsPage}`}>
      <header className={styles.refsTete}>
        <h1 className={styles.h1}>{t.meta.referencesTitle}</h1>
        <p className={styles.refsIntro}>{l.intro}</p>
      </header>
      {/* un catalogue d'images de tailles différentes ; un clic sur une image donne une ou deux informations */}
      <ul className={styles.catalogue}>
        {refs.map((x, i) => (
          <li key={x.id} className={`${styles.catItem} rv`} data-taille={TAILLES[i % TAILLES.length]}>
            <details className={styles.catFiche}>
              <summary>
                <figure className={styles.tirage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/site/inspirations/${x.id}.webp`} alt={x.titre} width={x.w} height={x.h} loading="lazy" />
                  <figcaption><b>{x.titre}</b>{x.auteur}</figcaption>
                </figure>
              </summary>
              <div className={styles.catInfo}>
                <p className={styles.catLieu}>{[x.lieu, x.annee].filter(Boolean).join(' · ')}</p>
                {x.texte && <p>{premierePhrase(x.texte)}</p>}
                {x.credit && <p className={styles.refsCredit}>{x.credit}</p>}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </article>
  );
}
