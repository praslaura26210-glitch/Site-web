import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media, type Media } from '@/lib/media';
import { CHIFFRES, CREDITS, type Img, type Mise, type Texte } from '@/lib/sequences';
import { couverture } from '@/components/home/ProjetsGrille';
import Comparateur from './Comparateur';
import Fiche from './Fiche';
import Parallaxe from './Parallaxe';
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
const PLANCHE = { fr: 'Planche', en: 'Sheet', it: 'Tavola' };

/** Sépare la première phrase (chapeau) du reste du texte. */
function chapeau(texte: string) {
  const i = texte.search(/[.!?]\s/);
  if (i < 0 || i > 260) return { chap: '', reste: texte };
  return { chap: texte.slice(0, i + 1), reste: texte.slice(i + 2) };
}

/**
 * Page projet : ouverture, fiche, puis le projet dans l'une des trois mises en page
 * (blog, livrable, collage — voir src/lib/sequences.ts), et un lien vers le projet suivant.
 */
export default function ProjetPage({ p, t, lang, mise, next, total }: { p: Projet; t: Dict; lang: Lang; mise: Mise; next: Projet; total: number }) {
  const L: Labels = { agrandir: t.projet.agrandir, fermer: t.projet.fermer, hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset };
  const cache = new Map<string, Media>();
  const M = (r: string) => { if (!cache.has(r)) cache.set(r, media(p, r)); return cache.get(r)!; };
  const cr = CREDITS[p.slug] || { defaut: '' };
  const credit = (r: string) => cr.images?.[r.replace(/^\w:/, '')] ?? cr.defaut;
  const { img: cov } = couverture(p);
  const paysage = cov.w > cov.h;
  const { chap, reste } = chapeau(p.texte);
  const strophes = (p.poeme || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

  const image = (i: Img, sizes: string) => {
    if (typeof i === 'string') return <Planche key={i} m={M(i)} sizes={sizes} labels={L} credit={credit(i) || undefined} />;
    const a = M(i.existant), b = M(i.projet);
    return (
      <Comparateur
        key={i.existant}
        existant={{ src: a.src, w: a.w, h: a.h, legende: a.legende }}
        projet={{ src: b.src, w: b.w, h: b.h, legende: b.legende }}
        titre={i.titre[lang]}
        labels={{ existant: t.projet.existant, projet: t.projet.projet, glisser: t.projet.glisser }}
      />
    );
  };
  const legende = (i: Img) => (typeof i === 'string' ? M(i).legende : i.titre[lang]);

  /** Les textes, quel que soit l'endroit où ils sont posés. */
  const texte = (k: Texte | undefined, repli?: string) => {
    if (k === 'projet') return (
      <div className={styles.tProjet}>
        {chap && <p className={styles.chapeau}>{chap}</p>}
        {reste.split(/\n+/).map((x, j) => <p key={j}>{x}</p>)}
      </div>
    );
    if (k === 'chapeau') return <p className={styles.chapeau}>{chap}</p>;
    if (k === 'reste') return <div className={styles.tProjet}>{reste.split(/\n+/).map((x, j) => <p key={j}>{x}</p>)}</div>;
    if (k === 'recit' && p.recit) return (
      <div className={styles.recit}>
        {p.recit_titre && <h3 className={styles.recitT}>{p.recit_titre}</h3>}
        <p>{p.recit.replace(/^«\s*|\s*»$/g, '')}</p>
      </div>
    );
    if (k === 'experimentation' && p.experimentation) return <p className={styles.exp}>{p.experimentation}</p>;
    if (k === 'chiffres' && CHIFFRES[p.slug]) return (
      <dl className={styles.chiffres}>
        {CHIFFRES[p.slug].map((x) => <div key={x.label.fr}><dd>{x.valeur[lang]}</dd><dt>{x.label[lang]}</dt></div>)}
      </dl>
    );
    if (k === 'palette' && p.palette) return (
      <ul className={styles.palette}>
        {Object.entries(p.palette).map(([nom, col]) => (
          <li key={nom}><i style={{ background: col }} /><span>{lang === 'fr' ? nom : PALETTE[nom]?.[lang] || nom}</span></li>
        ))}
      </ul>
    );
    if (k && typeof k === 'object' && 'poeme' in k && strophes.length) return <p className={styles.poeme}>{strophes.slice(k.poeme[0], k.poeme[1]).join('\n\n')}</p>;
    if (k && typeof k === 'object' && 'fr' in k) return <p className={styles.note}>{k[lang]}</p>;
    return repli ? <p className={styles.legendeGrande}>{repli}</p> : null;
  };

  const corps = () => {
    if (mise.type === 'blog') return (
      <div className={`wrap ${styles.blog}`}>
        {mise.lignes.map((l, k) => (
          <section key={k} className={`${styles.ligne} rv`} data-cote={k % 2 ? 'd' : 'g'} data-deux={l.images.length > 1 || undefined}>
            <div className={styles.ligneImg}>{l.images.map((i) => image(i, l.images.length > 1 ? '(max-width: 900px) 100vw, 30vw' : '(max-width: 900px) 100vw, 60vw'))}</div>
            <div className={styles.ligneTxt}>
              <span className={styles.ligneN}>{String(k + 1).padStart(2, '0')}</span>
              {texte(l.texte, l.images.map(legende).join(' · '))}
            </div>
          </section>
        ))}
      </div>
    );
    if (mise.type === 'livrable') return (
      <div className={`wrap ${styles.livrable}`}>
        {mise.planches.map((pl, k) => (
          <section key={k} className={`${styles.planche} rv`} data-n={pl.images.length} data-texte={pl.texte ? '' : undefined}>
            <div className={styles.plCorps}>
              {pl.texte && <div className={styles.plTexte}>{texte(pl.texte)}</div>}
              <div className={styles.plImages}>{pl.images.map((i) => image(i, '(max-width: 900px) 100vw, 40vw'))}</div>
            </div>
            <footer className={styles.cartouche}>
              <span><b>{p.titre}</b> · {p.programme}</span>
              <span className={styles.cartT}>{pl.titre[lang]}</span>
              <span>{PLANCHE[lang]} {k + 1} / {mise.planches.length} · Laura Pras · {p.annee}</span>
            </footer>
          </section>
        ))}
      </div>
    );
    return (
      <div className={`wrap ${styles.collage}`}>
        <Parallaxe />
        {mise.morceaux.map((m, k) => (
          <div
            key={k}
            className={`${styles.morceau} ${m.texte ? styles.morceauTxt : ''} ${m.grand ? styles.morceauGrand : ''}`}
            style={{ gridColumn: `${m.col[0]} / span ${m.col[1]}`, marginTop: m.mt ? `${m.mt}vh` : undefined }}
            data-v={m.v || undefined}
          >
            <div className="rv" style={m.rot ? { ['--rot' as string]: `${m.rot}deg` } : undefined}>
              {m.r ? image(m.r, `(max-width: 900px) 100vw, ${Math.round((m.col[1] / 12) * 90)}vw`) : texte(m.texte)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <article className={styles.projet} data-mise={mise.type}>
      <header className={styles.ouv} data-format={paysage ? 'paysage' : 'portrait'}>
        <div className={styles.ouvTxt}>
          <p className="eyebrow"><span className={styles.ouvN}>{String(p.ordre).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}</p>
          <h1 className={styles.ouvT}>{p.titre}</h1>
          <p className={`eyebrow ${styles.ouvMeta}`}>{[p.programme, p.annee].filter(Boolean).join(' · ')}</p>
        </div>
        <figure className={styles.ouvImg}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cov.src} srcSet={`${cov.srcSmall} 1000w, ${cov.src} 2000w`} sizes={paysage ? '100vw' : '(max-width: 900px) 100vw, 50vw'} alt={cov.legende} width={cov.w} height={cov.h} fetchPriority="high" />
        </figure>
      </header>

      <section className={`wrap ${styles.catFiche} rv`}>
        <Fiche p={p} t={t} />
      </section>

      {corps()}

      <nav className={`wrap ${styles.suite}`} aria-label={t.projet.next}>
        <Link href={`/${lang}/projets/`} className="lien">← {t.projet.back}</Link>
        <Link href={`/${lang}/projets/${next.slug}/`} className={styles.suivant}>
          <span className="eyebrow">{t.projet.next}</span>
          <span className={styles.suivantT}>{next.titre} <span aria-hidden="true">→</span></span>
        </Link>
      </nav>
    </article>
  );
}
