import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import { couverture } from '@/components/home/ProjetsGrille';
import ProjetsIndex from '@/components/home/ProjetsIndex';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

/** Projets : la liste des projets ; au survol, la grande image du projet ; un clic ouvre sa page. */
export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  const lignes = projets.map((p) => {
    const { img, pos } = couverture(p);
    return { slug: p.slug, titre: p.titre, programme: p.programme, annee: p.annee, img: { src: img.src, srcSmall: img.srcSmall, w: img.w, h: img.h, pos } };
  });
  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.pHead}>
        <h1 className={styles.h1}>{t.meta.projetsTitle}</h1>
      </header>
      <ProjetsIndex lignes={lignes} lang={lang} voir={t.home.voir} />
    </div>
  );
}
