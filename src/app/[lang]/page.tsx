import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import { couverture } from '@/components/home/ProjetsGrille';
import ProjetsIndex from '@/components/home/ProjetsIndex';
import Couloir from '@/components/home/Couloir';
import Portfolio from '@/components/home/Portfolio';
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
  const lignes = projets.map((p) => {
    const { img, pos } = couverture(p);
    return { slug: p.slug, titre: p.titre, programme: p.programme, annee: p.annee, img: { src: img.src, srcSmall: img.srcSmall, w: img.w, h: img.h, pos } };
  });
  return (
    <>
      <section className={styles.hero} aria-labelledby="nom">
        <div className={styles.heroTxt}>
          <p className="eyebrow">{t.home.portfolio}</p>
          <h1 id="nom" className={styles.nom}>Laura<br />Pras</h1>
          <p className={`eyebrow ${styles.statut}`}>{t.home.statut}</p>
          <p className={styles.approche}>{t.home.approach}</p>
          <p className={styles.liens}>
            <a className="lien" href="#projets">{t.home.cta}</a>
            <button type="button" className="lien xp-lienVisite" data-xp="visite">{t.xp.visite} <span aria-hidden="true">→</span></button>
            <Portfolio t={t} />
          </p>
        </div>
        <div className={styles.heroDessin}>
          <Couloir legende={t.home.dessinLegende} ouvrir={t.home.ouvrir} fermer={t.projet.fermer} />
        </div>
      </section>

      <section id="projets" className={`wrap ${styles.projets}`} aria-labelledby="titre-projets">
        <div className={styles.projetsHead}>
          <h2 id="titre-projets" className="eyebrow">{t.home.projetsTitre}</h2>
          <span className="eyebrow">{String(projets.length).padStart(2, '0')}</span>
        </div>
        <ProjetsIndex lignes={lignes} lang={lang} voir={t.home.voir} />
      </section>

      <section className="xp-carnet" data-carnet aria-label={t.xp.carnet}>
        <div className="wrap xp-carnet-tete">
          <h2 className="eyebrow">{t.xp.carnet}</h2>
          <p className="eyebrow xp-carnet-legende" data-carnet-legende data-defaut={t.xp.carnetAide}>{t.xp.carnetAide}</p>
        </div>
        <div className="xp-carnet-fenetre"><div className="xp-carnet-piste" data-carnet-piste /></div>
      </section>
    </>
  );
}
