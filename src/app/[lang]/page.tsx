import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import { couverture } from '@/components/home/ProjetsGrille';
import ProjetsIndex from '@/components/home/ProjetsIndex';
import Avancee from '@/components/home/Avancee';
import Esquisse from '@/components/project/Esquisse';
import styles from '@/components/home/home.module.css';

/** Point de fuite du couloir dans le dessin de couverture (fractions de largeur et de hauteur). */
const FUITE: [number, number] = [0.42, 0.43];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/', `Laura Pras · ${t.home.approach.split(',')[0]}`, t.meta.siteDescription);
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  const lignes = projets.map((p) => {
    const { img, pos } = couverture(p);
    return { slug: p.slug, titre: p.titre, programme: p.programme, annee: p.annee, img: { src: img.src, srcSmall: img.srcSmall, w: img.w, h: img.h, pos } };
  });
  return (
    <>
      <Avancee className={styles.scene} fuite={FUITE}>
        <section className={styles.hero} aria-labelledby="nom">
          <div className={styles.heroTxt}>
            <p className="eyebrow">{t.home.portfolio}</p>
            <h1 id="nom" className={styles.nom}>Laura<br />Pras</h1>
            <p className={`eyebrow ${styles.statut}`}>{t.home.statut}</p>
            <p className={styles.approche}>{t.home.approach}</p>
            <a className="lien" href="#projets">{t.home.cta}</a>
          </div>
          <div className={styles.heroDessin}>
            <Esquisse
              className={styles.couloir}
              src="/media/site/dessin-couverture-2000.webp"
              srcSmall="/media/site/dessin-couverture-1000.webp"
              w={1398}
              h={1328}
              alt=""
              fuite={FUITE}
              duree={3200}
              sizes="(max-width: 900px) 100vw, 58vw"
              eager
            />
          </div>
        </section>
      </Avancee>

      <section id="projets" className={`wrap ${styles.projets}`} aria-labelledby="titre-projets">
        <div className={styles.projetsHead}>
          <h2 id="titre-projets" className="eyebrow">{t.home.projetsTitre}</h2>
          <span className="eyebrow">{String(projets.length).padStart(2, '0')}</span>
        </div>
        <ProjetsIndex lignes={lignes} lang={lang} voir={t.home.voir} />
      </section>
    </>
  );
}
