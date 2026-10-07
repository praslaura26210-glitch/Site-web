import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { RAYONS, type Rayon } from '../types';
import { useBiblio } from '../contexte';
import { FILTRES_VIDES } from '../lib/recherche';
import { Icone, type NomIcone } from './Icone';

export const NOM_RAYON: Record<Rayon, string> = { livres: 'Livres', articles: 'Articles', projets: 'Projets' };
const ICONE_RAYON: Record<Rayon, NomIcone> = { livres: 'livre', articles: 'article', projets: 'projet' };

/**
 * En haut : « Bibliothèque », la recherche au milieu (sur téléphone, derrière la loupe) avec les
 * catégories et réglages au bout, et le cœur. Les rayons sont en bas.
 */
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

  // téléphone : la loupe ouvre la recherche ; elle reste ouverte tant qu'il y a une recherche
  const [ouverte, setOuverte] = useState(false);
  useEffect(() => { if (!filtres.q) setOuverte(false); }, [route]); // eslint-disable-line react-hooks/exhaustive-deps
  const ouvrir = () => { setOuverte(true); requestAnimationFrame(() => champ.current?.focus()); };
  const fermer = () => { chercher(''); setOuverte(false); };

  return (
    <>
      <header className="entete">
        <div className="entete-in">
          <a className="marque" href="#/" onClick={vider}>Bibliothèque</a>
          <form className={`recherche${ouverte || filtres.q ? ' ouverte' : ''}`} role="search" onSubmit={(e) => { e.preventDefault(); champ.current?.blur(); }}>
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
            <MenuFiltres />
            <button type="button" className="recherche-fermer" onClick={fermer} aria-label="Fermer la recherche">
              <Icone nom="fermer" taille={20} />
            </button>
          </form>
          <div className="entete-icones">
            <button type="button" className="bouton-icone bouton-loupe" onClick={ouvrir} aria-label="Rechercher" title="Rechercher">
              <Icone nom="loupe" taille={22} />
            </button>
            <a className="bouton-icone lien-coeur" href="#/favoris" aria-current={actuel('favoris')} aria-label="Favoris" title="Favoris" onClick={vider}>
              <Icone nom="coeur" taille={24} />
            </a>
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
        <a className="ajout-flottant" href="#/ajouter" aria-label="Ajouter une fiche" title="Ajouter une fiche"><Icone nom="plus" taille={24} /></a>
      )}
    </>
  );
}

/** Petit bouton au bout de la barre de recherche : les catégories (mémoire, studio…) et les réglages. */
function MenuFiltres() {
  const { biblio, route, setFiltres } = useBiblio();
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const actuelle = route.startsWith('travail/') ? decodeURIComponent(route.split('/')[1]) : null;

  useEffect(() => setOuvert(false), [route]);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: Event) => { if (!boite.current?.contains(e.target as Node)) setOuvert(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    addEventListener('pointerdown', fermer);
    addEventListener('keydown', echap);
    return () => { removeEventListener('pointerdown', fermer); removeEventListener('keydown', echap); };
  }, [ouvert]);

  const aller = () => { setOuvert(false); setFiltres(FILTRES_VIDES); };

  return (
    <div className="menu-filtres" ref={boite}>
      <button
        type="button"
        className={`bouton-filtres${actuelle ? ' actif' : ''}`}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        aria-label="Catégories et réglages"
        title="Catégories et réglages"
        onClick={() => setOuvert((o) => !o)}
      >
        <Icone nom="reglages" taille={19} />
      </button>
      {ouvert && (
        <div className="menu" role="menu">
          <p className="menu-titre">Catégories</p>
          {biblio.categories.length === 0 && <p className="discret">Aucune catégorie.</p>}
          {biblio.categories.map((c) => {
            const n = biblio.fiches.filter((f) => f.categories?.includes(c.id)).length;
            return (
              <a key={c.id} role="menuitem" href={`#/travail/${encodeURIComponent(c.id)}`} aria-current={actuelle === c.id ? 'page' : undefined} onClick={aller}>
                {c.nom}<span className="compte">{n}</span>
              </a>
            );
          })}
          <hr />
          <a role="menuitem" href="#/reglages" className="menu-secondaire" onClick={aller}>
            <Icone nom="reglages" taille={16} /> Réglages
          </a>
        </div>
      )}
    </div>
  );
}
