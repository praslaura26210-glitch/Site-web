import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { media, type Media } from '@/lib/media';
import { CHIFFRES, MISES, type Bloc } from '@/lib/sequences';
import { tr } from '@/lib/tr';
import { ECHANTILLONS, imageEchantillon, nomMateriau, PALETTE } from '@/components/project/Materiautheque';
import { couverture } from './ProjetsGrille';

/*
 * Les pages du livre d'un projet (page « livre », ouverte depuis la collection de l'accueil). Elles sont écrites ici, cachées dans la page,
 * et experience/livres.ts les relie en livre : les pages tournent quand on fait défiler la page,
 * et chaque page s'anime quand elle apparaît (les images entrent, les plans se dessinent,
 * l'existant glisse vers le projet, les matériaux flottent, les chiffres défilent).
 * Les classes sont globales (xp-lv-…) : leurs styles sont dans experience/experience.css.
 */

type Page = { cle: string; rubrique?: string; el: React.ReactNode };

function Fig({ m, cle }: { m: Media; cle?: string }) {
  const dessin = m.kind === 'plan' || !!m.scan;
  return (
    <figure className={`xp-lv-fig${dessin ? ' xp-lv-dessin' : ''}`} key={cle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.srcSmall || m.src} alt={m.legende} width={Math.round(m.w)} height={Math.round(m.h)} loading="lazy" draggable={false} />
      <figcaption>{m.legende}</figcaption>
    </figure>
  );
}

