import { useMemo, useState } from 'react';
import type { Fiche, Rayon, Statut } from '../types';
import { RAYONS, rayonDe } from '../types';
import { classeTravail, nomTravail, useBiblio } from '../contexte';
import { chercher, concepts, FILTRES_VIDES, type Resultat } from '../lib/recherche';
import { NOM_TYPE, domaine } from '../lib/libelles';
import { Couverture } from './Couverture';
import { Surligne } from './Surligne';
import { Icone } from './Icone';
import { NOM_RAYON } from './Navigation';

type Tri = 'recents' | 'titre' | 'auteur' | 'annee';

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

const lien = (f: Fiche) => `#/fiche/${encodeURIComponent(f.id)}`;

/** Une carte : couverture pour un livre, photo recadrée pour un projet ou un article. */
export function Carte({ fiche: f }: { fiche: Fiche }) {
  const rayon = rayonDe(f.type);
  const meta =
    rayon === 'livres' ? f.auteurs.join(', ') :
    rayon === 'projets' ? [f.auteurs[0], f.editeur].filter(Boolean).join(' · ') :
    [f.auteurs[0] ?? (f.editeur || domaine(f.source)), NOM_TYPE[f.type]].filter(Boolean).join(' · ');
  return (
    <a className={`carte carte-${rayon === 'livres' ? 'livre' : rayon === 'projets' ? 'projet' : 'article'}`} href={lien(f)}>
      <span className="carte-image">
        <Couverture fiche={f} />
        {(f.favori || f.statut === 'en-cours') && (
          <span className="carte-badges">
            {f.statut === 'en-cours' && <span className="badge">En cours</span>}
            {f.favori && <span className="badge coeur" aria-label="Favori"><Icone nom="coeur" taille={14} /></span>}
          </span>
        )}
      </span>
      <span className="carte-texte">
        <span className="carte-titre">{f.titre}</span>
        {meta && <span className="carte-meta">{meta}</span>}
      </span>
    </a>
  );
}

function Grille({ fiches, rayon }: { fiches: Fiche[]; rayon: Rayon | 'melange' }) {
  return (
    <ul className={`grille ${rayon}`}>
      {fiches.map((f) => <li key={f.id}><Carte fiche={f} /></li>)}
    </ul>
  );
}

function Rangee({ fiches, rayon }: { fiches: Fiche[]; rayon: Rayon }) {
  return (
    <ul className={`rangee ${rayon}`}>
      {fiches.map((f) => <li key={f.id}><Carte fiche={f} /></li>)}
    </ul>
  );
}

const STATUTS_LIVRES: { s: Statut; titre: string }[] = [
  { s: 'en-cours', titre: 'En cours de lecture' },
  { s: 'a-lire', titre: 'À lire' },
  { s: 'lu', titre: 'Lus' },
];

/** Les livres rangés en trois piles : en cours, à lire, lus. */
function LivresParStatut({ fiches }: { fiches: Fiche[] }) {
  return (
    <>
      {STATUTS_LIVRES.map(({ s, titre }) => {
        const pile = fiches.filter((f) => f.statut === s);
        if (!pile.length) return null;
        return (
          <section key={s} className="section">
            <div className="section-tete"><h2>{titre}<span className="compte">{pile.length}</span></h2></div>
            <Grille fiches={pile} rayon="livres" />
          </section>
        );
      })}
    </>
  );
}

function Section({ titre, compte, vers, children }: { titre: string; compte?: number; vers?: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <div className="section-tete">
        <h2>{titre}{compte !== undefined && <span className="compte">{compte}</span>}</h2>
        {vers && <a href={vers}>Tout voir →</a>}
      </div>
      {children}
    </section>
  );
}

/** Puces pour filtrer par travail (mémoire, rapport d'études…). */
function FiltreTravaux({ fiches }: { fiches: Fiche[] }) {
  const { biblio, filtres, setFiltres } = useBiblio();
  const presents = biblio.categories.filter((c) => fiches.some((f) => f.categories?.includes(c.id)));
  if (!presents.length) return null;
  return (
    <div className="filtres-ligne" role="group" aria-label="Filtrer par travail">
      {presents.map((c) => (
        <button
          key={c.id}
          className={`travail ${classeTravail(biblio, c.id)}`}
          aria-pressed={filtres.categorie === c.id}
          onClick={() => setFiltres((f) => ({ ...f, categorie: f.categorie === c.id ? null : c.id }))}
        >
          {c.nom}
        </button>
      ))}
    </div>
  );
}

