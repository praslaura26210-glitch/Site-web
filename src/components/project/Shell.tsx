import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Image, Plan, Projet } from '@/lib/content';
import Fiche from './Fiche';
import Reveal from './Reveal';
import styles from './project.module.css';

export const tr = <T,>(lang: Lang, v: { fr: T; en: T; it: T }) => v[lang];

/** Ouverture commune : numéro, titre, fiche, image. */
export function Hero({ p, t, img, extra }: { p: Projet; t: Dict; img: Image; extra?: { label: string; value: string }[] }) {
  return (
    <header className={`wrap ${styles.hero}`}>
      <div className={styles.heroGrid}>
        <div>
          <p className={styles.num}>{String(p.ordre).padStart(2, '0')}</p>
          <h1 className={styles.title}>{p.titre}</h1>
          <Fiche p={p} t={t} extra={extra} />
        </div>
        <Reveal src={img.src} srcSmall={img.srcSmall} alt={img.legende} w={img.w} h={img.h} caption={img.legende} className={styles.heroImg} />
      </div>
    </header>
  );
}

export function Section({ title, text, children, first }: { title: string; text?: string; children: React.ReactNode; first?: boolean }) {
  return (
    <section className={styles.paper} style={first ? undefined : { paddingTop: 0 }}>
      <div className="wrap">
        <div className={styles.secHead}><h2>{title}</h2>{text ? <p>{text}</p> : <p />}</div>
        {children}
      </div>
    </section>
  );
}

export function Next({ lang, t, next }: { lang: Lang; t: Dict; next: Projet }) {
  return (
    <div className="wrap">
      <Link className={styles.next} href={`/${lang}/projets/${next.slug}/`}>
        <span className="eyebrow">{t.projet.next}</span>
        <strong>{next.titre}</strong>
      </Link>
    </div>
  );
}

/** Entrée de la visionneuse pour une image raster (aperçu 2000 px, pleine résolution au zoom). */
export function rasterPlan(slug: string, img: Image, label?: string) {
  return { id: img.nom, label: label || img.legende, preview: img.src, full: `/media/${slug}/images/${img.nom}-full.webp`, ratio: img.w / img.h };
}
/** Entrée de la visionneuse pour un plan vectoriel. */
export function vectorPlan(pl: Plan, label?: string) {
  return { id: pl.nom, label: label || pl.legende, svg: pl.src, ratio: (pl.w + 8) / (pl.h + 8), ko: pl.ko };
}

export function Photos({ imgs }: { imgs: Image[] }) {
  return (
    <div className={styles.photos}>
      {imgs.map((i) => <Reveal key={i.nom} src={i.src} srcSmall={i.srcSmall} alt={i.legende} w={i.w} h={i.h} caption={i.legende} />)}
    </div>
  );
}
