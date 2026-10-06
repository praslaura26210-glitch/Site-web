import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media, type Media } from '@/lib/media';
import { CHIFFRES, CREDITS, type Bloc, type Mise } from '@/lib/sequences';
import Comparateur from './Comparateur';
import Planche, { type Labels } from './Planche';
import Visionneuse from './Visionneuse';
import Parallaxe from './Parallaxe';
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

/** Page projet : ouverture (titre et grande image), présentation, puis les blocs choisis pour ce projet. */
export default function ProjetPage({ p, t, lang, mise, next, total }: { p: Projet; t: Dict; lang: Lang; mise: Mise; next: Projet; total: number }) {
  const L: Labels = { agrandir: t.projet.agrandir, fermer: t.projet.fermer, hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset };
  const VL = { ...L, precedent: t.projet.precedent, suivant: t.projet.suivant };
  const cache = new Map<string, Media>();
  const M = (r: string) => { if (!cache.has(r)) cache.set(r, media(p, r)); return cache.get(r)!; };
  const cr = CREDITS[p.slug] || { defaut: '' };
  const credit = (r: string) => cr.images?.[r.replace(/^\w:/, '')] ?? (cr.defaut || undefined);
  const { chap, reste } = chapeau(p.texte);
  const cov = M(mise.ouverture);
  const paysage = cov.w > cov.h;
  const fiche = [
    { label: t.projet.programme, value: p.programme },
    { label: t.projet.lieu, value: p.lieu },
    { label: t.projet.annee, value: p.annee ? String(p.annee) : null },
    { label: t.projet.cadre, value: p.cadre },
  ].filter((x) => x.value);
  let inter = 0;

  const texte = (k: string) => {
    if (k === 'poeme' && p.poeme) return (
      <div className={styles.poeme}>
        {p.poeme.split(/\n\s*\n/).map((strophe, j) => <p key={j}>{strophe.trim()}</p>)}
      </div>
    );
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
    return null;
  };

  const bloc = (b: Bloc, k: number) => {
    switch (b.t) {
      case 'inter':
        inter++;
        return (
          <header key={k} className={`${styles.inter} rv`}>
            <span className={styles.interN}>{String(inter).padStart(2, '0')}</span>
            <h2>{b.titre[lang]}</h2>
            {b.note && <p>{b.note[lang]}</p>}
          </header>
        );
      case 'grand':
        return <div key={k} className={`${styles.grand} rv`}><Planche m={M(b.r)} sizes="100vw" labels={L} credit={credit(b.r)} /></div>;
      case 'rang':
        // chaque image prend une largeur proportionnelle à son format : toutes ont la même hauteur
        return (
          <div key={k} className={`${styles.rangee} rv`}>
            {b.r.map((r) => {
              const m = M(r);
              return (
                <div key={r} className={styles.rangItem} style={{ flexGrow: m.w / m.h }}>
                  <Planche m={m} sizes={`(max-width: 900px) 100vw, ${Math.round(100 / b.r.length)}vw`} labels={L} credit={credit(r)} />
                </div>
              );
            })}
          </div>
        );
      case 'texte': {
        const txt = texte(b.k);
        if (!txt) return null;
        return (
          <section key={k} className={`${styles.texteImg} rv`} data-cote={b.cote || 'd'} data-seul={!b.r || undefined} data-colonnes={b.colonnes || undefined}>
            {b.colonnes && <p className={styles.poemeTitre}>{p.titre}</p>}
            <div className={styles.texteCol}>
              {b.titre && <h2 className={styles.texteT}>{b.titre[lang]}</h2>}
              {txt}
            </div>
            {b.r && <div className={styles.imageCol}><Planche m={M(b.r)} sizes="(max-width: 900px) 100vw, 55vw" labels={L} credit={credit(b.r)} /></div>}
          </section>
        );
      }
      case 'visionneuse':
        return <Visionneuse key={k} items={b.r.map(M)} labels={VL} credit={cr.defaut || undefined} aside={b.k ? texte(b.k) : undefined} />;
      case 'composition': {
        // cases carrées : une image de largeur l et de format w/h occupe environ l / (w/h) lignes
        const fin = Math.max(...b.items.map((it) => { const m = M(it.r); return it.ligne + Math.ceil(it.col[1] / (m.w / m.h)); }));
        return (
          <div key={k} className={styles.compo}>
            <div className={styles.compoGrille} style={{ gridTemplateRows: `repeat(${fin - 1}, var(--u))` }}>
              {b.items.map((it, j) => {
                const m = M(it.r);
                const lignes = Math.ceil(it.col[1] / (m.w / m.h));
                return (
                  <div
                    key={it.r}
                    className={`${styles.compoItem} ${it.dessus ? styles.dessus : ''} rv`}
                    style={{ gridColumn: `${it.col[0]} / span ${it.col[1]}`, gridRow: `${it.ligne} / span ${lignes}`, ['--d' as string]: `${j * 0.12}s` }}
                    data-v={it.dessus ? '0.07' : undefined}
                  >
                    <Planche m={m} sizes={`(max-width: 900px) 100vw, ${Math.round((it.col[1] / 12) * 100)}vw`} labels={L} credit={credit(it.r)} caption={false} />
                  </div>
                );
              })}
            </div>
            {b.legende !== false && <p className={styles.compoLeg}>{b.items.map((it) => M(it.r).legende).join(' · ')}</p>}
            {b.legende === false && <p className={styles.compoLeg}>{M(b.items[0].r).legende}</p>}
          </div>
        );
      }
      case 'comparer':
        return (
          <div key={k} className={styles.comparer} data-deux={b.deux || undefined}>
            {b.items.map((c) => {
              const a = M(c.existant), d = M(c.projet);
              return (
                <Comparateur
                  key={c.existant}
                  existant={{ src: a.src, w: a.w, h: a.h, legende: a.legende }}
                  projet={{ src: d.src, w: d.w, h: d.h, legende: d.legende }}
                  titre={c.titre[lang]}
                  labels={{ existant: t.projet.existant, projet: t.projet.projet, glisser: t.projet.glisser }}
                />
              );
            })}
          </div>
        );
    }
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
          <img src={cov.src} srcSet={cov.srcSmall ? `${cov.srcSmall} 1000w, ${cov.src} 2000w` : undefined} sizes={paysage ? '100vw' : '(max-width: 900px) 100vw, 50vw'} alt={cov.legende} width={cov.w} height={cov.h} fetchPriority="high" style={mise.pos ? { objectPosition: mise.pos } : undefined} />
        </figure>
      </header>

      <section className={`wrap ${styles.presentation}`}>
        <p className={`${styles.chapeau} rv`}>{chap}</p>
        <div className={`${styles.corps} rv`}>{reste.split(/\n+/).map((x, j) => <p key={j}>{x}</p>)}</div>
        <dl className={`${styles.fiche} rv`}>
          {fiche.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
      </section>

      <div className={`wrap ${styles.corpsProjet}`}>{mise.blocs.map(bloc)}</div>
      {mise.blocs.some((b) => b.t === 'composition') && <Parallaxe />}

      <nav className={`wrap ${styles.suite}`} aria-label={t.projet.next}>
        <Link href={`/${lang}/projets/${next.slug}/`} className={styles.suivant}>
          <span className="eyebrow">{t.projet.next}</span>
          <span className={styles.suivantT}>{next.titre} <span aria-hidden="true">→</span></span>
        </Link>
      </nav>
    </article>
  );
}
