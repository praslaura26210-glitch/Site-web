import { useEffect, useRef } from 'react';
import { useBiblio } from '../contexte';
import { FILTRES_VIDES } from '../lib/recherche';
import { Icone } from './Icone';

export function EnTete() {
  const { filtres, setFiltres, naviguer } = useBiblio();
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

  const chercher = (q: string) => {
    setFiltres((f) => ({ ...f, q }));
    if (location.hash.replace(/^#\/?/, '') !== '') naviguer('');
  };

  return (
    <header className="entete">
      <div className="entete-in">
        <a
          className="marque"
          href="#/"
          onClick={() => setFiltres(FILTRES_VIDES)}
          title="Retour à l’étagère"
        >
          Bibliothèque
        </a>
        <form className="recherche" role="search" onSubmit={(e) => { e.preventDefault(); champ.current?.blur(); }}>
          <Icone nom="loupe" taille={18} />
          <input
            ref={champ}
            type="search"
            enterKeyHint="search"
            placeholder="Chercher un titre, un auteur, un mot, une citation…"
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
        <nav className="entete-actions">
          <a className="bouton principal bouton-ajouter" href="#/ajouter">
            <Icone nom="plus" taille={18} />
            <span>Ajouter</span>
          </a>
          <a className="bouton-icone" href="#/reglages" aria-label="Réglages" title="Réglages">
            <Icone nom="reglages" />
          </a>
        </nav>
      </div>
    </header>
  );
}
