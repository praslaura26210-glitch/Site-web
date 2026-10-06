import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/a-propos/', `${t.meta.aproposTitle} · Laura Pras`, t.meta.siteDescription);
}

// Page construite à l'étape suivante.
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return (
    <section className={`wrap ${styles.page}`}>
      <h1 className={styles.h1}>{t.meta.aproposTitle}</h1>
      <p className={styles.soon}>{t.soon.text}</p>
    </section>
  );
}
