import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import ProjetsMagazine from '@/components/home/ProjetsMagazine';
import Territoire from '@/components/home/Territoire';
import styles from '@/components/pages/pages.module.css';
import home from '@/components/home/home.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

/** Projets : tous les projets en images, comme un magazine ; puis la carte des lieux. */
export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  const sommaire = tr(lang, { fr: 'Sommaire', en: 'Contents', it: 'Sommario' });
  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.pHead}>
        <h1 className={styles.h1}>{t.meta.projetsTitle}</h1>
        <span className="eyebrow">{String(projets.length).padStart(2, '0')}</span>
      </header>
      <ProjetsMagazine projets={projets} lang={lang} lire={t.home.voir} sommaire={sommaire} />
      <div className={home.mTerr}><Territoire projets={projets} t={t} lang={lang} /></div>
    </div>
  );
}