function MotsActifs() {
  const { filtres, setFiltres } = useBiblio();
  if (!filtres.motsCles.length) return null;
  return (
    <div className="filtres-actifs">
      <span className="discret">Mot-clé :</span>
      {filtres.motsCles.map((m) => (
        <button key={m} className="mot actif" onClick={() => setFiltres((f) => ({ ...f, motsCles: f.motsCles.filter((x) => x !== m) }))}>
          {m} <Icone nom="fermer" taille={12} />
        </button>
      ))}
    </div>
  );
}

function ChoixTri({ tri, changer }: { tri: Tri; changer: (t: Tri) => void }) {
  return (
    <select id="tri" className="tri" style={{ width: 'auto', minHeight: 34, fontSize: 13.5 }} value={tri} aria-label="Trier" onChange={(e) => changer(e.target.value as Tri)}>
      <option value="recents">Les plus récents</option>
      <option value="titre">Par titre</option>
      <option value="auteur">Par auteur</option>
      <option value="annee">Par année</option>
    </select>
  );
}

export function Accueil() {
  const { biblio, route, filtres } = useBiblio();
  const [tri, setTriEtat] = useState<Tri>(() => lire('tri', 'recents'));
  const setTri = (t: Tri) => { setTriEtat(t); ecrire('tri', t); };
  const [page, brut] = route.split('/');
  const param = brut ? decodeURIComponent(brut) : '';

  // la page choisit les fiches ; la recherche et les filtres s'appliquent ensuite
  const { titre, base, rayon } = useMemo(() => {
    if ((RAYONS as string[]).includes(page)) {
      const r = page as Rayon;
      return { titre: NOM_RAYON[r], base: biblio.fiches.filter((f) => rayonDe(f.type) === r), rayon: r };
    }
    if (page === 'favoris') return { titre: 'Favoris', base: biblio.fiches.filter((f) => f.favori), rayon: null };
    if (page === 'travail') return { titre: nomTravail(biblio, param), base: biblio.fiches.filter((f) => f.categories?.includes(param)), rayon: null };
    return { titre: 'Toute la bibliothèque', base: biblio.fiches, rayon: null };
  }, [biblio, page, param]);

  const filtrees = useMemo(() => {
    const r = chercher(base, { ...filtres, categorie: page === 'travail' ? null : filtres.categorie }, biblio.synonymes);
    if (!filtres.q.trim()) r.sort((a, b) => TRIS[tri](a.fiche, b.fiche));
    return r;
  }, [base, filtres, biblio.synonymes, tri, page]);

  if (filtres.q.trim()) return <Resultats titre={titre} resultats={filtrees} />;

  const fiches = filtrees.map((r) => r.fiche);

  if (page === '' && !filtres.categorie && !filtres.motsCles.length) return <VueAccueil />;

  const travail = page === 'travail';
  return (
    <div>
      <header className="tete-page">
        <h1 className={travail ? classeTravail(biblio, param) : undefined} style={travail ? { color: 'var(--tc)' } : undefined}>
          {titre}<span className="compte">{base.length}</span>
        </h1>
        {travail && <p className="sous-titre">Les livres, articles et projets qui servent à ce travail.</p>}
        <div className="filtres-ligne">
          {!travail && <FiltreTravaux fiches={base} />}
          <span style={{ marginLeft: 'auto' }}><ChoixTri tri={tri} changer={setTri} /></span>
        </div>
        <MotsActifs />
      </header>

      {fiches.length === 0 ? (
        <div className="vide">
          {page === 'favoris' ? (
            <p>Touche le cœur d’une fiche pour la retrouver ici.</p>
          ) : base.length === 0 ? (
            <>
              <p>Rien ici pour l’instant.</p>
              <a className="bouton principal" href="#/ajouter">Ajouter une fiche</a>
            </>
          ) : (
            <p>Aucune fiche avec ces filtres.</p>
          )}
        </div>
      ) : rayon === 'livres' ? (
        <LivresParStatut fiches={fiches} />
      ) : rayon ? (
        <Grille fiches={fiches} rayon={rayon} />
      ) : (
        RAYONS.map((r) => {
          const part = fiches.filter((f) => rayonDe(f.type) === r);
          if (!part.length) return null;
          return (
            <Section key={r} titre={NOM_RAYON[r]} compte={part.length}>
              {r === 'livres' ? <LivresParStatut fiches={part} /> : <Grille fiches={part} rayon={r} />}
            </Section>
          );
        })
      )}
    </div>
  );
}

