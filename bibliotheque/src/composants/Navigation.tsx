import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { RAYONS, rayonDe, type Rayon } from '../types';
import { classeTravail, useBiblio } from '../contexte';
import { api } from '../lib/api';
import { FILTRES_VIDES } from '../lib/recherche';
import { Icone, type NomIcone } from './Icone';

export const NOM_RAYON: Record<Rayon, string> = { livres: 'Livres', articles: 'Articles et web', projets: 'Projets' };
const ICONE_RAYON: Record<Rayon, NomIcone> = { livres: 'livre', articles: 'article', projets: 'projet' };

/** Tiroirs à gauche (ordinateur), onglets en bas (téléphone), recherche en haut. */
export function Navigation({ children }: { children: ReactNode }) {
  const { biblio, route, filtres, setFiltres, naviguer, remplacer, notifier } = useBiblio();
  const champ = useRef<HTMLInputElement>(null);
  const [nouveau, setNouveau] = useState<string | null>(null);

  // « / » ou Ctrl+K : aller à la recherche
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      const saisie = cible.tagName === 'INPUT' || cible.tagName === 'TEXTAREA' || cible.isContentEditable;
      if ((e.key === '/' && !saisie) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        champ.current?.focus();
      }
    };
    addEventListener('keydown', touche);
    return () => removeEventListener('keydown', touche);
  }, []);

  const compte = (r: Rayon) => biblio.fiches.filter((f) => rayonDe(f.type) === r).length;
  const favoris = biblio.fiches.filter((f) => f.favori).length;
  const actuel = (r: string) => (route === r || route.startsWith(`${r}/`) ? 'page' : undefined);

  // la recherche s'affiche sur la page de liste en cours ; depuis une fiche, on revient à l'accueil
  const chercher = (q: string) => {
    setFiltres((f) => ({ ...f, q }));
    if (/^(fiche|ajouter|modifier|reglages)/.test(route)) naviguer('');
  };
  const vider = () => setFiltres(FILTRES_VIDES);

  async function creerTravail() {
    const nom = nouveau?.trim();
    setNouveau(null);
    if (!nom) return;
    const id = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || crypto.randomUUID();
    if (biblio.categories.some((c) => c.id === id)) return naviguer(`travail/${id}`);
    try {
      remplacer(await api.vocabulaire({ categories: [...biblio.categories, { id, nom }] }));
      notifier(`« ${nom} » créé.`);
      naviguer(`travail/${id}`);
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
    }
  }

  return (
    <div className="app">
      <aside className="cote" aria-label="Rayons et travaux">
        <a className="marque" href="#/" onClick={vider}>Biblio<span>thèque</span></a>
        <a className="bouton principal" href="#/ajouter"><Icone nom="plus" taille={18} /> Ajouter</a>

        <nav className="tiroirs" aria-label="Rayons">
          <a className="tiroir" href="#/" aria-current={route === '' ? 'page' : undefined} onClick={vider}>
            <Icone nom="accueil" /> Tout <span className="compte">{biblio.fiches.length}</span>
          </a>
          {RAYONS.map((r) => (
            <a key={r} className="tiroir" href={`#/${r}`} aria-current={actuel(r)} onClick={vider}>
              <Icone nom={ICONE_RAYON[r]} /> {NOM_RAYON[r]} <span className="compte">{compte(r)}</span>
            </a>
          ))}
          <a className="tiroir" href="#/favoris" aria-current={actuel('favoris')} onClick={vider}>
            <Icone nom="coeur" /> Favoris <span className="compte">{favoris}</span>
          </a>
        </nav>

        <nav className="tiroirs" aria-label="Travaux">
          <span className="etiquette tiroirs-titre">Mes travaux</span>
          {biblio.categories.map((c) => (
            <a key={c.id} className={`tiroir ${classeTravail(biblio, c.id)}`} href={`#/travail/${encodeURIComponent(c.id)}`} aria-current={actuel(`travail/${c.id}`)} onClick={vider}>
              <span className="pastille-couleur" /> {c.nom}
              <span className="compte">{biblio.fiches.filter((f) => f.categories?.includes(c.id)).length}</span>
            </a>
          ))}
          {nouveau === null ? (
            <button className="tiroir" onClick={() => setNouveau('')}>
              <Icone nom="plus" /> Nouveau travail
            </button>
          ) : (
            <div className="nouveau-travail">
              <input
                id="nouveau-travail"
                autoFocus
                placeholder="Ex. : Cours expérimentation"
                aria-label="Nom du nouveau travail"
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') creerTravail();
                  if (e.key === 'Escape') setNouveau(null);
                }}
                onBlur={creerTravail}
              />
            </div>
          )}
        </nav>

        <div className="cote-bas">
          <a className="tiroir" href="#/reglages" aria-current={actuel('reglages')}><Icone nom="reglages" /> Réglages</a>
        </div>
      </aside>

      <div className="principal">
        <header className="barre-haut">
          <a className="marque" href="#/" onClick={vider}>Biblio<span>thèque</span></a>
          <form className="recherche" role="search" onSubmit={(e) => { e.preventDefault(); champ.current?.blur(); }}>
            <Icone nom="loupe" taille={18} />
            <input
              ref={champ}
              id="recherche"
              type="search"
              enterKeyHint="search"
              placeholder="Chercher un titre, un auteur, une idée de mes notes…"
              aria-label="Rechercher"
              value={filtres.q}
              onChange={(e) => chercher(e.target.value)}
            />
            {filtres.q && (
              <button type="button" className="recherche-vider" onClick={() => chercher('')} aria-label="Effacer la recherche">
                <Icone nom="fermer" taille={16} />
              </button>
            )}
          </form>
          <a className="bouton-icone mobile" href="#/reglages" aria-label="Réglages"><Icone nom="reglages" /></a>
        </header>
        {children}
      </div>

      <nav className="onglets-bas" aria-label="Rayons">
        <a href="#/" aria-current={route === '' ? 'page' : undefined} onClick={vider}><Icone nom="accueil" /> Tout</a>
        {RAYONS.map((r) => (
          <a key={r} href={`#/${r}`} aria-current={actuel(r)} onClick={vider}>
            <Icone nom={ICONE_RAYON[r]} /> {r === 'articles' ? 'Articles' : NOM_RAYON[r]}
          </a>
        ))}
        <a href="#/favoris" aria-current={actuel('favoris')} onClick={vider}><Icone nom="coeur" /> Favoris</a>
      </nav>
      {!/^(ajouter|modifier)/.test(route) && (
        <a className="ajout-flottant" href="#/ajouter" aria-label="Ajouter une fiche"><Icone nom="plus" taille={26} /></a>
      )}
    </div>
  );
}
