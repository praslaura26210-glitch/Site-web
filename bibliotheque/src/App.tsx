import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bibliotheque, Fiche } from './types';
import { api, ErreurApi } from './lib/api';
import { FILTRES_VIDES, type Filtres } from './lib/recherche';
import { Ctx, type Contexte } from './contexte';
import { Connexion } from './composants/Connexion';
import { EnTete } from './composants/EnTete';
import { Accueil } from './composants/Accueil';
import { FicheVue } from './composants/FicheVue';
import { Formulaire, type Preremplissage } from './composants/Formulaire';
import { Reglages } from './composants/Reglages';
import { DEMO } from './lib/demo';

type Phase = { nom: 'chargement' } | { nom: 'connexion'; configure: boolean } | { nom: 'erreur'; message: string } | { nom: 'prete' };

const lireRoute = () => location.hash.replace(/^#\/?/, '');

/** Lien partagé depuis le téléphone (menu « Partager » → Bibliothèque) : ouvre le formulaire prérempli. */
function lirePartage(): Preremplissage | null {
  const p = new URLSearchParams(location.search);
  const texte = p.get('texte') ?? '';
  const lien = p.get('lien') || texte.match(/https?:\/\/\S+/)?.[0];
  if (!lien) return null;
  history.replaceState(null, '', '/#/ajouter');
  return { source: lien, titre: p.get('titre') ?? undefined };
}

export function App() {
  const [phase, setPhase] = useState<Phase>({ nom: 'chargement' });
  const [biblio, setBiblio] = useState<Bibliotheque | null>(null);
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES);
  const [route, setRoute] = useState(lireRoute);
  const [message, setMessage] = useState<string | null>(null);
  const partage = useRef<Preremplissage | null>(lirePartage());
  const defilement = useRef(0);

  const charger = useCallback(async () => {
    setPhase({ nom: 'chargement' });
    try {
      const b = await api.bibliotheque();
      setBiblio(b);
      setPhase({ nom: 'prete' });
    } catch (e) {
      if (e instanceof ErreurApi && e.status === 401) {
        const etat = await api.etat().catch(() => ({ configure: true }));
        setPhase({ nom: 'connexion', configure: etat.configure });
      } else {
        setPhase({ nom: 'erreur', message: e instanceof Error ? e.message : 'Erreur inconnue.' });
      }
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    const suivre = () => {
      const r = lireRoute();
      setRoute((avant) => {
        if (avant === '') defilement.current = window.scrollY;
        return r;
      });
    };
    addEventListener('hashchange', suivre);
    return () => removeEventListener('hashchange', suivre);
  }, []);

  useEffect(() => {
    if (route !== 'ajouter') partage.current = null;
  }, [route]);

  // retour à l'étagère : on retrouve la position de lecture
  useEffect(() => {
    if (route === '') requestAnimationFrame(() => window.scrollTo(0, defilement.current));
    else window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3200);
    return () => clearTimeout(t);
  }, [message]);

  const ctx = useMemo<Contexte | null>(() => {
    if (!biblio) return null;
    const motsCles = biblio.familles.flatMap((f) => f.groupes.flatMap((g) => g.mots.map((mot) => ({ mot, famille: f.nom, groupe: g.nom }))));
    return {
      biblio,
      motsCles,
      remplacer: setBiblio,
      majFiche: (f: Fiche, rev?: number) =>
        setBiblio((b) => b && {
          ...b,
          rev: rev ?? b.rev,
          fiches: b.fiches.some((x) => x.id === f.id) ? b.fiches.map((x) => (x.id === f.id ? f : x)) : [...b.fiches, f],
        }),
      retirerFiche: (id: string, rev?: number) =>
        setBiblio((b) => b && {
          ...b,
          rev: rev ?? b.rev,
          fiches: b.fiches.filter((x) => x.id !== id).map((x) => ({ ...x, voirAussi: x.voirAussi.filter((l) => l.id !== id) })),
        }),
      filtres,
      setFiltres,
      naviguer: (r: string) => {
        location.hash = r ? `#/${r}` : '#/';
      },
      notifier: setMessage,
    };
  }, [biblio, filtres]);

  if (phase.nom === 'chargement') return <div className="ecran-centre"><p className="mono discret">Ouverture de la bibliothèque…</p></div>;
  if (phase.nom === 'connexion') return <Connexion configure={phase.configure} apres={charger} />;
  if (phase.nom === 'erreur' || !ctx) {
    return (
      <div className="ecran-centre">
        <p>{phase.nom === 'erreur' ? phase.message : 'Erreur.'}</p>
        <button className="bouton" onClick={charger}>Réessayer</button>
      </div>
    );
  }

  const [page, param] = route.split('/');
  let contenu;
  if (page === 'fiche' && param) contenu = <FicheVue key={param} id={decodeURIComponent(param)} />;
  else if (page === 'ajouter') contenu = <Formulaire key="nouvelle" preremplissage={partage.current ?? undefined} />; else if (page === 'modifier' && param) contenu = <Formulaire key={param} id={decodeURIComponent(param)} />;
  else if (page === 'reglages') contenu = <Reglages />;
  else contenu = <Accueil />;

  return (
    <Ctx.Provider value={ctx}>
      {DEMO && (
        <p className="bandeau-demo mono">
          Aperçu de démonstration : tes essais restent dans ce navigateur. <a href="#/reglages">En savoir plus</a>
        </p>
      )}
      <EnTete />
      <main className="page">{contenu}</main>
      {message && <div className="toast" role="status">{message}</div>}
    </Ctx.Provider>
  );
}
