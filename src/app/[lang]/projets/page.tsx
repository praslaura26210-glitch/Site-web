import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import ProjetsPlanches from '@/components/home/ProjetsPlanches';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

/** Projets : chaque projet en planche, plusieurs de ses images côte à côte. */
export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.pHead}>
        <h1 className={styles.h1}>{t.meta.projetsTitle}</h1>
      </header>
      <ProjetsPlanches projets={projets} lang={lang} lire={t.home.voir} />
    </div>
  );
}
