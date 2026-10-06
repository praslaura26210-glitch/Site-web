import Link from 'next/link';
import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

/** Vue liste (l'index sur le terrain 3D arrive à l'étape suivante). */
export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  return (
    <section className={`wrap ${styles.page}`}>
      <h1 className={styles.h1}>{t.nav.projets}</h1>
      <ol className={styles.table}>
        {projets.map((p) => {
          const img = p.images[0];
          return (
            <li key={p.slug}>
              <Link href={`/${lang}/projets/${p.slug}/`}>
                <span className={styles.n}>{String(p.ordre).padStart(2, '0')}</span>
                <span className={styles.t}>{p.titre}</span>
                <span className={styles.m}>{p.programme}</span>
                <span className={styles.m}>{p.lieu}</span>
                <span className={styles.y}>{p.annee}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img className={styles.thumb} src={img.srcSmall} alt="" loading="lazy" />}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
