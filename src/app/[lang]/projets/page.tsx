import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import Collection from '@/components/home/Collection';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

/** Projets : la rangée des livres, puis tous les projets en grand ; un clic ouvre le livre du projet. */
export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const projets = getProjets(lang);
  return (
    <div className={`wrap ${styles.page}`}>
      <Collection projets={projets} lang={lang} />
    </div>
  );
}
