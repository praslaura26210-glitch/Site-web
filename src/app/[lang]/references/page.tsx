import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import { getReferences } from '@/lib/references';
import styles from '@/components/pages/pages.module.css';

const L = (lang: Lang) => tr(lang, {
  fr: {
    intro: 'Des projets étudiés dans mon rapport d’études sur l’expérience sensible (2025-2026). Je les ai rangés selon les deux questions qui me retiennent.',
    themes: { existant: 'Composer avec l’existant', matiere: 'La matière' } as Record<string, string>,
  },
  en: {
    intro: 'Projects studied in my report on sensory experience (2025-2026), grouped around the two questions that hold me.',
    themes: { existant: 'Working with what exists', matiere: 'Material' } as Record<string, string>,
  },
  it: {
    intro: 'Progetti studiati nel mio rapporto sull’esperienza sensibile (2025-2026), raccolti attorno alle due domande che mi trattengono.',
    themes: { existant: 'Comporre con l’esistente', matiere: 'La materia' } as Record<string, string>,
  },
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/references/', `${t.meta.referencesTitle} · Laura Pras`, L(lang).intro);
}

/** Références : les projets du rapport d'études, en tirages, avec ce que Laura en retient. */
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
      {['existant', 'matiere'].map((th) => (
        <section key={th} className={styles.refsTheme} aria-labelledby={`theme-${th}`}>
          <h2 id={`theme-${th}`} className={styles.refsThemeT}>{l.themes[th]}</h2>
          <ul className={styles.refsListe}>
            {refs.filter((x) => x.theme === th).map((x, i) => (
              <li key={x.id} className="rv" style={{ ['--i' as string]: i }}>
                <figure className={styles.tirage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/site/inspirations/${x.id}.webp`} alt={x.titre} width={x.w} height={x.h} loading="lazy" />
                  <figcaption><b>{x.titre}</b>{[x.auteur, x.lieu].filter(Boolean).join(' · ')}</figcaption>
                </figure>
                {x.texte && <p className={styles.refsNote}>{x.texte}</p>}
                {x.credit && <p className={styles.refsCredit}>{x.credit}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
