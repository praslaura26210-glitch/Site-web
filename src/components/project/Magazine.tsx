import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media } from '@/lib/media';
import type { Bloc } from '@/lib/sequences';
import { couverture } from '@/components/home/ProjetsGrille';
import Croquis from './Croquis';
import Fiche from './Fiche';
import Planche, { type Labels } from './Planche';
import styles from './project.module.css';

const PALETTE: Record<string, { en: string; it: string }> = {
  'Peinture beige': { en: 'Beige paint', it: 'Pittura beige' },
  'Peinture rose': { en: 'Pink paint', it: 'Pittura rosa' },
  'Bois clair': { en: 'Light wood', it: 'Legno chiaro' },
  'Béton ciré': { en: 'Polished concrete', it: 'Cemento spatolato' },
  'Terrazzo rose': { en: 'Pink terrazzo', it: 'Terrazzo rosa' },
  'Menuiseries aluminium': { en: 'Aluminium frames', it: 'Serramenti in alluminio' },
};

/** Sépare la première phrase (chapeau) du reste du texte. */
function chapeau(texte: string) {
  const i = texte.search(/[.!?]\s/);
  if (i < 0 || i > 260) return { chap: '', reste: texte };
  return { chap: texte.slice(0, i + 1), reste: texte.slice(i + 2) };
}

