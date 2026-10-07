import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { RAYONS, type Rayon } from '../types';
import { useBiblio } from '../contexte';
import { FILTRES_VIDES } from '../lib/recherche';
import { Icone, type NomIcone } from './Icone';

export const NOM_RAYON: Record<Rayon, string> = { livres: 'Livres', articles: 'Articles', projets: 'Projets' };
const ICONE_RAYON: Record<Rayon, NomIcone> = { livres: 'livre', articles: 'article', projets: 'projet' };

/** Barre du haut (rayons, recherche, favoris, ajout) ; onglets en bas sur téléphone. */
export function Navigation({ children }: { children: ReactNode }) {
  const { route, filtres, setFiltres, naviguer } = useBiblio();
  const champ = useRef<HTMLInputElement>(null);

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

  const actuel = (r: string) => (route === r || route.startsWith(`${r}/`) ? 'page' : undefined);

  // depuis une fiche ou un formulaire, la recherche ramène à l'accueil
  const chercher = (q: string) => {
    setFiltres((f) => ({ ...f, q }));
    if (/^(fiche|ajouter|modifier|reglages)/.test(route)) naviguer('');
  };
  const vider = () => setFiltres(FILTRES_VIDES);

  return (
    <>
      <header className="entete">
        <div className="entete-in">
          <a className="marque" href="#/" onClick={vider}>Bibliothèque</a>
          <nav className="nav" aria-label="Rayons">
            {RAYONS.map((r) => (
              <a key={r} href={`#/${r}`} aria-current={actuel(r)} onClick={vider}>{NOM_RAYON[r]}</a>
            ))}
          </nav>
          <div className="entete-droite">
            <form className="recherche" role="search" onSubmit={(e) => { e.preventDefault(); champ.current?.blur(); }}>
              <Icone nom="loupe" taille={18} />
              <input
                ref={champ}
                id="recherche"
                type="search"
                enterKeyHint="search"
                placeholder="Rechercher"
                aria-label="Rechercher un titre, un auteur, un mot de mes notes"
                value={filtres.q}
                onChange={(e) => chercher(e.target.value)}
              />
              {filtres.q && (
                <button type="button" className="recherche-vider" onClick={() => chercher('')} aria-label="Effacer la recherche">
                  <Icone nom="fermer" taille={15} />
                </button>
              )}
            </form>
            <a className="bouton-icone lien-coeur" href="#/favoris" aria-current={actuel('favoris')} aria-label="Favoris" title="Favoris" onClick={vider}>
              <Icone nom="coeur" />
            </a>
            <a className="bouton-icone" href="#/reglages" aria-current={actuel('reglages')} aria-label="Réglages" title="Réglages">
              <Icone nom="reglages" />
            </a>
            <a className="bouton principal petit ajouter" href="#/ajouter"><Icone nom="plus" taille={16} /> Ajouter</a>
          </div>
        </div>
      </header>

      {children}

      <nav className="onglets-bas" aria-label="Rayons">
        <a href="#/" aria-current={route === '' ? 'page' : undefined} onClick={vider}><Icone nom="accueil" /> Accueil</a>
        {RAYONS.map((r) => (
          <a key={r} href={`#/${r}`} aria-current={actuel(r)} onClick={vider}><Icone nom={ICONE_RAYON[r]} /> {NOM_RAYON[r]}</a>
        ))}
        <a href="#/favoris" aria-current={actuel('favoris')} onClick={vider}><Icone nom="coeur" /> Favoris</a>
      </nav>
      {!/^(ajouter|modifier)/.test(route) && (
        <a className="ajout-flottant" href="#/ajouter" aria-label="Ajouter une fiche"><Icone nom="plus" taille={24} /></a>
      )}
    </>
  );
}
