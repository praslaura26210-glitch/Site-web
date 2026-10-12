import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import Bibliotheque from '@/components/home/Bibliotheque';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

/** Projets : une boîte en carton qui contient les projets, comme des magazines. */
export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.pHead}>
        <h1 className={styles.h1}>{t.meta.projetsTitle}</h1>
      </header>
      <Bibliotheque projets={projets} lang={lang} titre={`${t.meta.projetsTitle} ${projets.map((p) => p.annee).filter(Boolean).reduce((a, b) => Math.min(a!, b!))}–${projets.map((p) => p.annee).filter(Boolean).reduce((a, b) => Math.max(a!, b!))}`} />
    </div>
  );
}
