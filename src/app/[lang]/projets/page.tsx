import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import ProjetsGrille from '@/components/home/ProjetsGrille';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.head}>
        <h1 className={styles.h1}>{t.meta.projetsTitle}</h1>
        <p className={styles.headLead}>{t.home.approach}</p>
      </header>
      <ProjetsGrille projets={getProjets(lang)} lang={lang} headingLevel={2} />
    </div>
  );
}