function VueAccueil() {
  const { biblio } = useBiblio();
  const recents = [...biblio.fiches].sort(TRIS.recents);
  const parRayon = (r: Rayon) => recents.filter((f) => rayonDe(f.type) === r);
  const enCours = recents.filter((f) => f.type === 'livre' && f.statut === 'en-cours');
  const resume = RAYONS.map((r) => `${parRayon(r).length} ${NOM_RAYON[r].toLowerCase()}`).join(' · ');

  if (!biblio.fiches.length) {
    return (
      <div className="vide">
        <p>La bibliothèque est vide.</p>
        <a className="bouton principal" href="#/ajouter">Ajouter une première fiche</a>
      </div>
    );
  }

  return (
    <div>
      <header className="tete-page">
        <h1>Ma bibliothèque</h1>
        <p className="sous-titre">{resume}</p>
      </header>

      {enCours.length > 0 && (
        <Section titre="En cours de lecture" compte={enCours.length}>
          <Rangee fiches={enCours} rayon="livres" />
        </Section>
      )}

      {biblio.categories.length > 0 && (
        <Section titre="Mes travaux">
          <ul className="grille travaux-cartes">
            {biblio.categories.map((c) => {
              const liees = recents.filter((f) => f.categories?.includes(c.id));
              const detail = RAYONS.map((r) => [r, liees.filter((f) => rayonDe(f.type) === r).length] as const)
                .filter(([, n]) => n)
                .map(([r, n]) => `${n} ${NOM_RAYON[r].toLowerCase()}`)
                .join(' · ');
              return (
                <li key={c.id}>
                  <a className={`carte-travail ${classeTravail(biblio, c.id)}`} href={`#/travail/${encodeURIComponent(c.id)}`}>
                    <div>
                      <h3>{c.nom}</h3>
                      <p>{detail || 'Aucune fiche pour l’instant'}</p>
                    </div>
                    {liees.length > 0 && (
                      <div className="vignettes" aria-hidden="true">
                        {liees.slice(0, 5).map((f) => <Couverture key={f.id} fiche={f} />)}
                      </div>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {RAYONS.map((r) => {
        const liste = parRayon(r);
        if (!liste.length) return null;
        return (
          <Section key={r} titre={NOM_RAYON[r]} compte={liste.length} vers={`#/${r}`}>
            <Rangee fiches={liste.slice(0, 14)} rayon={r} />
          </Section>
        );
      })}
    </div>
  );
}

function Resultats({ titre, resultats }: { titre: string; resultats: Resultat[] }) {
  const { biblio, filtres, setFiltres } = useBiblio();
  const termes = useMemo(() => concepts(filtres.q, biblio.synonymes).flat(), [filtres.q, biblio.synonymes]);
  const [rayon, setRayon] = useState<Rayon | null>(null);
  const affiches = rayon ? resultats.filter((r) => rayonDe(r.fiche.type) === rayon) : resultats;

  return (
    <div>
      <header className="tete-page">
        <h1>
          « {filtres.q.trim()} »<span className="compte">{resultats.length}</span>
        </h1>
        <p className="sous-titre">{titre === 'Toute la bibliothèque' ? 'Dans toute la bibliothèque' : `Dans : ${titre}`}</p>
        <div className="filtres-ligne">
          <button className="pastille" aria-pressed={!rayon} onClick={() => setRayon(null)}>Tout</button>
          {RAYONS.map((r) => {
            const n = resultats.filter((x) => rayonDe(x.fiche.type) === r).length;
            return n ? (
              <button key={r} className="pastille" aria-pressed={rayon === r} onClick={() => setRayon(rayon === r ? null : r)}>
                {NOM_RAYON[r]} <span className="compte">{n}</span>
              </button>
            ) : null;
          })}
        </div>
        <MotsActifs />
      </header>
      {affiches.length === 0 ? (
        <div className="vide">
          <p>Rien trouvé.</p>
          <button className="bouton" onClick={() => setFiltres(FILTRES_VIDES)}>Effacer la recherche</button>
        </div>
      ) : (
        <ul className="liste">
          {affiches.map(({ fiche: f, extrait }) => (
            <li key={f.id}>
              <a className="ligne" href={lien(f)}>
                <span className="ligne-couv"><Couverture fiche={f} /></span>
                <span className="ligne-texte">
                  <span className="ligne-titre"><Surligne texte={f.titre} termes={termes} /></span>
                  <span className="ligne-meta">
                    {NOM_TYPE[f.type]}
                    {f.auteurs.length > 0 && <> · <Surligne texte={f.auteurs.join(', ')} termes={termes} /></>}
                    {f.annee && <> · {f.annee}</>}
                    {(f.categories ?? []).length > 0 && <> · {f.categories.map((c) => nomTravail(biblio, c)).join(', ')}</>}
                  </span>
                  {extrait && (
                    <span className="ligne-extrait">
                      <span className="etiquette">{extrait.champ}{extrait.page ? `, p. ${extrait.page}` : ''}</span>
                      <Surligne texte={extrait.texte} termes={termes} />
                    </span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
