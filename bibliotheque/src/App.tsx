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
import { DEMO, enregistreEnLigne, envoyerImagesLocales, imagesLocales } from './lib/demo';
import { domaine } from './lib/libelles';

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
const estListe = (r: string) => r === '' || /^(livres|articles|projets|favoris|travail\/|auteur\/)/.test(r);

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

  // historique tenu par la page : le « Retour » du navigateur ne marche pas partout (page intégrée dans claude.ai)
  const historique = useRef<string[]>([lireRoute()]);
  const enRetour = useRef(false);

  useEffect(() => {
    const suivre = () => {
      const r = lireRoute();
      const h = historique.current;
      if (enRetour.current) enRetour.current = false;
      else if (h[h.length - 1] !== r) {
        // un aller-retour navigateur (bouton du téléphone) revient sur la page d'avant : on la retire
        if (h[h.length - 2] === r) h.pop();
        else h.push(r);
      }
      if (h.length > 50) h.splice(0, h.length - 50);
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

  // images manquantes cherchées toutes seules, une fois par fiche :
  // couverture des livres par l'ISBN, photo des projets et articles sur la page de leur lien (ArchDaily…)
  useEffect(() => {
    if (!biblio || DEMO || couverturesLancees.current) return;
    const livres = biblio.fiches.filter((f) => f.type === 'livre' && f.isbn && !f.images.length && !f.couvertureCherchee);
    const autres = biblio.fiches.filter((f) => f.type !== 'livre' && f.source && !f.images.length && !f.imageCherchee);
    if (!livres.length && !autres.length) return;
    couverturesLancees.current = true;
    (async () => {
      for (const f of [...livres, ...autres]) {
        try {
          let maj: Fiche;
          if (f.type === 'livre') {
            const n = await api.isbn(f.isbn!).catch(() => null);
            maj = {
              ...f, couvertureCherchee: true, images: n?.image ? [n.image] : f.images,
              editeur: f.editeur || n?.editeur, annee: f.annee || n?.annee, pages: f.pages || n?.pages,
            };
          } else {
            const a = await api.apercu(f.source!).catch(() => null);
            const site = a?.site || domaine(f.source);
            maj = { ...f, imageCherchee: true, images: a?.image ? [{ ...a.image, credit: `Source : ${site}` }] : f.images };
          }
          const r = await api.enregistrer(maj);
          majFiche(r.fiche, r.rev);
        } catch { /* hors ligne : on réessaiera au prochain lancement */ }
      }
    })();
  }, [biblio, majFiche]);

  // version claude.ai : les images gardées dans ce navigateur partent en ligne, pour le téléphone aussi
  const envoiLance = useRef(false);
  useEffect(() => {
    if (!biblio || !DEMO || envoiLance.current || !imagesLocales()) return;
    envoiLance.current = true;
    envoyerImagesLocales()
      .then(async (r) => { if (r.envoyees) setBiblio(await api.bibliotheque()); })
      .catch(() => { /* on réessaiera au prochain lancement */ });
  }, [biblio]);

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
      retour: (defaut = '') => {
        const h = historique.current;
        h.pop();
        const avant = h.length ? h[h.length - 1] : defaut;
        if (!h.length) h.push(avant);
        enRetour.current = true;
        if (lireRoute() === avant) { enRetour.current = false; return; }
        location.hash = avant ? `#/${avant}` : '#/';
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
      {DEMO && !enregistreEnLigne && (
        <p className="bandeau-demo">
          Aperçu : tes ajouts restent dans ce navigateur. <a href="#/reglages">En savoir plus</a>
        </p>
      )}
      <Navigation>
        <main className="page">{contenu}</main>
      </Navigation>
      {message && <div className="toast" role="status">{message}</div>}
    </Ctx.Provider>
  );
}
