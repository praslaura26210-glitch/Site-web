import fs from 'node:fs';
import path from 'node:path';
import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';
import styles from '@/components/pages/pages.module.css';

const refs = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site/references.json'), 'utf8'));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const r = refs();
  return meta(lang, '/references/', `${t.meta.referencesTitle} · Laura Pras`, lang === 'fr' ? r.intro_proposee : r[`intro_${lang}`]);
}

/** Références : une liste typographique ; l'image apparaît quand Laura l'ajoute (champ « image » de references.json). */
export default async function References({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const r = refs();
  return (
    <article className={`wrap ${styles.page}`}>
      <header className={styles.head}>
        <h1 className={styles.h1}>{t.meta.referencesTitle}</h1>
        <p className={styles.headLead}>{lang === 'fr' ? r.intro_proposee : r[`intro_${lang}`]}</p>
      </header>
      <ol className={styles.refs}>
        {r.references.map((x: any, i: number) => (
          <li key={x.architecte} className="rv">
            <span className={styles.n}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2 className={styles.refName}>{x.architecte}</h2>
              <p className={styles.refProj}>{x.projets.join(' · ')}</p>
            </div>
            <p className={styles.refWhy}>{lang === 'fr' ? x.pourquoi : x[`pourquoi_${lang}`]}</p>
            {x.image && !String(x.image).startsWith('[') && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.refImg} src={x.image} alt={x.projets[0]} loading="lazy" />
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}