export function pagesDuLivre(p: Projet, lang: Lang, t: Dict): Page[] {
  const L = tr(lang, {
    fr: { voir: 'La fiche du projet', glisser: 'Faites glisser le trait', matieres: 'Les matériaux', fin: 'Fin' },
    en: { voir: 'The project page', glisser: 'Drag the line', matieres: 'The materials', fin: 'The end' },
    it: { voir: 'La scheda del progetto', glisser: 'Trascina la linea', matieres: 'I materiali', fin: 'Fine' },
  });
  const mise = MISES[p.slug];
  const M = (r: string) => media(p, r);
  const pages: Page[] = [];
  let rubrique: string | undefined;
  const ajoute = (cle: string, el: React.ReactNode) => pages.push({ cle, rubrique, el });
  const images = (cle: string, rs: string[]) => {
    for (let i = 0; i < rs.length; i += 2) {
      const lot = rs.slice(i, i + 2);
      ajoute(`${cle}-${i}`, <div className={`xp-lv-p xp-lv-images${lot.length > 1 ? ' xp-lv-deux' : ''}`}>{lot.map((r) => <Fig key={r} m={M(r)} />)}</div>);
    }
  };

  ajoute('intro', (
    <div className="xp-lv-p xp-lv-intro">
      <p className="xp-lv-n">N° {p.numero}</p>
      <h2 className="xp-lv-titre">{p.titre}</h2>
      <p className="xp-lv-meta">{[p.programme, p.lieu, p.annee].filter(Boolean).join(' · ')}</p>
      <p className="xp-lv-texte">{p.texte}</p>
    </div>
  ));

  (mise?.blocs || []).forEach((b: Bloc, i) => {
    const cle = `b${i}`;
    switch (b.t) {
      case 'inter': rubrique = b.titre[lang]; break;
      case 'grand': images(cle, [b.r]); break;
      case 'rang': images(cle, b.r); break;
      case 'visionneuse': b.r.forEach((r, k) => images(`${cle}-${k}`, [r])); break;
      case 'composition': images(cle, b.rangs.flat().map((x) => x.r)); break;
      case 'texte': {
        if (b.k === 'poeme' && p.poeme) {
          ajoute(cle, (
            <div className="xp-lv-p xp-lv-poeme">
              {p.poeme.split(/\n\s*\n/).map((strophe, j) => (
                <p key={j}>{strophe.trim().split('\n').map((l, k) => <span key={k}>{l}</span>)}</p>
              ))}
            </div>
          ));
        } else if (b.k === 'recit' && p.recit) {
          ajoute(cle, (
            <div className="xp-lv-p xp-lv-recit">
              {p.recit_titre && <h3>{p.recit_titre}</h3>}
              <p>{p.recit.replace(/^«\s*|\s*»$/g, '')}</p>
            </div>
          ));
        } else if (b.k === 'experimentation' && p.experimentation) {
          ajoute(cle, <div className="xp-lv-p xp-lv-recit">{b.titre && <h3>{b.titre[lang]}</h3>}<p>{p.experimentation}</p></div>);
        } else if (b.k === 'chiffres' && CHIFFRES[p.slug]) {
          ajoute(cle, (
            <div className="xp-lv-p xp-lv-chiffres">
              {b.titre && <h3>{b.titre[lang]}</h3>}
              <dl>{CHIFFRES[p.slug].map((x) => <div key={x.label.fr}><dd data-compte="">{x.valeur[lang]}</dd><dt>{x.label[lang]}</dt></div>)}</dl>
            </div>
          ));
        } else if (b.k === 'palette' && p.palette) {
          ajoute(cle, (
            <div className="xp-lv-p xp-lv-palette">
              <h3>{b.titre?.[lang] || L.matieres}</h3>
              <ul>{Object.entries(p.palette).map(([nom, col], k) => <li key={nom} style={{ ['--k' as string]: k }}><i style={{ background: col }} /><span>{lang === 'fr' ? nom : PALETTE[nom]?.[lang] || nom}</span></li>)}</ul>
            </div>
          ));
        }
        if (b.r) images(`${cle}-r`, [b.r]);
        break;
      }
      case 'materiaux':
        // les échantillons tombent sur la page, se chevauchent et flottent un peu
        ajoute(cle, (
          <div className="xp-lv-p xp-lv-mat" data-lv-mat="">
            <h3>{L.matieres}</h3>
            {ECHANTILLONS.map((e, k) => (
              <span key={e.f} className="xp-lv-ech" data-photo={e.photo ? '' : undefined} data-mot={e.mot ? '' : undefined} style={{ ['--x' as string]: `${e.livre[0]}%`, ['--y' as string]: `${e.livre[1]}%`, ['--w' as string]: `${e.livre[2]}%`, ['--r' as string]: `${e.r}deg`, ['--k' as string]: k, ['--bois' as string]: `url(${imageEchantillon(e)})`, aspectRatio: `1 / ${e.ratio}` }}>
                {e.mot ? <b>{e.mot}</b> : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageEchantillon(e)} alt="" draggable={false} loading="lazy" />
                )}
                <em>{nomMateriau(e.nom, lang)}</em>
              </span>
            ))}
          </div>
        ));
        break;
      case 'eclatee': images(cle, ['axonometrie-eclatee']); break;
      case 'construction': images(cle, [b.r]); break;
      case 'comparer':
        b.items.forEach((x, k) => {
          const a = M(x.existant), c = M(x.projet);
          ajoute(`${cle}-${k}`, (
            <div className="xp-lv-p xp-lv-cmp">
              <h3>{x.titre[lang]}</h3>
              <div className="xp-lv-cmp-scene" data-lv-cmp="" style={{ aspectRatio: `${c.w} / ${c.h}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.src} alt={c.legende} draggable={false} loading="lazy" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="xp-lv-cmp-haut" src={a.src} alt={a.legende} draggable={false} loading="lazy" />
                <span className="xp-lv-cmp-trait" aria-hidden="true" />
                <span className="xp-lv-cmp-lab">{t.projet.existant}</span>
                <span className="xp-lv-cmp-lab xp-lv-cmp-labd">{t.projet.projet}</span>
              </div>
              <p className="xp-lv-aide">{L.glisser}</p>
            </div>
          ));
        });
        break;
    }
  });

  const { img } = couverture(p);
  ajoute('fin', (
    <div className="xp-lv-p xp-lv-fin">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.srcSmall} alt="" loading="lazy" />
      <a className="lien" href={`/${lang}/projets/${p.slug}/`}>{L.voir} →</a>
    </div>
  ));
  return pages;
}

/** Les pages du livre d'un projet, cachées (experience/livres.ts en fait un livre). */
export default function LivrePages({ p, lang, t }: { p: Projet; lang: Lang; t: Dict }) {
  const { img, pos } = couverture(p);
  return (
    <div hidden data-livre-pages={p.slug} data-titre={p.titre} data-n={p.numero} data-couv={img.srcSmall} data-couv-pos={pos || ''} data-annee={p.annee || ''}>
      {pagesDuLivre(p, lang, t).map((x) => <section key={x.cle} data-rubrique={x.rubrique || ''}>{x.el}</section>)}
    </div>
  );
}
