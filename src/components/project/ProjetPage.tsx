import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media, type Media } from '@/lib/media';
import { CHIFFRES, CREDITS, type Bloc, type Mise } from '@/lib/sequences';
import Bascule from './Bascule';
import Comparateur from './Comparateur';
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
 * Page projet : en tête le titre, le texte et la fiche ; une grande image ; puis les blocs propres au projet
 * (galerie libre, texte avec image, comparaison existant / projet, plan à plusieurs versions, vignettes).
 */
export default function ProjetPage({ p, t, lang, mise, next, total }: { p: Projet; t: Dict; lang: Lang; mise: Mise; next: Projet; total: number }) {
  const L: Labels = { agrandir: t.projet.agrandir, fermer: t.projet.fermer, hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset };
  const cache = new Map<string, Media>();
  const M = (r: string) => { if (!cache.has(r)) cache.set(r, media(p, r)); return cache.get(r)!; };
  const cr = CREDITS[p.slug] || { defaut: '' };
  const credit = (r: string) => cr.images?.[r.replace(/^\w:/, '')] ?? (cr.defaut || undefined);
  const { chap, reste } = chapeau(p.texte);
  const fiche = [
    { label: t.projet.programme, value: p.programme },
    { label: t.projet.lieu, value: p.lieu },
    { label: t.projet.annee, value: p.annee ? String(p.annee) : null },
    { label: t.projet.cadre, value: p.cadre },
  ].filter((x) => x.value);
  let inter = 0;

  const texte = (k: string) => {
    if (k === 'poeme' && p.poeme) return <p className={styles.poeme}>{p.poeme}</p>;
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
      case 'galerie':
        return (
          <div key={k} className={styles.galerie}>
            {b.rangs.map((rang, j) => (
              <div key={j} className={styles.rang}>
                {rang.map((pl) => (
                  <div key={pl.r} className={`${styles.place} rv`} style={{ gridColumn: `${pl.col[0]} / span ${pl.col[1]}`, marginTop: pl.mt ? `${pl.mt}vh` : undefined, alignSelf: pl.bas ? 'end' : undefined }}>
                    <Planche m={M(pl.r)} sizes={`(max-width: 900px) 100vw, ${Math.round((pl.col[1] / 12) * 92)}vw`} labels={L} credit={credit(pl.r)} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      case 'texte': {
        const txt = texte(b.k);
        if (!txt && !b.r) return null;
        return (
          <section key={k} className={`${styles.texteImg} rv`} data-cote={b.cote || 'd'} data-seul={!txt || undefined}>
            {txt && (
              <div className={styles.texteCol}>
                {b.titre && <h2 className={styles.texteT}>{b.titre[lang]}</h2>}
                {txt}
              </div>
            )}
            {b.r && <div className={styles.imageCol}><Planche m={M(b.r)} sizes="(max-width: 900px) 100vw, 50vw" labels={L} credit={credit(b.r)} /></div>}
          </section>
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
      case 'bascule':
        return (
          <section key={k} className={`${styles.basculeBloc} rv`}>
            <Bascule options={b.options.map((o) => ({ label: o.label[lang], m: M(o.r) }))} labels={L} credit={cr.defaut || undefined} />
            <div className={styles.texteCol}>
              <h2 className={styles.texteT}>{b.titre[lang]}</h2>
              {b.chiffres && texte('chiffres')}
            </div>
          </section>
        );
      case 'vignettes':
        return (
          <section key={k} className={`${styles.vignettes} rv`}>
            <div className={styles.vignettesHead}>
              <h2 className={styles.texteT}>{b.titre[lang]}</h2>
              {b.note && <p>{b.note[lang]}</p>}
            </div>
            <div className={styles.vignettesGrille}>
              {b.items.map((r) => <Planche key={r} m={M(r)} sizes="(max-width: 900px) 50vw, 25vw" labels={L} credit={credit(r)} className={styles.vignette} />)}
            </div>
          </section>
        );
    }
  };

  return (
    <article className={styles.projet}>
      <header className={`wrap ${styles.tete}`}>
        <p className="eyebrow"><span className={styles.ouvN}>{String(p.ordre).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}</p>
        <h1 className={styles.titre}>{p.titre}</h1>
        <div className={styles.teteGrille}>
          <div className={styles.intro}>
            {chap && <p className={styles.chapeau}>{chap}</p>}
            {reste.split(/\n+/).map((x, j) => <p key={j}>{x}</p>)}
          </div>
          <dl className={styles.fiche}>
            {fiche.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
          </dl>
        </div>
      </header>

      {mise.hero && (
        <div className={`wrap ${styles.hero}`}>
          <Planche m={M(mise.hero.r)} sizes="100vw" labels={L} credit={credit(mise.hero.r)} caption={false} className={styles.heroFig} pos={mise.hero.pos} eager />
        </div>
      )}

      <div className={`wrap ${styles.corpsProjet}`}>{mise.blocs.map(bloc)}</div>

      <nav className={`wrap ${styles.suite}`} aria-label={t.projet.next}>
        <Link href={`/${lang}/projets/${next.slug}/`} className={styles.suivant}>
          <span className="eyebrow">{t.projet.next}</span>
          <span className={styles.suivantT}>{next.titre} <span aria-hidden="true">→</span></span>
        </Link>
      </nav>
    </article>
  );
}
