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
  const annees = projets.map((p) => p.annee).filter((a): a is number => !!a).sort();
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

      {/* la collection : la boîte vide, les livres sortis et posés en éventail ; un clic ouvre le livre */}
      <section id="collection" className={`wrap ${styles.projets}`} aria-labelledby="titre-collection">
        <div className={styles.projetsHead}>
          <h2 id="titre-collection" className="eyebrow">{tr(lang, { fr: 'La collection', en: 'The collection', it: 'La collezione' })}</h2>
          <span className="eyebrow">{String(projets.length).padStart(2, '0')}</span>
        </div>
        <Collection projets={projets} lang={lang} titre={`${t.meta.projetsTitle} ${annees[0]}–${annees[annees.length - 1]}`} aide={tr(lang, { fr: 'Choisissez un livre', en: 'Pick a book', it: 'Scegli un libro' })} />
      </section>
    </>
  );
}
