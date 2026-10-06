import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media } from '@/lib/media';
import type { Chapitre, Visuel } from '@/lib/sequences';
import { couverture } from '@/components/home/ProjetsGrille';
import Comparateur from './Comparateur';
import Esquisse from './Esquisse';
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

/**
 * Page projet « blog » : une ouverture, puis des chapitres.
 * À gauche les images défilent ; à droite le texte du chapitre reste en place.
 */
export default function ProjetPage({ p, t, lang, chapitres, next, total }: { p: Projet; t: Dict; lang: Lang; chapitres: Chapitre[]; next: Projet; total: number }) {
  const L: Labels = { agrandir: t.projet.agrandir, fermer: t.projet.fermer, hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset };
  const M = (r: string) => media(p, r);
  const { img: cov } = couverture(p);
  const paysage = cov.w > cov.h;
  const nextCov = couverture(next).img;

  const visuel = (v: Visuel, i: number) => {
    if ('r' in v) return <Planche key={i} m={M(v.r)} sizes="(max-width: 900px) 100vw, 58vw" labels={L} />;
    if ('duo' in v) return <div key={i} className={styles.duo}>{v.duo.map((r) => <Planche key={r} m={M(r)} sizes="(max-width: 900px) 100vw, 29vw" labels={L} />)}</div>;
    if ('grille' in v) return <div key={i} className={styles.grille}>{v.grille.map((r) => <Planche key={r} m={M(r)} sizes="(max-width: 900px) 50vw, 29vw" labels={L} />)}</div>;
    if ('esquisse' in v) {
      const m = M(v.esquisse);
      return <Esquisse key={i} src={m.src} srcSmall={m.srcSmall!} w={m.w} h={m.h} alt={m.legende} caption={m.legende} fuite={v.fuite} duree={3200} sizes="(max-width: 900px) 100vw, 58vw" />;
    }
    return (
      <Comparateur
        key={i}
        paires={v.comparer.map((c) => {
          const a = M(c.existant), b = M(c.projet);
          return { titre: c.titre[lang], existant: { src: a.src, w: a.w, h: a.h, legende: a.legende }, projet: { src: b.src, w: b.w, h: b.h, legende: b.legende } };
        })}
        labels={{ existant: t.projet.existant, projet: t.projet.projet, glisser: t.projet.glisser }}
      />
    );
  };

  const texte = (c: Chapitre) => {
    const k = c.texte;
    if (!k) return null;
    if (k === 'projet') {
      const { chap, reste } = chapeau(p.texte);
      return (
        <>
          {chap && <p className={styles.chapeau}>{chap}</p>}
          <div className={styles.corps}>{reste.split(/\n+/).map((x, j) => <p key={j}>{x}</p>)}</div>
          <Fiche p={p} t={t} />
        </>
      );
    }
    if (k === 'recit') return p.recit ? (
      <div className={styles.recit}>
        {p.recit_titre && <h3 className={styles.recitT}>{p.recit_titre}</h3>}
        <p>{p.recit.replace(/^«\s*|\s*»$/g, '')}</p>
      </div>
    ) : null;
    if (k === 'poeme') return p.poeme ? <p className={styles.poeme}>{p.poeme}</p> : null;
    if (k === 'experimentation') return p.experimentation ? <p className={styles.exp}>{p.experimentation}</p> : null;
    return <p className={styles.note}>{k[lang]}</p>;
  };

  let n = 0;
  return (
    <article className={styles.projet}>
      <header className={styles.ouv} data-format={paysage ? 'paysage' : 'portrait'}>
        <div className={styles.ouvTxt}>
          <p className="eyebrow">{String(p.ordre).padStart(2, '0')} / {String(total).padStart(2, '0')}</p>
          <h1 className={styles.ouvT}>{p.titre}</h1>
          <p className={`eyebrow ${styles.ouvMeta}`}>{[p.programme, p.lieu, p.annee].filter(Boolean).join(' · ')}</p>
        </div>
        <figure className={styles.ouvImg}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cov.src} srcSet={`${cov.srcSmall} 1000w, ${cov.src} 2000w`} sizes={paysage ? '100vw' : '(max-width: 900px) 100vw, 50vw'} alt={cov.legende} width={cov.w} height={cov.h} fetchPriority="high" />
        </figure>
      </header>

      {chapitres.map((c, i) => {
        const txt = texte(c);
        const numero = c.titre ? String(++n).padStart(2, '0') : null;
        const palette = c.palette && p.palette;
        return (
          <section key={i} className={`wrap ${styles.chap}`}>
            <div className={styles.visuels}>{c.visuels.map(visuel)}</div>
            <aside className={styles.colonne}>
              <div className={`${styles.colIn} rv`}>
                {c.titre && (
                  <h2 className={styles.chapT}>
                    <span className="eyebrow">{numero}</span>
                    {c.titre[lang]}
                  </h2>
                )}
                {txt}
                {c.chiffres && (
                  <dl className={styles.chiffres}>
                    {c.chiffres.map((x) => <div key={x.label.fr}><dd>{x.valeur[lang]}</dd><dt>{x.label[lang]}</dt></div>)}
                  </dl>
                )}
                {palette && (
                  <ul className={styles.palette}>
                    {Object.entries(palette).map(([nom, col]) => (
                      <li key={nom}><i style={{ background: col }} /><span>{lang === 'fr' ? nom : PALETTE[nom]?.[lang] || nom}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </section>
        );
      })}

      <nav className={`wrap ${styles.suite}`} aria-label={t.projet.next}>
        <Link href={`/${lang}/projets/${next.slug}/`} className={styles.suivant}>
          <span className="eyebrow">{t.projet.next}</span>
          <strong>{next.titre}</strong>
          <span className={`eyebrow ${styles.suivantP}`}>{next.programme}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={nextCov.srcSmall} alt="" width={nextCov.w} height={nextCov.h} loading="lazy" />
        </Link>
        <Link href={`/${lang}/projets/`} className="lien">{t.projet.back}</Link>
      </nav>
    </article>
  );
}
