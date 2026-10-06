import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media, type Media } from '@/lib/media';
import { CREDITS, type Bloc, type Chapitre } from '@/lib/sequences';
import { couverture } from '@/components/home/ProjetsGrille';
import Comparateur from './Comparateur';
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
const CREDIT_LABEL = { fr: 'Images', en: 'Images', it: 'Immagini' };

/** Sépare la première phrase (chapeau) du reste du texte. */
function chapeau(texte: string) {
  const i = texte.search(/[.!?]\s/);
  if (i < 0 || i > 260) return { chap: '', reste: texte };
  return { chap: texte.slice(0, i + 1), reste: texte.slice(i + 2) };
}

type Rang = { type: 'large'; bloc: Bloc } | { type: 'deux'; gauche: Bloc[]; droite: Bloc[] } | { type: 'seul'; bloc: Bloc; cote: 'g' | 'd' };

/**
 * Mise en page magazine d'une suite d'images : les formats très allongés et les comparaisons prennent
 * toute la largeur ; les autres se répartissent en deux colonnes décalées (la plus courte reçoit l'image suivante).
 */
function composer(blocs: Bloc[], ratio: (b: Bloc) => number): Rang[] {
  const rangs: Rang[] = [];
  let groupe: Bloc[] = [];
  let seul = 0;
  const vider = () => {
    if (groupe.length === 1) rangs.push({ type: 'seul', bloc: groupe[0], cote: seul++ % 2 ? 'd' : 'g' });
    else if (groupe.length > 1) {
      const g: Bloc[] = [], d: Bloc[] = [];
      let hg = 0, hd = 0.35; // la colonne de droite part plus bas
      groupe.forEach((b) => { if (hg <= hd) { g.push(b); hg += 1 / ratio(b); } else { d.push(b); hd += 1 / ratio(b); } });
      rangs.push({ type: 'deux', gauche: g, droite: d });
    }
    groupe = [];
  };
  blocs.forEach((b) => {
    if (!('r' in b) || ratio(b) >= 1.75) { vider(); rangs.push({ type: 'large', bloc: b }); }
    else groupe.push(b);
  });
  vider();
  return rangs;
}

/**
 * Page projet : ouverture, fiche « catalogue », puis chapitres où les images défilent
 * et apparaissent au fur et à mesure, le texte du chapitre restant en place à droite.
 */
export default function ProjetPage({ p, t, lang, chapitres, next, total }: { p: Projet; t: Dict; lang: Lang; chapitres: Chapitre[]; next: Projet; total: number }) {
  const L: Labels = { agrandir: t.projet.agrandir, fermer: t.projet.fermer, hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset };
  const cache = new Map<string, Media>();
  const M = (r: string) => { if (!cache.has(r)) cache.set(r, media(p, r)); return cache.get(r)!; };
  const cr = CREDITS[p.slug] || { defaut: '' };
  const credit = (r: string) => cr.images?.[r.replace(/^\w:/, '')] ?? cr.defaut;
  const ratio = (b: Bloc) => { const m = M('r' in b ? b.r : b.projet); return m.w / m.h; };
  const { img: cov } = couverture(p);
  const paysage = cov.w > cov.h;
  const { chap, reste } = chapeau(p.texte);

  const bloc = (b: Bloc, sizes: string) => {
    if ('r' in b) return <Planche key={b.r} m={M(b.r)} sizes={sizes} labels={L} credit={credit(b.r) || undefined} />;
    const a = M(b.existant), c = M(b.projet);
    return (
      <Comparateur
        key={b.existant}
        existant={{ src: a.src, w: a.w, h: a.h, legende: a.legende }}
        projet={{ src: c.src, w: c.w, h: c.h, legende: c.legende }}
        titre={b.titre[lang]}
        credit={cr.defaut || undefined}
        labels={{ existant: t.projet.existant, projet: t.projet.projet, glisser: t.projet.glisser }}
      />
    );
  };

  const texte = (c: Chapitre) => {
    const k = c.texte;
    if (!k) return null;
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

  return (
    <article className={styles.projet}>
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

      {/* la fiche, comme dans un catalogue */}
      <section className={`wrap ${styles.catalogue}`}>
        <p className={`${styles.chapeau} rv`}>{chap}</p>
        <div className={`${styles.corps} rv`}>{reste.split(/\n+/).map((x, j) => <p key={j}>{x}</p>)}</div>
        <div className={`${styles.catFiche} rv`}>
          <Fiche p={p} t={t} extra={cr.defaut ? [{ label: CREDIT_LABEL[lang], value: cr.defaut.replace(/^©\s*/, '') }] : undefined} />
        </div>
      </section>

      {chapitres.map((c, i) => {
        const txt = texte(c);
        const palette = c.palette && p.palette;
        return (
          <section key={i} className={`wrap ${styles.chap}`}>
            <div className={styles.flux}>
              {composer(c.blocs, ratio).map((rg, k) => {
                if (rg.type === 'large') return <div key={k} className={styles.rLarge}>{bloc(rg.bloc, '(max-width: 900px) 100vw, 62vw')}</div>;
                if (rg.type === 'seul') return <div key={k} className={styles.rSeul} data-cote={rg.cote}>{bloc(rg.bloc, '(max-width: 900px) 100vw, 44vw')}</div>;
                return (
                  <div key={k} className={styles.rDeux}>
                    <div className={styles.pile}>{rg.gauche.map((b) => bloc(b, '(max-width: 900px) 100vw, 31vw'))}</div>
                    <div className={`${styles.pile} ${styles.pileD}`}>{rg.droite.map((b) => bloc(b, '(max-width: 900px) 100vw, 31vw'))}</div>
                  </div>
                );
              })}
            </div>
            <aside className={styles.colonne}>
              <div className={`${styles.colIn} rv`}>
                <h2 className={styles.chapT}>
                  <span className={styles.chapN}>{String(i + 1).padStart(2, '0')}</span>
                  {c.titre[lang]}
                </h2>
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
        <Link href={`/${lang}/projets/`} className="lien">← {t.projet.back}</Link>
        <Link href={`/${lang}/projets/${next.slug}/`} className={styles.suivant}>
          <span className="eyebrow">{t.projet.next}</span>
          <span className={styles.suivantT}>{next.titre} <span aria-hidden="true">→</span></span>
        </Link>
      </nav>
    </article>
  );
}
