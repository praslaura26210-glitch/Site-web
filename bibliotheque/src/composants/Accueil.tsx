import { useEffect, useMemo, useRef, useState } from 'react';
import type { Fiche, Rayon } from '../types';
import { RAYONS, rayonDe } from '../types';
import { nomTravail, useBiblio } from '../contexte';
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
const estLu = (f: Fiche) => f.statut === 'lu';

/** Une carte : couverture pour un livre, image d'article. Les projets ont leur propre carte (mosaïque). */
export function Carte({ fiche: f }: { fiche: Fiche }) {
  const rayon = rayonDe(f.type);
  if (rayon === 'projets') return <CarteProjet fiche={f} />;
  const meta =
    rayon === 'livres' ? f.auteurs.join(', ') :
    [f.auteurs[0] ?? (f.editeur || domaine(f.source)), f.type !== 'article' ? NOM_TYPE[f.type] : ''].filter(Boolean).join(' · ');
  return (
    <a className={`carte carte-${rayon === 'livres' ? 'livre' : 'article'}`} href={lien(f)}>
      <span className="carte-image"><Couverture fiche={f} /></span>
      <span className="carte-texte">
        <span className="carte-titre">{f.titre}</span>
        <span className="carte-meta">
          {estLu(f) && <span className="point-lu" title="Lu" aria-label="Lu" />}
          <span>{meta}</span>
          {f.favori && <span className="coeur-petit" aria-label="Favori"><Icone nom="coeur" taille={13} /></span>}
        </span>
      </span>
    </a>
  );
}

/**
 * Projet : l'image entière, sans recadrage. Le nom apparaît au survol ;
 * sur téléphone, un premier toucher l'affiche, un second ouvre la fiche.
 */
function CarteProjet({ fiche: f }: { fiche: Fiche }) {
  const [revele, setRevele] = useState(false);
  const tactile = useRef(false);
  useEffect(() => {
    if (!revele) return;
    const t = setTimeout(() => setRevele(false), 5000);
    return () => clearTimeout(t);
  }, [revele]);
  const meta = [f.auteurs[0], f.editeur].filter(Boolean).join(' · ');
  return (
    <a
      className={`carte-projet${revele ? ' revele' : ''}${f.images.length ? '' : ' sans-image'}`}
      href={lien(f)}
      aria-label={[f.titre, meta].filter(Boolean).join(', ')}
      onPointerDown={(e) => { tactile.current = e.pointerType !== 'mouse'; }}
      onClick={(e) => {
        if (tactile.current && f.images.length && !revele) { e.preventDefault(); setRevele(true); }
      }}
    >
      <Couverture fiche={f} />
      {f.images.length > 0 && (
        <span className="carte-projet-texte" aria-hidden="true">
          <span className="carte-titre">{f.titre}</span>
          {f.sousTitre && <span className="carte-sous-titre">{f.sousTitre}</span>}
          {meta && <span className="carte-meta">{meta}</span>}
          <span className="carte-voir">Voir le projet →</span>
        </span>
      )}
      {f.favori && <span className="coeur-image" aria-hidden="true"><Icone nom="coeur" taille={14} /></span>}
    </a>
  );
}

/** Accueil : un projet en petit, présenté comme un livre (image entière, nom et architecte dessous). */
function PetitProjet({ fiche: f }: { fiche: Fiche }) {
  return (
    <a className="carte carte-projet-petit" href={lien(f)}>
      <span className="carte-image"><Couverture fiche={f} /></span>
      <span className="carte-texte">
        <span className="carte-titre">{f.titre}</span>
        <span className="carte-meta">
          <span>{[f.auteurs[0], f.editeur?.split(',')[0]].filter(Boolean).join(' · ')}</span>
          {f.favori && <span className="coeur-petit" aria-label="Favori"><Icone nom="coeur" taille={13} /></span>}
        </span>
      </span>
    </a>
  );
}

function Grille({ fiches, rayon }: { fiches: Fiche[]; rayon: Rayon }) {
  if (rayon === 'projets') {
    return (
      <ul className="mosaique">
        {fiches.map((f) => <li key={f.id}><CarteProjet fiche={f} /></li>)}
      </ul>
    );
  }
  return (
    <ul className={`grille ${rayon}`}>
      {fiches.map((f) => <li key={f.id}><Carte fiche={f} /></li>)}
    </ul>
  );
}

function Section({ titre, compte, vers, children }: { titre: string; compte?: number; vers?: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <div className="section-tete">
        <h2>{titre}{compte !== undefined && <span className="compte">{compte}</span>}</h2>
        {vers && <a href={vers}>Tout voir</a>}
      </div>
      {children}
    </section>
  );
}

