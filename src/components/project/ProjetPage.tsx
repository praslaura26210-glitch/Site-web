import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media, type Media } from '@/lib/media';
import { CHIFFRES, CREDITS, type Bloc, type Mise } from '@/lib/sequences';
import { ancreDessin } from '@/lib/experience';
import { v } from '@/lib/ver';
import { couverture } from '@/components/home/ProjetsGrille';
import Comparateur from './Comparateur';
import Planche, { type Labels } from './Planche';
import Materiautheque, { PALETTE } from './Materiautheque';
import Visionneuse from './Visionneuse';
import styles from './project.module.css';


/** Page projet : la grande image et le nom, le descriptif, puis les chapitres (images à gauche, textes à droite). */
export default function ProjetPage({ p, t, lang, mise, next, prev, total }: { p: Projet; t: Dict; lang: Lang; mise: Mise; next: Projet; prev: Projet; total: number }) {
  const L: Labels = { agrandir: t.projet.agrandir, fermer: t.projet.fermer, hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset };
  const VL = { ...L, precedent: t.projet.precedent, suivant: t.projet.suivant };
  const cache = new Map<string, Media>();
  const M = (r: string) => { if (!cache.has(r)) cache.set(r, media(p, r)); return cache.get(r)!; };
  const cr = CREDITS[p.slug] || { defaut: '' };
  const credit = (r: string) => cr.images?.[r.replace(/^\w:/, '')] ?? (cr.defaut || undefined);
  const cov = M(mise.ouverture);
  // voix de Laura (facultative) : content/projets/<slug>/audio/presentation.mp3
  const voixFichier = ['presentation.mp3', 'presentation.m4a'].find((f) => fs.existsSync(path.join(process.cwd(), 'content/projets', p.slug, 'audio', f)));
  const voix = voixFichier ? v(`/media/${p.slug}/audio/${voixFichier}`) : null;

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
        return null;
      case 'grand':
        return <div key={k} className={styles.grand}><Planche m={M(b.r)} sizes="100vw" labels={L} credit={credit(b.r)} ancre={ancreDessin(b.r)} /></div>;
      case 'rang':
        // chaque image prend une largeur proportionnelle à son format : toutes ont la même hauteur
        return (
          <div key={k} className={styles.rangee}>
            {b.r.map((r) => {
              const m = M(r);
              return (
                <div key={r} className={styles.rangItem} style={{ flexGrow: m.w / m.h }}>
                  <Planche m={m} sizes={`(max-width: 900px) 100vw, ${Math.round(100 / b.r.length)}vw`} labels={L} credit={credit(r)} ancre={ancreDessin(r)} />
                </div>
              );
            })}
          </div>
        );
      case 'texte':
        // le texte va dans la colonne de droite du chapitre ; ici, seulement son image
        return b.r ? <div key={k} className={styles.grand}><Planche m={M(b.r)} sizes="(max-width: 900px) 100vw, 60vw" labels={L} credit={credit(b.r)} ancre={ancreDessin(b.r)} /></div> : null;
      case 'materiaux':
        return <Materiautheque key={k} lang={lang} credit={cr.defaut || undefined} />;
      case 'visionneuse':
        return <Visionneuse key={k} ids={b.r.map(ancreDessin)} items={b.r.map(M)} labels={VL} credit={cr.defaut || undefined} />;
      case 'composition':
        return (
          <div key={k} className={styles.compo}>
            {b.rangs.map((rang, j) => (
              <div key={j} className={styles.compoRang}>
                {rang.map((it) => (
                  <div key={it.r} className={styles.compoItem} style={{ gridColumn: `${it.col[0]} / span ${it.col[1]}`, marginTop: it.mt ? `${it.mt}vh` : undefined }}>
                    <Planche m={M(it.r)} sizes={`(max-width: 900px) 100vw, ${Math.round((it.col[1] / 12) * 100)}vw`} labels={L} credit={credit(it.r)} ancre={ancreDessin(it.r)} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
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

  // les chapitres : à gauche les images du chapitre, qui défilent ; à droite son titre et ses textes, qui restent à l'écran
  type Chap = { titre?: string; note?: string; textes: React.ReactNode[]; medias: React.ReactNode[] };
  const chapitres: Chap[] = [];
  let cur: Chap = { textes: [], medias: [] };
  mise.blocs.forEach((b, k) => {
    if (b.t === 'inter') {
      if (cur.medias.length || cur.textes.length) chapitres.push(cur);
      cur = { titre: b.titre[lang], note: b.note?.[lang], textes: [], medias: [] };
      return;
    }
    if (b.t === 'texte' || (b.t === 'visionneuse' && b.k)) {
      const txt = texte(b.k!);
      if (txt) cur.textes.push(<div key={`t${k}`} className={styles.chapBloc}>{b.t === 'texte' && b.titre && <h3 className={styles.chapSousT}>{b.titre[lang]}</h3>}{txt}</div>);
    }
    const m = bloc(b, k);
    if (m) cur.medias.push(m);
  });
  if (cur.medias.length || cur.textes.length) chapitres.push(cur);

  return (
    <article className={styles.projet} data-projet={p.slug}>
      <header className={styles.ouv} data-format={cov.w > cov.h ? 'paysage' : 'portrait'}>
        <div className={styles.ouvTxt}>
          <p className="eyebrow"><span className={styles.ouvN}>{String(p.ordre).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}</p>
          <h1 className={styles.ouvT}>{p.titre}</h1>
          <p className={`eyebrow ${styles.ouvMeta}`}>{[p.programme, p.annee].filter(Boolean).join(' · ')}</p>
        </div>
        <figure className={styles.ouvImg}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cov.src} srcSet={cov.srcSmall ? `${cov.srcSmall} 1000w, ${cov.src} 2000w` : undefined} sizes={cov.w > cov.h ? '100vw' : '(max-width: 900px) 100vw, 50vw'} alt={cov.legende} width={cov.w} height={cov.h} fetchPriority="high" style={mise.pos ? { objectPosition: mise.pos } : undefined} data-xp-cover />
        </figure>
      </header>

      {/* le descriptif : les informations à gauche, le texte à droite (le titre est déjà au-dessus) */}
      <section className={`wrap ${styles.presentation}`} id="presentation" data-chapitre={t.xp.presentation}>
        <ul className={`${styles.livretInfos} rv`}>
          <li>{p.programme}</li>
          {p.cadre && <li>{p.cadre}</li>}
          {p.annee && <li>{t.projet.annee} : {p.annee}</li>}
          {p.lieu && <li>{t.projet.lieu} : {p.lieu}</li>}
        </ul>
        <div className={`${styles.livretTexte} rv`}>
          {p.texte.split(/\n+/).map((x, j) => <p key={j}>{x}</p>)}
          {voix && (
            <button type="button" className="xp-ecoute" data-ecoute={voix} data-pause={t.xp.ecouterPause}>
              <span className="xp-ecoute-icone" aria-hidden="true" />
              <span className="xp-ecoute-t">{t.xp.ecouter}</span>
              <span className="xp-ecoute-temps" aria-hidden="true" />
              <span className="xp-ecoute-barre" aria-hidden="true"><i /></span>
            </button>
          )}
        </div>
      </section>

      {/* chaque dessin, chaque image n'apparaît qu'une fois : dans son chapitre */}
      <div className={`wrap ${styles.corpsProjet}`}>
        {chapitres.map((c, i) => (
          <section key={i} className={styles.chap} id={`chapitre-${i + 1}`} data-chapitre={c.titre || t.xp.presentation} data-sans-media={c.medias.length ? undefined : ''}>
            <div className={styles.chapMedias}>{c.medias}</div>
            <aside className={styles.chapTexte}>
              <div className={styles.chapColle}>
                <span className={styles.interN}>{String(i + 1).padStart(2, '0')}</span>
                {c.titre && <h2 className={styles.chapT}>{c.titre}</h2>}
                {c.note && <p className={styles.chapNote}>{c.note}</p>}
                {c.textes}
              </div>
            </aside>
          </section>
        ))}
      </div>

      <nav className={`wrap ${styles.suite}`} aria-label={t.projet.next} id="suite" data-chapitre={t.projet.next}>
        <Link href={`/${lang}/projets/${prev.slug}/`} data-projet-precedent hidden tabIndex={-1}>{prev.titre}</Link>
        <Link href={`/${lang}/projets/${next.slug}/`} className={styles.suivant} data-projet-suivant>
          <span className="eyebrow">{t.projet.next}</span>
          <span className={styles.suivantT}>{next.titre} <span aria-hidden="true">→</span></span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="xp-suivant-img" aria-hidden="true"><img src={couverture(next).img.srcSmall} alt="" loading="lazy" style={couverture(next).pos ? { objectPosition: couverture(next).pos } : undefined} /></span>
        </Link>
      </nav>
    </article>
  );
}
