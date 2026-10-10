import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import { getProjet } from '@/lib/content';

type L3 = Record<Lang, string>;
type Idee = { cle: string; page: number; titre: L3; citation: L3; projet?: string; lien?: L3 };
type Rapport = { titre: string; sousTitre: L3; cadre: L3; idees: Idee[] };

/**
 * À propos : le rapport d'études en quatre idées, avec les phrases exactes de Laura (et la page),
 * et le projet où chaque idée se retrouve. On passe d'une idée à l'autre (experience/anim.ts, xpRapport) ;
 * sans JavaScript, les quatre se lisent à la suite.
 */
export default function Rapport({ t, lang }: { t: Dict; lang: Lang }) {
  const R: Rapport = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site/rapport.json'), 'utf8'));
  return (
    <section className="wrap xp-rde" data-rde aria-labelledby="titre-rde">
      <div className="xp-rde-tete">
        <p className="eyebrow">{t.xp.rdeEyebrow}</p>
        <h2 id="titre-rde" className="xp-rde-titre">{R.titre}</h2>
        <p className="xp-rde-sous">{R.sousTitre[lang]}</p>
      </div>
      <div className="xp-rde-fil" role="tablist" aria-label={R.titre}>
        {R.idees.map((d, i) => (
          <button key={d.cle} type="button" role="tab" id={`rde-tab-${d.cle}`} aria-controls={`rde-${d.cle}`} aria-selected={i === 0} data-rde-tab={i}>
            <span className="xp-rde-n">{String(i + 1).padStart(2, '0')}</span>{d.titre[lang]}
          </button>
        ))}
      </div>
      <div className="xp-rde-panneaux">
        {R.idees.map((d, i) => {
          const p = d.projet ? getProjet(d.projet, lang) : null;
          return (
            <div key={d.cle} className="xp-rde-panneau" role="tabpanel" id={`rde-${d.cle}`} aria-labelledby={`rde-tab-${d.cle}`} data-rde-panneau={i} data-on={i === 0 || undefined}>
              <blockquote className="xp-rde-citation">
                <p>« {d.citation[lang]} »</p>
                <footer>{t.xp.rdePage} {d.page}{t.xp.rdeTraduction ? ` · ${t.xp.rdeTraduction}` : ''}</footer>
              </blockquote>
              {p && (
                <p className="xp-rde-projet">
                  <span className="eyebrow">{t.xp.rdeProjet}</span>
                  <Link href={`/${lang}/projets/${p.slug}/`} className="lien">{p.titre} →</Link>
                  {d.lien && <span className="xp-rde-lienSous">{d.lien[lang]}</span>}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="xp-rde-cadre">{R.cadre[lang]}</p>
    </section>
  );
}
