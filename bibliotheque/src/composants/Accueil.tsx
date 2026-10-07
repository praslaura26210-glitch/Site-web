import { useMemo, useState } from 'react';
import type { Fiche, Statut, TypeFiche } from '../types';
import { STATUTS, TYPES } from '../types';
import { useBiblio } from '../contexte';
import { chercher, concepts, FILTRES_VIDES, type Resultat } from '../lib/recherche';
import { NOM_TYPE, NOM_TYPE_PLURIEL, nomStatut } from '../lib/libelles';
import { Couverture, proportion } from './Couverture';
import { Surligne } from './Surligne';
import { Icone } from './Icone';

type Tri = 'recents' | 'titre' | 'auteur' | 'annee';
type Vue = 'etagere' | 'liste';

const lire = <T extends string>(cle: string, defaut: T): T => {
  try { return (localStorage.getItem(cle) as T) || defaut; } catch { return defaut; }
};
const ecrire = (cle: string, v: string) => {
  try { localStorage.setItem(cle, v); } catch { /* navigation privée */ }
};

const TRIS: Record<Tri, (a: Fiche, b: Fiche) => number> = {
  recents: (a, b) => b.creeLe.localeCompare(a.creeLe),
  titre: (a, b) => a.titre.localeCompare(b.titre, 'fr'),
  auteur: (a, b) => (a.auteurs[0] ?? '~').localeCompare(b.auteurs[0] ?? '~', 'fr') || a.titre.localeCompare(b.titre, 'fr'),
  annee: (a, b) => (b.annee ?? '').localeCompare(a.annee ?? '') || a.titre.localeCompare(b.titre, 'fr'),
};

