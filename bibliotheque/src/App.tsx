import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bibliotheque, Fiche } from './types';
import { api, ErreurApi } from './lib/api';
import { FILTRES_VIDES, definirCategories, type Filtres } from './lib/recherche';
import { Ctx, type Contexte } from './contexte';
import { Connexion } from './composants/Connexion';
import { Navigation } from './composants/Navigation';
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

/** Pages de liste : on y retrouve la position de lecture au retour d'une fiche. */
const estListe = (r: string) => r === '' || /^(livres|articles|projets|favoris|travail\/)/.test(r);

export function App() {
  const [phase, setPhase] = useState<Phase>({ nom: 'chargement' });
  const [biblio, setBiblio] = useState<Bibliotheque | null>(null);
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES);
  const [route, setRoute] = useState(lireRoute);
  const [message, setMessage] = useState<string | null>(null);
  const partage = useRef<Preremplissage | null>(lirePartage());
  const defilements = useRef(new Map<string, number>());
  const couverturesLancees = useRef(false);

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
        if (estListe(avant)) defilements.current.set(avant, window.scrollY);
        return r;
      });
    };
    addEventListener('hashchange', suivre);
    return () => removeEventListener('hashchange', suivre);
  }, []);

  useEffect(() => {
    if (route !== 'ajouter') partage.current = null;
    const y = estListe(route) ? defilements.current.get(route) ?? 0 : 0;
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [route]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3200);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (biblio) definirCategories(biblio.categories);
  }, [biblio]);

  const majFiche = useCallback((f: Fiche, rev?: number) =>
    setBiblio((b) => b && {
      ...b,
      rev: rev ?? b.rev,
      fiches: b.fiches.some((x) => x.id === f.id) ? b.fiches.map((x) => (x.id === f.id ? f : x)) : [...b.fiches, f],
    }), []);

  // couvertures : cherchées toutes seules par l'ISBN, une fois par livre
  useEffect(() => {
    if (!biblio || DEMO || couverturesLancees.current) return;
    const cibles = biblio.fiches.filter((f) => f.type === 'livre' && f.isbn && !f.images.length && !f.couvertureCherchee);
    if (!cibles.length) return;
    couverturesLancees.current = true;
    (async () => {
      for (const f of cibles) {
        try {
          const n = await api.isbn(f.isbn!).catch(() => null);
          const maj: Fiche = {
            ...f,
            couvertureCherchee: true,
            images: n?.image ? [n.image] : f.images,
            source: f.source || n?.lien || f.source,
            editeur: f.editeur || n?.editeur,
            annee: f.annee || n?.annee,
            pages: f.pages || n?.pages,
          };
          const r = await api.enregistrer(maj);
          majFiche(r.fiche, r.rev);
        } catch { /* hors ligne : on réessaiera au prochain lancement */ }
      }
    })();
  }, [biblio, majFiche]);

  const ctx = useMemo<Contexte | null>(() => {
    if (!biblio) return null;
    const motsCles = biblio.familles.flatMap((f) => f.groupes.flatMap((g) => g.mots.map((mot) => ({ mot, famille: f.nom, groupe: g.nom }))));
    return {
      biblio,
      motsCles,
      remplacer: setBiblio,
      majFiche,
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
      route,
    };
  }, [biblio, filtres, majFiche, route]);

  if (phase.nom === 'chargement') return <div className="ecran-centre"><p className="discret">Ouverture de la bibliothèque…</p></div>;
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
  else if (page === 'ajouter' && param === 'projet' && route.split('/')[2]) {
    // projet ajouté depuis un livre : relié au livre, avec les mêmes travaux
    const livre = biblio?.fiches.find((f) => f.id === decodeURIComponent(route.split('/')[2]));
    contenu = <Formulaire key={`projet-${livre?.id}`} preremplissage={{ type: 'projet', citeDans: livre ? [livre.id] : [], categories: livre?.categories ?? [] }} />;
  } else if (page === 'ajouter') contenu = <Formulaire key="nouvelle" preremplissage={partage.current ?? undefined} />;
  else if (page === 'modifier' && param) contenu = <Formulaire key={param} id={decodeURIComponent(param)} />;
  else if (page === 'reglages') contenu = <Reglages />;
  else contenu = <Accueil />;

  return (
    <Ctx.Provider value={ctx}>
      {DEMO && (
        <p className="bandeau-demo">
          Aperçu de démonstration : tes essais restent dans ce navigateur. <a href="#/reglages">En savoir plus</a>
        </p>
      )}
      <Navigation>
        <main className="page">{contenu}</main>
      </Navigation>
      {message && <div className="toast" role="status">{message}</div>}
    </Ctx.Provider>
  );
}
