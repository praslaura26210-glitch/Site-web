/**
 * Mode démonstration (aperçu sur claude.ai) : pas de serveur.
 * Les appels /api/* sont simulés dans le navigateur ; les essais restent dans ce navigateur (localStorage).
 */
import type { Bibliotheque, Categorie, Famille, Fiche } from '../types';
import { CATEGORIES_DEPART, FAMILLES_DEPART, SYNONYMES_DEPART } from '../vocabulaire';

export const DEMO = import.meta.env.VITE_DEMO === '1';

const CLE = 'demo-bibliotheque-v3';
const PREFIXE_IMAGE = 'demo-img:';
const images = new Map<string, string>();

/** Adresse d'une image : photo ajoutée pendant la démo, sinon fichier publié avec l'aperçu. */
export const demoSrc = (id: string) => images.get(id) ?? `demo-images/${id}.webp`;

const lire = <T,>(cle: string): T | null => {
  try { return JSON.parse(localStorage.getItem(cle) ?? 'null'); } catch { return null; }
};
const ecrire = (cle: string, v: string) => {
  try { localStorage.setItem(cle, v); return true; } catch { return false; }
};
const effacer = (cle: string) => {
  try { localStorage.removeItem(cle); } catch { /* rien */ }
};

let depart: { version: number; fiches: Fiche[]; categories?: Categorie[] } = { version: 1, fiches: [] };
let b: Bibliotheque;

function neuve(): Bibliotheque {
  return {
    version: 1, rev: 1, departVersion: depart.version,
    fiches: structuredClone(depart.fiches),
    categories: structuredClone(depart.categories ?? CATEGORIES_DEPART),
    familles: structuredClone(FAMILLES_DEPART),
    synonymes: structuredClone(SYNONYMES_DEPART),
  };
}

const sauver = () => {
  b.rev++;
  ecrire(CLE, JSON.stringify(b));
};

/** Efface les essais et revient au contenu de départ. */
export function reinitialiserDemo() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIXE_IMAGE) || k === CLE || k.startsWith('brouillon:')) effacer(k);
  } catch { /* rien */ }
  images.clear();
  b = neuve();
}

const reponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const erreur = (message: string, status: number) => reponse({ erreur: message }, status);

const lireDataUrl = (blob: Blob) =>
  new Promise<string>((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = ko;
    r.readAsDataURL(blob);
  });

async function route(chemin: string, methode: string, corps: BodyInit | null | undefined): Promise<Response> {
  const [nom, brut] = chemin.replace(/^\/?api\//, '').split('/');
  const param = brut ? decodeURIComponent(brut.split('?')[0]) : undefined;
  const json = async () => JSON.parse(typeof corps === 'string' ? corps : '{}');
  const maintenant = new Date().toISOString();

  if (nom === 'etat') return reponse({ configure: true, connecte: true });
  if (nom === 'connexion' || nom === 'deconnexion') return reponse({ ok: true });
  if (nom === 'bibliotheque') return reponse(b);

  if (nom === 'fiches' && methode === 'PUT' && param) {
    const f = (await json()) as Fiche;
    const i = b.fiches.findIndex((x) => x.id === param);
    const fiche: Fiche = { ...f, id: param, creeLe: i >= 0 ? b.fiches[i].creeLe : f.creeLe || maintenant, modifieLe: maintenant };
    if (i >= 0) b.fiches[i] = fiche;
    else b.fiches.push(fiche);
    sauver();
    return reponse({ fiche, rev: b.rev });
  }
  if (nom === 'fiches' && methode === 'POST') {
    const liste = (await json()) as Partial<Fiche>[];
    const nouvelles = liste.map((f) => ({
      images: [], auteurs: [], motsCles: [], citations: [], voirAussi: [], categories: [], statut: 'a-lire', type: 'site', titre: 'Sans titre',
      ...f, id: crypto.randomUUID(), creeLe: f.creeLe || maintenant, modifieLe: maintenant,
    }) as Fiche);
    b.fiches.push(...nouvelles);
    sauver();
    return reponse({ fiches: nouvelles, rev: b.rev });
  }
  if (nom === 'fiches' && methode === 'DELETE' && param) {
    const f = b.fiches.find((x) => x.id === param);
    b.fiches = b.fiches.filter((x) => x.id !== param);
    for (const x of b.fiches) x.voirAussi = x.voirAussi.filter((l) => l.id !== param);
    for (const im of f?.images ?? []) {
      images.delete(im.id);
      effacer(PREFIXE_IMAGE + im.id);
    }
    sauver();
    return reponse({ rev: b.rev });
  }
  if (nom === 'vocabulaire') {
    const v = (await json()) as { familles?: Famille[]; synonymes?: string[][]; categories?: Categorie[]; renommer?: { de: string; vers: string | null } };
    if (v.familles) b.familles = v.familles;
    if (v.categories) {
      b.categories = v.categories;
      const ids = new Set(v.categories.map((c) => c.id));
      for (const f of b.fiches) f.categories = (f.categories ?? []).filter((c) => ids.has(c));
    }
    if (v.synonymes) b.synonymes = v.synonymes;
    if (v.renommer?.de) {
      const { de, vers } = v.renommer;
      for (const f of b.fiches) {
        if (!f.motsCles.includes(de)) continue;
        const reste = f.motsCles.filter((m) => m !== de);
        f.motsCles = vers && !reste.includes(vers) ? [...reste, vers] : reste;
      }
    }
    sauver();
    return reponse(b);
  }
  if (nom === 'images' && methode === 'POST' && corps instanceof Blob) {
    const id = crypto.randomUUID();
    const url = await lireDataUrl(corps);
    const bmp = await createImageBitmap(corps);
    images.set(id, url);
    ecrire(PREFIXE_IMAGE + id, url);
    return reponse({ id, w: bmp.width, h: bmp.height });
  }
  if (nom === 'isbn' || nom === 'apercu') {
    return erreur('Dans l’aperçu, cette recherche est désactivée : elle fonctionnera sur le site en ligne.', 503);
  }
  return erreur('Adresse inconnue.', 404);
}

export async function installerDemo() {
  try {
    depart = await (await fetch('demo-depart.json')).json();
  } catch { /* aperçu sans contenu de départ */ }
  b = lire<Bibliotheque>(CLE) ?? neuve();
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIXE_IMAGE)) images.set(k.slice(PREFIXE_IMAGE.length), localStorage.getItem(k) ?? '');
    }
  } catch { /* stockage indisponible */ }

  const vrai = window.fetch.bind(window);
  window.fetch = (entree: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entree === 'string' ? entree : entree instanceof URL ? entree.href : entree.url;
    if (!/^\/?api\//.test(url)) return vrai(entree, init);
    return route(url, (init?.method ?? 'GET').toUpperCase(), init?.body);
  };
}
