import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import Collection from '@/components/home/Collection';
import { tr } from '@/lib/tr';
import Couloir from '@/components/home/Couloir';
import Portfolio from '@/components/home/Portfolio';
import styles from '@/components/home/home.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/', `Laura Pras · ${t.home.statut}`, t.meta.siteDescription);
}

/** Accueil : le dessin au centre, le nom, une ligne, le portfolio ; dessous, la collection des projets en livres. */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
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

      {/* la collection, bien plus bas : un livre par projet ; un clic l'ouvre et on le feuillette */}
      <section id="collection" className={`wrap ${styles.projets} ${styles.collection}`} aria-labelledby="titre-collection">
        <div className={styles.projetsHead}>
          <h2 id="titre-collection" className="eyebrow">{tr(lang, { fr: 'La collection', en: 'The collection', it: 'La collezione' })}</h2>
          <span className="eyebrow">{String(projets.length).padStart(2, '0')}</span>
        </div>
        <Collection projets={projets} lang={lang} />
      </section>
    </>
  );
}
