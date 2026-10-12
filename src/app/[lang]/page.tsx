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
  return meta(lang, '/', `Laura Pras · ${t.home.statut}`, t.meta.siteDescription);
}

/** Accueil : le dessin au centre, le nom, une ligne, le portfolio ; le haut de la liste des projets dépasse en bas de l'écran. */
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
        <div className={styles.heroDessin}>
          <Couloir legende={t.home.dessinLegende} ouvrir={t.home.ouvrir} fermer={t.projet.fermer} />
        </div>
        <h1 id="nom" className={styles.nom}>Laura Pras</h1>
        <p className={styles.statut}>{t.home.statut}</p>
        <p className={styles.liens}><Portfolio t={t} /></p>
      </section>

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
