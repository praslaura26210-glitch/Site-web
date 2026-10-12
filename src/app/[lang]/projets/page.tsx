import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import Etui from '@/components/home/Etui';
import { tr } from '@/lib/tr';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

/** Projets : un étui en carton où les projets sont rangés comme des livres ; chacun s'ouvre en livre animé. */
export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  const annees = projets.map((p) => p.annee).filter((a): a is number => !!a).sort();
  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.pHead}>
        <h1 className={styles.h1}>{t.meta.projetsTitle}</h1>
      </header>
      <Etui projets={projets} lang={lang} t={t} titre={`${t.meta.projetsTitle} ${annees[0]}–${annees[annees.length - 1]}`} aide={tr(lang, { fr: 'Choisissez un livre', en: 'Pick a book', it: 'Scegli un libro' })} />
    </div>
  );
}