/** Les architectes des projets : on en choisit un pour voir tous ses projets. */
function ChoixArchitecte({ actuel }: { actuel: string }) {
  const { biblio, naviguer } = useBiblio();
  const architectes = useMemo(() => {
    const n = new Map<string, number>();
    for (const f of biblio.fiches) if (f.type === 'projet') for (const a of f.auteurs) n.set(a, (n.get(a) ?? 0) + 1);
    return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
  }, [biblio.fiches]);
  if (!architectes.length) return <span />;
  return (
    <select
      id="architecte"
      className="tri choix-architecte"
      value={actuel}
      aria-label="Voir les projets d’un architecte"
      onChange={(e) => naviguer(e.target.value ? `auteur/${encodeURIComponent(e.target.value)}` : 'projets')}
    >
      <option value="">Tous les architectes</option>
      {architectes.map(([a, n]) => <option key={a} value={a}>{a} ({n})</option>)}
    </select>
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
    if (page === 'auteur') return { titre: param, base: biblio.fiches.filter((f) => f.auteurs.includes(param)), rayon: null };
    if (page === 'travail') return { titre: nomTravail(biblio, param), base: biblio.fiches.filter((f) => f.categories?.includes(param)), rayon: null };
    return { titre: 'Toute la bibliothèque', base: biblio.fiches, rayon: null };
  }, [biblio, page, param]);

  const filtrees = useMemo(() => {
    const r = chercher(base, { ...filtres, categorie: page === 'travail' ? null : filtres.categorie }, biblio.synonymes);
    if (!filtres.q.trim()) r.sort((a, b) => TRIS[tri](a.fiche, b.fiche));
    return r;
  }, [base, filtres, biblio.synonymes, tri, page]);

  if (filtres.q.trim()) return <Resultats titre={titre} resultats={filtrees} />;
  if (page === '' && !filtres.categorie && !filtres.motsCles.length) return <VueAccueil />;

  const fiches = filtrees.map((r) => r.fiche);
  const travail = page === 'travail';
  const avecLus = rayon === 'livres' || rayon === 'articles' || !rayon;

  return (
    <div>
      <header className="tete-page">
        <h1>
          {titre}<span className="compte">{base.length}</span>
        </h1>
        {travail && <p className="sous-titre">Les livres, articles et projets qui nourrissent ce travail.</p>}
        {page === 'auteur' && <p className="sous-titre">Toutes les fiches de {param} : projets, livres, articles.</p>}
        <div className="barre-filtres">
          {rayon === 'projets' || (page === 'auteur' && base.some((f) => f.type === 'projet')) ? <ChoixArchitecte actuel={page === 'auteur' ? param : ''} /> : <span />}
          <span className="champ-ligne">
            {avecLus && <span className="legende"><span className="point-lu" /> lu</span>}
            <select id="tri" className="tri" value={tri} aria-label="Trier" onChange={(e) => setTri(e.target.value as Tri)}>
              <option value="recents">Les plus récents</option>
              <option value="titre">Par titre</option>
              <option value="auteur">Par auteur</option>
              <option value="annee">Par année</option>
            </select>
          </span>
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
      ) : rayon ? (
        <Grille fiches={fiches} rayon={rayon} />
      ) : (
        RAYONS.map((r) => {
          const part = fiches.filter((f) => rayonDe(f.type) === r);
          if (!part.length) return null;
          return (
            <Section key={r} titre={NOM_RAYON[r]} compte={part.length}>
              <Grille fiches={part} rayon={r} />
            </Section>
          );
        })
      )}
    </div>
  );
}

/** Accueil : pour chaque rayon, une rangée des derniers ajouts et « Voir plus ». */
function VueAccueil() {
  const { biblio } = useBiblio();
  const recents = [...biblio.fiches].sort(TRIS.recents);
  // quelques fiches seulement ; le reste avec « Voir plus »
  const LIMITE: Record<Rayon, number> = { livres: 6, articles: 4, projets: 6 };

  if (!biblio.fiches.length) {
    return (
      <div className="vide">
        <p>La bibliothèque est vide.</p>
        <a className="bouton principal" href="#/ajouter">Ajouter une première fiche</a>
      </div>
    );
  }

  return (
    <div className="accueil">
      {RAYONS.map((r) => {
        const liste = recents.filter((f) => rayonDe(f.type) === r);
        return (
          <section key={r} className="section">
            <div className="section-tete">
              <h2><a href={`#/${r}`}>{NOM_RAYON[r]}</a><span className="compte">{liste.length}</span></h2>
              {liste.length > 0 && <a className="voir-plus" href={`#/${r}`}>Voir plus <span aria-hidden="true">→</span></a>}
            </div>
            {liste.length ? (
              <>
                {r === 'projets' ? (
                  <ul className="grille projets">
                    {liste.slice(0, LIMITE.projets).map((f) => <li key={f.id}><PetitProjet fiche={f} /></li>)}
                  </ul>
                ) : <Grille fiches={liste.slice(0, LIMITE[r])} rayon={r} />}
              </>
            ) : (
              <p className="discret rangee-vide">
                Aucun {r === 'articles' ? 'article' : r === 'livres' ? 'livre' : 'projet'} pour l’instant. <a className="lien-texte" href="#/ajouter">Ajouter</a>
              </p>
            )}
          </section>
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
        <span className="etiquette">{titre === 'Toute la bibliothèque' ? 'Recherche' : `Recherche dans : ${titre}`}</span>
        <h1>« {filtres.q.trim()} »<span className="compte">{resultats.length}</span></h1>
        <div className="barre-filtres">
          <div className="onglets">
            <button className="onglet" aria-pressed={!rayon} onClick={() => setRayon(null)}>Tout</button>
            {RAYONS.map((r) => {
              const n = resultats.filter((x) => rayonDe(x.fiche.type) === r).length;
              return n ? (
                <button key={r} className="onglet" aria-pressed={rayon === r} onClick={() => setRayon(rayon === r ? null : r)}>
                  {NOM_RAYON[r]}<span className="compte">{n}</span>
                </button>
              ) : null;
            })}
          </div>
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
