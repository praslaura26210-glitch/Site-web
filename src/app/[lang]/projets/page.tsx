import Link from 'next/link';
import { dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import styles from '@/components/pages/pages.module.css';
import ProjetsIndex from '@/components/pages/ProjetsIndex';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/projets/', `${t.meta.projetsTitle} · Laura Pras`, t.meta.projetsDescription);
}

/** Index : maquettes sur le terrain (vue par défaut si la 3D est possible) ou vue liste. */
export default async function Projets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const projets = getProjets(lang);
  const L = {
    fr: { terrain: 'Terrain', liste: 'Liste', hint: 'Survole une maquette pour la voir, clique pour entrer dans le projet.' },
    en: { terrain: 'Terrain', liste: 'List', hint: 'Hover over a model to light it up, click to enter the project.' },
    it: { terrain: 'Terreno', liste: 'Elenco', hint: 'Passa sopra un plastico per illuminarlo, clicca per entrare nel progetto.' },
  }[lang];
  const liste = (
    <section className={`wrap ${styles.listePage}`}>
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
  return (
    <ProjetsIndex
      liste={liste}
      labels={{ ...L, titre: t.nav.projets }}
      items={projets.map((p) => ({ slug: p.slug, href: `/${lang}/projets/${p.slug}/`, ordre: p.ordre, titre: p.titre, programme: p.programme, annee: p.annee }))}
    />
  );
}
