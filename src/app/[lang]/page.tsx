import Link from 'next/link';
import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import Intro from '@/components/home/Intro';
import HomeStage from '@/components/home/HomeStage';
import LiteClass from '@/components/home/LiteClass';
import styles from '@/components/home/home.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/', `Laura Pras · ${t.home.approach.split(',')[0]}`, t.meta.siteDescription);
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  return (
    <>
      <Intro skipLabel={t.intro.skip} />
      <HomeStage className={styles.hero}>
        <LiteClass liteClass={styles.heroLite} />
        <p className="sr-only">{t.home.terrainLabel}</p>
        <div className={`wrap ${styles.heroIn}`}>
          <div>
            <h1 className={styles.name}>Laura Pras</h1>
            <p className={`lead ${styles.approach}`}>{t.home.approach}</p>
            <p className={styles.role}>{t.home.role}</p>
            <p className={styles.search}>{t.home.search}</p>
            <Link className={styles.cta} href={`/${lang}/projets/`}>
              {t.home.cta} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <nav aria-label={t.home.list}>
            <p className={`eyebrow ${styles.listHead}`}>{t.home.list}</p>
            <ol className={styles.list}>
              {projets.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${lang}/projets/${p.slug}/`}>
                    <span className={styles.n}>{p.ordre}</span>
                    <span className={styles.t}>{p.titre}<small>{p.programme}</small></span>
                    <span className={styles.y}>{p.annee}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </HomeStage>
    </>
  );
}