export function Accueil() {
  const { biblio, filtres, setFiltres } = useBiblio();
  const [vue, setVue] = useState<Vue>(() => lire('vue', 'etagere'));
  const [tri, setTri] = useState<Tri>(() => lire('tri', 'recents'));
  const [panneau, setPanneau] = useState(false);

  const resultats = useMemo(() => {
    const r = chercher(biblio.fiches, filtres, biblio.synonymes);
    if (!filtres.q.trim()) r.sort((a, b) => TRIS[tri](a.fiche, b.fiche));
    return r;
  }, [biblio, filtres, tri]);

  const termes = useMemo(() => concepts(filtres.q, biblio.synonymes).flat(), [filtres.q, biblio.synonymes]);
  const recherche = filtres.q.trim() !== '';
  const actif = recherche || filtres.type || filtres.statut || filtres.motsCles.length > 0;

  const compteTypes = useMemo(() => {
    const c: Partial<Record<TypeFiche, number>> = {};
    for (const f of biblio.fiches) c[f.type] = (c[f.type] ?? 0) + 1;
    return c;
  }, [biblio.fiches]);

  const basculerMot = (m: string) =>
    setFiltres((f) => ({ ...f, motsCles: f.motsCles.includes(m) ? f.motsCles.filter((x) => x !== m) : [...f.motsCles, m] }));

  return (
    <div className="accueil">
      <div className="filtres">
        <div className="filtres-types" role="tablist" aria-label="Type">
          <button role="tab" aria-selected={!filtres.type} className="onglet" onClick={() => setFiltres((f) => ({ ...f, type: null }))}>
            Tout <span className="compte">{biblio.fiches.length}</span>
          </button>
          {TYPES.filter((t) => compteTypes[t]).map((t) => (
            <button key={t} role="tab" aria-selected={filtres.type === t} className="onglet" onClick={() => setFiltres((f) => ({ ...f, type: f.type === t ? null : t }))}>
              {NOM_TYPE_PLURIEL[t]} <span className="compte">{compteTypes[t]}</span>
            </button>
          ))}
        </div>
        <div className="filtres-ligne">
          <div className="statuts">
            {STATUTS.map((s: Statut) => (
              <button key={s} className="pastille" aria-pressed={filtres.statut === s} onClick={() => setFiltres((f) => ({ ...f, statut: f.statut === s ? null : s }))}>
                {nomStatut(s)}
              </button>
            ))}
          </div>
          <button className="pastille pastille-mots" aria-expanded={panneau} onClick={() => setPanneau((p) => !p)}>
            <Icone nom="filtre" taille={15} /> Mots-clés{filtres.motsCles.length ? ` (${filtres.motsCles.length})` : ''}
          </button>
          <div className="filtres-droite">
            {!recherche && (
              <>
                <select className="tri" value={tri} aria-label="Trier" onChange={(e) => { setTri(e.target.value as Tri); ecrire('tri', e.target.value); }}>
                  <option value="recents">Récents</option>
                  <option value="titre">Titre</option>
                  <option value="auteur">Auteur</option>
                  <option value="annee">Année</option>
                </select>
                <div className="vues">
                  <button className="bouton-icone" aria-pressed={vue === 'etagere'} aria-label="Étagère" title="Étagère" onClick={() => { setVue('etagere'); ecrire('vue', 'etagere'); }}>
                    <Icone nom="etagere" />
                  </button>
                  <button className="bouton-icone" aria-pressed={vue === 'liste'} aria-label="Liste" title="Liste" onClick={() => { setVue('liste'); ecrire('vue', 'liste'); }}>
                    <Icone nom="liste" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {panneau && <PanneauMotsCles choisis={filtres.motsCles} basculer={basculerMot} />}
        {(filtres.motsCles.length > 0 || actif) && (
          <div className="filtres-actifs">
            {filtres.motsCles.map((m) => (
              <button key={m} className="mot actif" onClick={() => basculerMot(m)}>
                {m} <Icone nom="fermer" taille={12} />
              </button>
            ))}
            <span className="mono discret">
              {resultats.length} fiche{resultats.length > 1 ? 's' : ''}
            </span>
            <button className="lien-texte" onClick={() => setFiltres(FILTRES_VIDES)}>Tout effacer</button>
          </div>
        )}
      </div>

      {resultats.length === 0 ? (
        <div className="vide">
          {biblio.fiches.length === 0 ? (
            <>
              <p>L’étagère est vide.</p>
              <a className="bouton principal" href="#/ajouter">Ajouter une première fiche</a>
            </>
          ) : (
            <>
              <p>Rien trouvé{recherche ? ` pour « ${filtres.q.trim()} »` : ''}.</p>
              <button className="bouton" onClick={() => setFiltres(FILTRES_VIDES)}>Effacer la recherche et les filtres</button>
            </>
          )}
        </div>
      ) : recherche || vue === 'liste' ? (
        <Liste resultats={resultats} termes={termes} />
      ) : (
        <Etagere fiches={resultats.map((r) => r.fiche)} />
      )}
    </div>
  );
}

function PanneauMotsCles({ choisis, basculer }: { choisis: string[]; basculer: (m: string) => void }) {
  const { biblio } = useBiblio();
  const compte = useMemo(() => {
    const c = new Map<string, number>();
    for (const f of biblio.fiches) for (const m of f.motsCles) c.set(m, (c.get(m) ?? 0) + 1);
    return c;
  }, [biblio.fiches]);
  const connus = new Set(biblio.familles.flatMap((f) => f.groupes.flatMap((g) => g.mots)));
  const orphelins = [...compte.keys()].filter((m) => !connus.has(m)).sort((a, b) => a.localeCompare(b, 'fr'));
  const puce = (m: string) => (
    <button key={m} className={`mot${choisis.includes(m) ? ' actif' : ''}`} onClick={() => basculer(m)}>
      {m} <span className="compte">{compte.get(m)}</span>
    </button>
  );
  return (
    <div className="panneau-mots">
      {biblio.familles.map((fam) => {
        const groupes = fam.groupes.map((g) => ({ ...g, mots: g.mots.filter((m) => compte.get(m)) })).filter((g) => g.mots.length);
        if (!groupes.length) return null;
        return (
          <section key={fam.id} className="famille">
            <h3 className="etiquette">{fam.nom}</h3>
            {groupes.map((g) => (
              <div key={g.nom} className="groupe">
                {fam.groupes.length > 1 && <span className="groupe-nom">{g.nom}</span>}
                <div className="mots">{g.mots.map(puce)}</div>
              </div>
            ))}
          </section>
        );
      })}
      {orphelins.length > 0 && (
        <section className="famille">
          <h3 className="etiquette">Hors liste</h3>
          <div className="mots">{orphelins.map(puce)}</div>
        </section>
      )}
    </div>
  );
}

function Pastille({ fiche }: { fiche: Fiche }) {
  if (fiche.statut === 'lu') return null;
  return <span className={`statut-point ${fiche.statut}`} title={nomStatut(fiche.statut, fiche.type)} />;
}

function Etagere({ fiches }: { fiches: Fiche[] }) {
  return (
    <ul className="etagere">
      {fiches.map((f) => (
        <li key={f.id} className="livre" style={{ '--k': proportion(f) } as React.CSSProperties}>
          <a href={`#/fiche/${encodeURIComponent(f.id)}`} title={f.titre}>
            <span className="livre-couv">
              <Couverture fiche={f} />
              {f.statut === 'en-cours' && <span className="marque-page" aria-label="En cours" />}
            </span>
            <span className="livre-titre">
              <Pastille fiche={f} />
              {f.titre}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Liste({ resultats, termes }: { resultats: Resultat[]; termes: string[] }) {
  return (
    <ul className="liste">
      {resultats.map(({ fiche: f, extrait }) => (
        <li key={f.id}>
          <a className="ligne" href={`#/fiche/${encodeURIComponent(f.id)}`}>
            <span className="ligne-couv" style={{ '--k': proportion(f) } as React.CSSProperties}>
              <Couverture fiche={f} />
            </span>
            <span className="ligne-texte">
              <span className="ligne-titre">
                <Surligne texte={f.titre} termes={termes} />
              </span>
              <span className="ligne-meta mono">
                {NOM_TYPE[f.type]}
                {f.auteurs.length > 0 && <> · <Surligne texte={f.auteurs.join(', ')} termes={termes} /></>}
                {f.annee && <> · {f.annee}</>}
                {f.statut !== 'lu' && <> · {nomStatut(f.statut, f.type)}</>}
              </span>
              {extrait && (
                <span className="ligne-extrait">
                  <span className="mono discret">{extrait.champ}{extrait.page ? `, p. ${extrait.page}` : ''} — </span>
                  <Surligne texte={extrait.texte} termes={termes} />
                </span>
              )}
              {f.motsCles.length > 0 && (
                <span className="ligne-mots">
                  {f.motsCles.slice(0, 6).map((m) => <span key={m} className="mot petit"><Surligne texte={m} termes={termes} /></span>)}
                </span>
              )}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
