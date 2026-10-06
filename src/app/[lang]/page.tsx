import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import ProjetsGrille from '@/components/home/ProjetsGrille';
import Croquis from '@/components/project/Croquis';
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
      <section className={styles.hero} aria-labelledby="nom">
        <div className={`wrap ${styles.heroGrid}`}>
          <div className={styles.heroTxt}>
            <p className={styles.coords}>
              <span>45°11′ N</span><span aria-hidden="true">·</span><span>5°43′ E</span><span className={styles.coordsLieu}>{t.home.lieu}</span>
            </p>
            <h1 id="nom" className={styles.nom}>Laura Pras</h1>
            <p className={styles.approche}>{t.home.approach}</p>
            <p className={styles.role}>{t.home.role}</p>
            <a className={styles.down} href="#projets">
              <span>{t.home.cta}</span>
              <svg viewBox="0 0 12 28" width="12" height="28" aria-hidden="true"><path d="M6 1v25M1.5 21.5 6 26l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
          <Croquis
            className={styles.heroDessin}
            json="/media/intro/intro.json"
            src="/media/site/dessin-couverture-2000.webp"
            srcSmall="/media/site/dessin-couverture-1000.webp"
            w={1398}
            h={1328}
            alt=""
            duree={4200}
            eager
          />
        </div>
      </section>

      <section id="projets" className={`wrap ${styles.projets}`} aria-labelledby="titre-projets">
        <div className={styles.projetsHead}>
          <h2 id="titre-projets" className="eyebrow">{t.home.list}</h2>
          <span className={styles.projetsLine} aria-hidden="true" />
        </div>
        <ProjetsGrille projets={projets} lang={lang} />
      </section>
    </>
  );
}
