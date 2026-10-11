import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import { couverture } from '@/components/home/ProjetsGrille';
import ProjetsIndex from '@/components/home/ProjetsIndex';
import Couloir from '@/components/home/Couloir';
import Portfolio from '@/components/home/Portfolio';
import Anime from '@/components/pages/Anime';
import { getReferences } from '@/lib/references';
import { tr } from '@/lib/tr';
import styles from '@/components/home/home.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/', `Laura Pras · ${t.home.statut}`, t.meta.siteDescription);
}

/** Accueil : le nom, une ligne, le portfolio à télécharger, le dessin ; puis les projets et ce qui anime Laura. */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  const lignes = projets.map((p) => {
    const { img, pos } = couverture(p);
    return { slug: p.slug, titre: p.titre, programme: p.programme, annee: p.annee, img: { src: img.src, srcSmall: img.srcSmall, w: img.w, h: img.h, pos } };
  });
  const A = tr(lang, {
    fr: { titre: "Ce qui m'anime", intro: 'Des projets qui m’ont marquée. Cliquez sur une image pour l’ouvrir.', ouvrir: 'Ouvrir', auteur: 'Conception', lieu: 'Lieu', annee: 'Année' },
    en: { titre: 'What drives me', intro: 'Projects that left their mark on me. Click an image to open it.', ouvrir: 'Open', auteur: 'Design', lieu: 'Place', annee: 'Year' },
    it: { titre: 'Ciò che mi anima', intro: 'Progetti che mi hanno segnata. Clicca su un’immagine per aprirla.', ouvrir: 'Apri', auteur: 'Progetto', lieu: 'Luogo', annee: 'Anno' },
  });
  return (
    <>
      <section className={styles.hero} aria-labelledby="nom">
        <div className={styles.heroTxt}>
          <h1 id="nom" className={styles.nom}>Laura<br />Pras</h1>
          <p className={styles.statut}>{t.home.statut}</p>
          <p className={styles.liens}><Portfolio t={t} /></p>
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

      <section id="references" className={`wrap ${styles.anime}`} aria-labelledby="titre-anime">
        <div className={styles.projetsHead}>
          <h2 id="titre-anime" className="eyebrow">{A.titre}</h2>
        </div>
        <p className={styles.animeIntro}>{A.intro}</p>
        <Anime items={getReferences(lang)} labels={A} />
      </section>
    </>
  );
}
