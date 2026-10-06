import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import Fiche from './Fiche';
import Reveal from './Reveal';
import styles from './project.module.css';

/** Page projet provisoire (fiche, texte, images) en attendant son traitement propre. */
export default function GenericProject({ p, t, lang, next }: { p: Projet; t: Dict; lang: Lang; next: Projet }) {
  const photos = p.images.filter((i) => i.type !== 'planche');
  const [first, ...rest] = photos;
  return (
    <article>
      <header className={`wrap ${styles.hero}`}>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.num}>{String(p.ordre).padStart(2, '0')}</p>
            <h1 className={styles.title}>{p.titre}</h1>
            <Fiche p={p} t={t} />
          </div>
          {first && <Reveal src={first.src} srcSmall={first.srcSmall} alt={first.legende} w={first.w} h={first.h} caption={first.legende} className={styles.heroImg} />}
        </div>
      </header>
      <section className={`wrap ${styles.textBlock}`}>
        <p className="lead">{p.programme}</p>
        <div className="prose">
          <p>{p.texte}</p>
          {p.experimentation && <p>{p.experimentation}</p>}
        </div>
      </section>
      <section className={styles.paper} style={{ paddingTop: 0 }}>
        <div className={`wrap ${styles.gallery}`}>
          {rest.map((i) => <Reveal key={i.nom} src={i.src} srcSmall={i.srcSmall} alt={i.legende} w={i.w} h={i.h} caption={i.legende} />)}
        </div>
      </section>
      <div className="wrap">
        <Link className={styles.next} href={`/${lang}/projets/${next.slug}/`}>
          <span className="eyebrow">{t.projet.next}</span>
          <strong>{next.titre}</strong>
        </Link>
      </div>
    </article>
  );
}