export default function Magazine({ p, t, lang, blocs, next, total }: { p: Projet; t: Dict; lang: Lang; blocs: Bloc[]; next: Projet; total: number }) {
  const L: Labels = { agrandir: t.projet.agrandir, fermer: t.projet.fermer, hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset };
  const M = (r: string) => media(p, r);
  const { img: cov } = couverture(p);
  const paysage = cov.w > cov.h;
  const nextCov = couverture(next).img;
  let chap = 0;

  const texteLibre = (k?: 'recit' | 'poeme' | 'experimentation') => {
    if (k === 'recit' && p.recit) return (
      <div className={styles.recit}>
        {p.recit_titre && <h2 className={styles.recitT}>{p.recit_titre}</h2>}
        <p>{p.recit.replace(/^«\s*|\s*»$/g, '')}</p>
      </div>
    );
    if (k === 'poeme' && p.poeme) return <p className={styles.poeme}>{p.poeme}</p>;
    if (k === 'experimentation' && p.experimentation) return <div className={styles.exp}><p>{p.experimentation}</p></div>;
    return null;
  };

  const rendu = (b: Bloc, i: number) => {
    switch (b.t) {
      case 'texte': {
        const { chap: c, reste } = chapeau(p.texte);
        return (
          <section key={i} className={`wrap ${styles.texte}`}>
            <div className={styles.texteCorps}>
              {c && <p className={`${styles.chapeau} rv`}>{c}</p>}
              <div className={`${styles.corps} rv`}>{reste.split(/\n+/).map((x, j) => <p key={j}>{x}</p>)}</div>
            </div>
            <aside className={`${styles.texteFiche} rv`}><Fiche p={p} t={t} /></aside>
          </section>
        );
      }
      case 'chiffres':
        return (
          <section key={i} className={`wrap ${styles.chiffres}`}>
            {b.items.map((x) => (
              <div key={x.label.fr} className="rv"><strong>{x.valeur[lang]}</strong><span>{x.label[lang]}</span></div>
            ))}
          </section>
        );
      case 'chapitre':
        chap++;
        return (
          <h2 key={i} className={`wrap ${styles.chapitre} rv`}>
            <span className={styles.chapN}>{String(chap).padStart(2, '0')}</span>
            <span>{b.titre[lang]}</span>
          </h2>
        );
      case 'pleine':
        return <div key={i} className={styles.pleine}><Planche m={M(b.r)} sizes="100vw" labels={L} /></div>;
      case 'large':
        return <div key={i} className={`wrap ${styles.large} ${b.etroit ? styles.etroit : ''}`}><Planche m={M(b.r)} sizes="(max-width: 900px) 100vw, 80vw" labels={L} /></div>;
      case 'decale': {
        const txt = texteLibre(b.texte);
        return (
          <section key={i} className={`wrap ${styles.decale}`} data-cote={b.cote} data-texte={txt ? '' : undefined}>
            <Planche m={M(b.r)} sizes="(max-width: 900px) 100vw, 58vw" labels={L} className={styles.decaleFig} />
            {txt && <div className={`${styles.decaleTxt} rv`}>{txt}</div>}
          </section>
        );
      }
      case 'duo':
        return (
          <div key={i} className={`wrap ${styles.duo}`} data-egal={b.egal ? '' : undefined}>
            <Planche m={M(b.a)} sizes="(max-width: 900px) 100vw, 55vw" labels={L} />
            <Planche m={M(b.b)} sizes="(max-width: 900px) 100vw, 45vw" labels={L} />
          </div>
        );
      case 'pile':
        return (
          <div key={i} className={`wrap ${styles.pile}`}>
            {b.r.map((r, j) => (
              <div key={r} className={styles.pileItem}>
                {b.etiquettes && <span className={styles.etiquette}>{j === 0 ? t.projet.existant : t.projet.projet}</span>}
                <Planche m={M(r)} sizes="(max-width: 900px) 100vw, 80vw" labels={L} />
              </div>
            ))}
          </div>
        );
      case 'trio':
        return <div key={i} className={`wrap ${styles.trio}`}>{b.r.map((r) => <Planche key={r} m={M(r)} sizes="(max-width: 900px) 100vw, 33vw" labels={L} />)}</div>;
      case 'grille':
        return <div key={i} className={`wrap ${styles.grille}`}>{b.r.map((r) => <Planche key={r} m={M(r)} sizes="(max-width: 900px) 50vw, 25vw" labels={L} />)}</div>;
      case 'croquis': {
        const m = M(b.r);
        const txt = texteLibre(b.texte);
        return (
          <section key={i} className={`wrap ${styles.croquisBloc}`}>
            <Croquis json={`/media/${p.slug}/${b.json}`} src={m.src} srcSmall={m.srcSmall!} w={m.w} h={m.h} alt={m.legende} caption={m.legende} duree={3600} className={styles.croquisFig} />
            {b.avec ? <Planche m={M(b.avec)} sizes="(max-width: 900px) 100vw, 40vw" labels={L} className={styles.croquisAvec} /> : txt && <div className={`${styles.croquisTxt} rv`}>{txt}</div>}
          </section>
        );
      }
      case 'palette':
        return (
          <section key={i} className={`wrap ${styles.paletteBloc}`}>
            <ul className={styles.palette}>
              {Object.entries(p.palette || {}).map(([nom, c]) => (
                <li key={nom} className="rv"><i style={{ background: c }} /><span>{lang === 'fr' ? nom : PALETTE[nom]?.[lang] || nom}</span></li>
              ))}
            </ul>
            <Planche m={M(b.r)} sizes="(max-width: 900px) 100vw, 40vw" labels={L} />
          </section>
        );
    }
  };

  return (
    <article className={styles.projet}>
      <header className={styles.ouv} data-format={paysage ? 'paysage' : 'portrait'}>
        <div className={`wrap ${styles.ouvTxt}`}>
          <p className={styles.ouvN}>
            <span>{String(p.ordre).padStart(2, '0')}</span>
            <span aria-hidden="true">/</span>
            <span>{String(total).padStart(2, '0')}</span>
          </p>
          <h1 className={styles.ouvT}>{p.titre}</h1>
          <p className={styles.ouvMeta}>
            {[p.programme, p.lieu, p.annee].filter(Boolean).join(' · ')}
          </p>
        </div>
        <figure className={styles.ouvImg}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cov.src} srcSet={`${cov.srcSmall} 1000w, ${cov.src} 2000w`} sizes={paysage ? '100vw' : '(max-width: 900px) 100vw, 50vw'} alt={cov.legende} width={cov.w} height={cov.h} fetchPriority="high" />
        </figure>
      </header>

      {blocs.map(rendu)}

      <nav className={`wrap ${styles.suite}`} aria-label={t.projet.next}>
        <Link href={`/${lang}/projets/${next.slug}/`} className={styles.suivant}>
          <span className="eyebrow">{t.projet.next}</span>
          <strong>{next.titre}</strong>
          <span className={styles.suivantP}>{next.programme}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={nextCov.srcSmall} alt="" width={nextCov.w} height={nextCov.h} loading="lazy" />
        </Link>
        <Link href={`/${lang}/projets/`} className={styles.tous}>← {t.projet.back}</Link>
      </nav>
    </article>
  );
}
