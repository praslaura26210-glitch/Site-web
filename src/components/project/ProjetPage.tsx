import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media, type Media } from '@/lib/media';
import { CHIFFRES, CREDITS, type Bloc, type Mise } from '@/lib/sequences';
import { ancreDessin } from '@/lib/experience';
import { v } from '@/lib/ver';
import { tr } from '@/lib/tr';
import { couverture } from '@/components/home/ProjetsGrille';
import Comparateur from './Comparateur';
import Planche, { type Labels } from './Planche';
import Materiautheque, { PALETTE } from './Materiautheque';
import Visionneuse from './Visionneuse';
import Eclatee from './Eclatee';
import Construction from './Construction';
import Strophes from './Strophes';
import Feuille from './Feuille';
import Trace from './Trace';
import Nuancier from './Nuancier';
import Cotes from './Cotes';
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
  const F = tr(lang, {
    fr: { programme: 'Programme', cadre: 'Cadre', annee: 'Année', lieu: 'Lieu' },
    en: { programme: 'Programme', cadre: 'Context', annee: 'Year', lieu: 'Place' },
    it: { programme: 'Programma', cadre: 'Contesto', annee: 'Anno', lieu: 'Luogo' },
  });
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
      case 'texte': {
        // un texte seul, au centre ; avec une image, côte à côte (l'image du côté indiqué)
        const txt = texte(b.k);
        const tete = b.titre && <h3 className={styles.chapSousT}>{b.titre[lang]}</h3>;
        if (!b.r) return txt ? <div key={k} className={`${styles.solo} rv`} data-k={b.k}>{tete}{txt}</div> : null;
        return (
          <div key={k} className={styles.duo} data-cote={b.cote || 'g'} data-k={b.k}>
            <div className={`${styles.duoImg} rv`}><Planche m={M(b.r)} sizes="(max-width: 900px) 100vw, 55vw" labels={L} credit={credit(b.r)} ancre={ancreDessin(b.r)} /></div>
            {txt && <div className={`${styles.duoTexte} rv`}>{tete}{txt}</div>}
          </div>
        );
      }
      case 'materiaux':
        return <Materiautheque key={k} lang={lang} credit={cr.defaut || undefined} />;
      case 'eclatee':
        return <Eclatee key={k} slug={p.slug} lang={lang} />;
      case 'construction': {
        const m = M(b.r);
        return (
          <div key={k} className={styles.duo} data-cote="g" data-k="construction">
            <div className={styles.duoImg}><Construction slug={p.slug} nom={b.r.replace(/^\w:/, '')} legende={m.legende} rejouer={t.xp.rejouer} /></div>
            {b.k && <div className={`${styles.duoTexte} rv`}>{texte(b.k)}</div>}
          </div>
        );
      }
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
      case 'strophes':
        return p.poeme ? <Strophes key={k} poeme={p.poeme} medias={b.r.map((r) => (r ? M(r) : null))} labels={L} credit={cr.defaut || undefined} /> : null;
      case 'plein':
        return <div key={k} className={styles.plein}><Planche m={M(b.r)} sizes="100vw" labels={L} credit={credit(b.r)} ancre={ancreDessin(b.r)} pos={b.pos} /></div>;
      case 'feuille':
        return <Feuille key={k} titre={b.titre[lang]} projet={p.titre} annee={p.annee ? String(p.annee) : undefined} medias={b.r.map(M)} labels={L} credit={cr.defaut || undefined} ids={b.r.map(ancreDessin)} />;
      case 'triptyque':
        return (
          <div key={k} className={styles.triptyque}>
            {b.r.map((r, j) => <div key={r} className={styles.triptyqueItem} data-j={j}><Planche m={M(r)} sizes={j ? '(max-width: 900px) 100vw, 34vw' : '(max-width: 900px) 100vw, 64vw'} labels={L} credit={credit(r)} ancre={ancreDessin(r)} /></div>)}
          </div>
        );
      case 'galerie':
        return (
          <div key={k} className={styles.galerie} tabIndex={0} aria-label={t.xp.glisser}>
            <div className={styles.galerieRang}>
              {b.r.map((r) => { const m = M(r); return <div key={r} className={styles.galerieItem} style={{ aspectRatio: `${m.w} / ${m.h}` }}><Planche m={m} sizes="70vh" labels={L} credit={credit(r)} ancre={ancreDessin(r)} /></div>; })}
            </div>
          </div>
        );
      case 'trace':
        return <Trace key={k} slug={p.slug} nom={b.r} m={M(b.r)} avec={b.avec ? M(b.avec) : undefined} labels={L} credit={cr.defaut || undefined} rejouer={t.xp.rejouer} />;
      case 'nuancier':
        return <Nuancier key={k} lang={lang} credit={cr.defaut || undefined} />;
      case 'superpose': {
        const a = M(b.a), c = M(b.b);
        return (
          <div key={k} className={styles.superpose}>
            <Comparateur existant={{ src: a.src, w: a.w, h: a.h, legende: a.legende }} projet={{ src: c.src, w: c.w, h: c.h, legende: c.legende }} titre={b.titre[lang]} labels={{ existant: b.la[lang], projet: b.lb[lang], glisser: t.projet.glisser }} />
          </div>
        );
      }
      case 'coupes':
        return (
          <div key={k} className={styles.coupes}>
            {b.r.map((r, j) => (
              <div key={r} className={`${styles.coupe} rv`}>
                <span className={styles.coupeL} aria-hidden="true">{b.lettres[j]}<i>–</i>{b.lettres[j]}</span>
                <Planche m={M(r)} sizes="(max-width: 900px) 100vw, 80vw" labels={L} credit={credit(r)} ancre={ancreDessin(r)} />
              </div>
            ))}
          </div>
        );
      case 'cotes':
        return <Cotes key={k} slug={p.slug} m={M(b.r)} lang={lang} />;
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

  // les chapitres : un titre, puis les dessins et les textes dans l'ordre, chaque texte à côté de son image
  type Chap = { titre?: string; note?: string; blocs: React.ReactNode[] };
  const chapitres: Chap[] = [];
  let cur: Chap = { blocs: [] };
  mise.blocs.forEach((b, k) => {
    if (b.t === 'inter') {
      if (cur.blocs.length) chapitres.push(cur);
      cur = { titre: b.titre[lang], note: b.note?.[lang], blocs: [] };
      return;
    }
    const m = bloc(b, k);
    if (m) cur.blocs.push(m);
    // les chiffres d'une visionneuse : sous elle
    if (b.t === 'visionneuse' && b.k) { const x = texte(b.k); if (x) cur.blocs.push(<div key={`c${k}`} className={`${styles.solo} rv`}>{x}</div>); }
  });
  if (cur.blocs.length) chapitres.push(cur);

  return (
    <article className={styles.projet} data-projet={p.slug}>
      {/* l'ouverture, comme la page de titre d'un livre : le numéro, le titre, puis l'image au centre,
          tenue entre les informations du projet (à gauche le programme et le cadre, à droite l'année et le lieu) ;
          l'image s'ouvre depuis le milieu, comme une porte */}
      <header className={`wrap ${styles.ouv}`} data-format={cov.w > cov.h ? 'paysage' : 'portrait'}>
        <p className={styles.ouvN}><span>N° {String(p.ordre).padStart(2, '0')}</span><span>{String(total).padStart(2, '0')}</span></p>
        <h1 className={styles.ouvT}>{p.titre}</h1>
        <div className={styles.ouvScene}>
          <dl className={styles.ouvInfos}>
            <div><dt>{F.programme}</dt><dd>{p.programme}</dd></div>
            {p.cadre && <div><dt>{F.cadre}</dt><dd>{p.cadre}</dd></div>}
          </dl>
          <figure className={styles.ouvImg}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cov.src} srcSet={cov.srcSmall ? `${cov.srcSmall} 1000w, ${cov.src} 2000w` : undefined} sizes="(max-width: 900px) 100vw, 50vw" alt={cov.legende} width={cov.w} height={cov.h} fetchPriority="high" style={mise.pos ? { objectPosition: mise.pos } : undefined} data-xp-cover />
          </figure>
          <dl className={`${styles.ouvInfos} ${styles.ouvInfosD}`}>
            {p.annee && <div><dt>{F.annee}</dt><dd>{p.annee}</dd></div>}
            {p.lieu && <div><dt>{F.lieu}</dt><dd>{p.lieu}</dd></div>}
          </dl>
        </div>
      </header>

      {/* le descriptif, seul, au centre : une colonne de lecture */}
      <section className={`wrap ${styles.presentation}`} id="presentation" data-chapitre={t.xp.presentation}>
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

      {/* chaque chapitre : son numéro et son titre, puis ses dessins et ses textes, à lire de haut en bas */}
      <div className={`wrap ${styles.corpsProjet}`}>
        {chapitres.map((c, i) => (
          <section key={i} className={styles.chap} id={`chapitre-${i + 1}`} data-chapitre={c.titre || t.xp.presentation}>
            <header className={`${styles.chapTete} rv`}>
              <span className={styles.interN}>{String(i + 1).padStart(2, '0')}</span>
              {c.titre && <h2 className={styles.chapT}>{c.titre}</h2>}
              {c.note && <p className={styles.chapNote}>{c.note}</p>}
            </header>
            {c.blocs}
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
