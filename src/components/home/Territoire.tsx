import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { PARCOURS } from '@/lib/parcours';
import { TRAITS } from '@/components/chrome/Logo';

type Carte = { w: number; h: number; echelleKm: number; deps: { code: string; nom: string; d: string; centre: [number, number] }[]; rhone: string; lieux: Record<string, [number, number]> };
type Entree = { type: 'p' | 's' | 'f' | 'm'; titre: string; sous?: string; href?: string };

const MAISON = 'Épinouze';
/** La commune citée dans un texte de lieu (« Livet (38) » désigne Livet-et-Gavet, où se trouve le bâtiment Keller). */
const commune = (lieu: string | null | undefined, noms: string[]) => {
  if (!lieu) return null;
  if (/\bLivet\b/.test(lieu)) return 'Livet-et-Gavet';
  return noms.find((n) => lieu.includes(n)) || null;
};

/**
 * Accueil : la carte des lieux de Laura. Chaque projet, stage ou école est placé dans sa commune,
 * avec des cercles de distance autour de chez elle. Interactions : experience/anim.ts (xpTerritoire).
 */
export default function Territoire({ projets, t, lang }: { projets: Projet[]; t: Dict; lang: Lang }) {
  const C: Carte = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site/territoire.json'), 'utf8'));
  const noms = Object.keys(C.lieux);
  const parLieu = new Map<string, Entree[]>();
  const ajoute = (n: string | null, e: Entree) => { if (!n) return; parLieu.set(n, [...(parLieu.get(n) || []), e]); };
  projets.forEach((p) => ajoute(commune(p.lieu, noms), { type: 'p', titre: p.titre, sous: [p.programme, p.annee].filter(Boolean).join(' · '), href: `/${lang}/projets/${p.slug}/` }));
  [...PARCOURS].reverse().forEach((e) => ajoute(commune(e.lieu, noms), { type: e.type, titre: e.titre[lang], sous: `${e.lieu.split(',')[0]} · ${e.date[lang]}` }));
  ajoute(MAISON, { type: 'm', titre: t.xp.terrMaison });

  // distance (km) de chez moi au lieu le plus éloigné, arrondie aux 5 km supérieurs
  const [mx, my] = C.lieux[MAISON];
  const km = (n: string) => Math.hypot(C.lieux[n][0] - mx, C.lieux[n][1] - my) / C.echelleKm;
  const rayon = Math.ceil(Math.max(...[...parLieu.keys()].map(km)) / 5) * 5;
  const T = { p: t.xp.terrProjet, s: t.xp.terrStage, f: t.xp.terrEtude, m: t.xp.terrMaison };
  const types = (n: string) => [...new Set((parLieu.get(n) || []).map((e) => e.type))];
  const hors = projets.filter((p) => !commune(p.lieu, noms) && p.lieu && !p.lieu.includes('[À COMPLÉTER]'));

  return (
    <section className="wrap xp-terr" data-territoire aria-labelledby="titre-territoire">
      <div className="xp-terr-texte">
        <h2 id="titre-territoire" className="eyebrow">{t.xp.terrTitre}</h2>
        <p className="xp-terr-phrase">{t.xp.terrPhrase.replace('{n}', String(rayon))}</p>
        <div className="xp-terr-legende" role="group" aria-label={t.xp.terrCarte}>
          {(['p', 's', 'f'] as const).map((k) => (
            <button key={k} type="button" data-terr-filtre={k} aria-pressed="true"><i className={`xp-terr-sym xp-terr-${k}`} />{k === 'p' ? t.xp.terrProjets : k === 's' ? t.xp.terrStages : t.xp.terrEtudes}</button>
          ))}
        </div>
        <div className="xp-terr-info" data-terr-info aria-live="polite"><p className="xp-terr-aide">{t.xp.terrAide}</p></div>
        {hors.length > 0 && <p className="xp-terr-hors">{t.xp.terrHorsCarte} : {hors.map((p) => `${p.titre} (${p.lieu})`).join(', ')}</p>}
      </div>

      <figure className="xp-terr-carte">
        <svg viewBox={`0 0 ${C.w} ${C.h}`} role="img" aria-label={t.xp.terrCarte}>
          <g className="xp-terr-deps">{C.deps.map((d) => <path key={d.code} d={d.d} />)}</g>
          <path className="xp-terr-rhone" d={C.rhone} />
          <g className="xp-terr-depnoms" aria-hidden="true">
            {C.deps.filter((d) => d.centre[0] > 30 && d.centre[0] < C.w - 30 && d.centre[1] > 30 && d.centre[1] < C.h - 30).map((d) => <text key={d.code} x={d.centre[0]} y={d.centre[1]}>{d.nom}</text>)}
          </g>
          <g className="xp-terr-cercles" aria-hidden="true">
            {[25, 50, 75, 100].filter((r) => r <= rayon + 10).map((r) => (
              <g key={r}><circle cx={mx} cy={my} r={r * C.echelleKm} /><text x={mx + r * C.echelleKm * 0.707 + 4} y={my - r * C.echelleKm * 0.707 - 4}>{r} km</text></g>
            ))}
          </g>
          {[...parLieu.entries()].map(([n, es]) => {
            const [x, y] = C.lieux[n];
            const ty = types(n);
            // étiquette du côté opposé à chez moi, pour éviter les chevauchements autour d'Épinouze
            const gauche = n !== MAISON && (x > C.w * 0.72 || x < mx - 4);
            return (
              <g key={n} className="xp-terr-lieu" data-lieu={n} data-types={ty.join(' ')} tabIndex={0} role="button" aria-label={`${n} : ${es.map((e) => `${T[e.type]} ${e.titre}`).join(', ')}`} transform={`translate(${x} ${y})`}>
                <circle className="xp-terr-cible" r="22" />
                {ty.includes('m') ? (
                  <g className="xp-terr-maison" transform="translate(-13 -15) scale(0.26)">{TRAITS.map((tr, i) => <path key={i} d={tr.d} transform="translate(-12 -16)" />)}</g>
                ) : ty.map((k, i) => {
                  const dx = (i - (ty.length - 1) / 2) * 16;
                  return k === 'f' ? <rect key={k} className="xp-terr-f" x={dx - 5.5} y={-5.5} width="11" height="11" /> : <circle key={k} className={`xp-terr-${k}`} cx={dx} cy="0" r="6.5" />;
                })}
                <text className="xp-terr-nom" x={gauche ? -16 : 16} y="4" textAnchor={gauche ? 'end' : 'start'}>{n}</text>
              </g>
            );
          })}
          <g className="xp-terr-echelle" transform={`translate(${C.w - 40 - 20 * C.echelleKm} ${C.h - 34})`} aria-hidden="true">
            <path d={`M0 0V-6M0 0H${20 * C.echelleKm}V-6M${10 * C.echelleKm} 0V-4`} />
            <text x="0" y="16">0</text><text x={20 * C.echelleKm} y="16" textAnchor="end">20 km</text>
          </g>
          <g className="xp-terr-nord" transform={`translate(${C.w - 40} 46)`} aria-hidden="true"><path d="M0 -22L7 6L0 1L-7 6Z" /><text y="22" textAnchor="middle">N</text></g>
        </svg>
        <figcaption className="xp-terr-source">{t.xp.terrSource}</figcaption>
      </figure>

      {/* ce qui s'affiche quand on choisit un lieu */}
      {[...parLieu.entries()].map(([n, es]) => (
        <div key={n} hidden data-terr-fiche={n}>
          <p className="xp-terr-lieuNom">{n}</p>
          <ul>
            {es.map((e, i) => (
              <li key={i} data-type={e.type}>
                <span className="xp-terr-type">{T[e.type]}</span>
                {e.href ? <Link href={e.href} className="xp-terr-lien">{e.titre} →</Link> : <span>{e.titre}</span>}
                {e.sous && <span className="xp-terr-sous">{e.sous}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
