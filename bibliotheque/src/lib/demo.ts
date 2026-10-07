/**
 * Version claude.ai : pas de serveur à nous, les appels /api/* sont traités dans le navigateur.
 * - Si la page a accès à la base de claude.ai (capacités `db` et `assets`), les fiches y sont enregistrées
 *   et les photos stockées avec l'artefact : on les retrouve sur tous ses appareils.
 * - Sinon, repli sur le navigateur (localStorage), comme un simple aperçu.
 */
import type { Bibliotheque, Categorie, Famille, Fiche, Image } from '../types';
import { CATEGORIES_DEPART, FAMILLES_DEPART, SYNONYMES_DEPART } from '../vocabulaire';

export const DEMO = import.meta.env.VITE_DEMO === '1';

const CLE = 'demo-bibliotheque-v4';
/** Anciennes versions de l'aperçu : leurs essais sont repris dans la base au premier lancement. */
const CLES_ANCIENNES = ['demo-bibliotheque-v4', 'demo-bibliotheque-v3', 'demo-bibliotheque-v2'];
const MIGRATION_FAITE = 'bibliotheque-migree-vers-claude';
const PREFIXE_IMAGE = 'demo-img:';
const images = new Map<string, string>();

/* eslint-disable @typescript-eslint/no-explicit-any */
let db: any = null;
let assets: any = null;

/** Vrai quand les fiches sont enregistrées dans la base de claude.ai (et pas seulement dans ce navigateur). */
export let enregistreEnLigne = false;

/** Adresse d'une image : photo stockée sur claude.ai, photo locale, ou fichier publié avec la page. */
export const demoSrc = (id: string) =>
  images.get(id) ?? (/^[0-9a-f]{32}$/.test(id) ? `/_blob/${id}` : `demo-images/${id}.webp`);

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
    fiches: structuredClone(depart.fiches).map(({ depuis: _, ...f }: Fiche & { depuis?: number }) => f),
    categories: structuredClone(depart.categories ?? CATEGORIES_DEPART),
    familles: structuredClone(FAMILLES_DEPART),
    synonymes: structuredClone(SYNONYMES_DEPART),
  };
}

/** JSON pur : la base refuse les valeurs `undefined`. */
const propre = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

async function ecrireFiche(f: Fiche) {
  if (db) await db.doc(`fiches/${f.id}`).set(propre(f));
}
async function ecrireVocabulaire() {
  if (db) await db.doc('config/vocabulaire').set(propre({ familles: b.familles, synonymes: b.synonymes, categories: b.categories, departVersion: b.departVersion }));
}

const sauverLocal = () => {
  b.rev++;
  if (!db) ecrire(CLE, JSON.stringify(b));
};

/** Efface les essais de ce navigateur et revient au contenu de départ (sans base en ligne seulement). */
export function reinitialiserDemo() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIXE_IMAGE) || CLES_ANCIENNES.includes(k) || k.startsWith('brouillon:')) effacer(k);
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

/** Stocke une image : sur claude.ai si possible, sinon dans le navigateur. */
async function stockerImage(blob: Blob): Promise<Image> {
  const bmp = await createImageBitmap(blob);
  if (assets) {
    try {
      const r = await assets.upload(blob);
      return { id: r.id, w: bmp.width, h: bmp.height };
    } catch (e: any) {
      // envoi refusé ou impossible : l'image reste sur cet appareil, elle repartira plus tard
      if (e?.code === 'too_large') throw e;
    }
  }
  const id = crypto.randomUUID();
  const url = await lireDataUrl(blob);
  images.set(id, url);
  ecrire(PREFIXE_IMAGE + id, url);
  return { id, w: bmp.width, h: bmp.height };
}

async function route(chemin: string, methode: string, corps: BodyInit | null | undefined): Promise<Response> {
  const [nom, brut] = chemin.replace(/^\/?api\//, '').split('/');
  const param = brut ? decodeURIComponent(brut.split('?')[0]) : undefined;
  const json = async () => JSON.parse(typeof corps === 'string' ? corps : '{}');
  const maintenant = new Date().toISOString();

  try {
    if (nom === 'etat') return reponse({ configure: true, connecte: true });
    if (nom === 'connexion' || nom === 'deconnexion') return reponse({ ok: true });
    if (nom === 'bibliotheque') return reponse(b);

    if (nom === 'fiches' && methode === 'PUT' && param) {
      const f = (await json()) as Fiche;
      const i = b.fiches.findIndex((x) => x.id === param);
      const fiche: Fiche = { ...f, id: param, creeLe: i >= 0 ? b.fiches[i].creeLe : f.creeLe || maintenant, modifieLe: maintenant };
      await ecrireFiche(fiche);
      if (i >= 0) b.fiches[i] = fiche;
      else b.fiches.push(fiche);
      sauverLocal();
      return reponse({ fiche, rev: b.rev });
    }
    if (nom === 'fiches' && methode === 'POST') {
      const liste = (await json()) as Partial<Fiche>[];
      const nouvelles = liste.map((f) => ({
        images: [], auteurs: [], motsCles: [], citations: [], voirAussi: [], categories: [], statut: 'a-lire', type: 'site', titre: 'Sans titre',
        ...f, id: crypto.randomUUID(), creeLe: f.creeLe || maintenant, modifieLe: maintenant,
      }) as Fiche);
      for (const f of nouvelles) await ecrireFiche(f);
      b.fiches.push(...nouvelles);
      sauverLocal();
      return reponse({ fiches: nouvelles, rev: b.rev });
    }
    if (nom === 'fiches' && methode === 'DELETE' && param) {
      const f = b.fiches.find((x) => x.id === param);
      if (db) await db.doc(`fiches/${param}`).delete();
      b.fiches = b.fiches.filter((x) => x.id !== param);
      for (const im of f?.images ?? []) {
        // une photo n'est effacée que si plus aucune fiche ne l'utilise
        if (b.fiches.some((x) => x.images.some((y) => y.id === im.id))) continue;
        if (assets && /^[0-9a-f]{32}$/.test(im.id)) await assets.delete(im.id).catch(() => {});
        images.delete(im.id);
        effacer(PREFIXE_IMAGE + im.id);
      }
      sauverLocal();
      return reponse({ rev: b.rev });
    }
    if (nom === 'vocabulaire') {
      const v = (await json()) as { familles?: Famille[]; synonymes?: string[][]; categories?: Categorie[]; renommer?: { de: string; vers: string | null } };
      const modifiees = new Set<Fiche>();
      if (v.familles) b.familles = v.familles;
      if (v.categories) {
        b.categories = v.categories;
        const ids = new Set(v.categories.map((c) => c.id));
        for (const f of b.fiches) {
          const reste = (f.categories ?? []).filter((c) => ids.has(c));
          if (reste.length !== (f.categories ?? []).length) { f.categories = reste; modifiees.add(f); }
        }
      }
      if (v.synonymes) b.synonymes = v.synonymes;
      if (v.renommer?.de) {
        const { de, vers } = v.renommer;
        for (const f of b.fiches) {
          if (!f.motsCles.includes(de)) continue;
          const reste = f.motsCles.filter((m) => m !== de);
          f.motsCles = vers && !reste.includes(vers) ? [...reste, vers] : reste;
          modifiees.add(f);
        }
      }
      await ecrireVocabulaire();
      for (const f of modifiees) await ecrireFiche(f);
      sauverLocal();
      return reponse(b);
    }
    if (nom === 'images' && methode === 'POST' && corps instanceof Blob) {
      return reponse(await stockerImage(corps));
    }
    if (nom === 'isbn' || nom === 'apercu' || nom === 'image-distante') {
      return erreur('Ici, sur claude.ai, la page ne peut pas aller chercher sur Internet : ajoute une capture ou une photo.', 503);
    }
    return erreur('Adresse inconnue.', 404);
  } catch (e: any) {
    const code = e?.code ?? '';
    if (code === 'quota_exceeded' || code === 'quota_or_state') return erreur('L’espace de stockage est plein.', 507);
    if (code === 'too_large') return erreur('Image trop lourde.', 413);
    return erreur('Enregistrement impossible pour le moment. Réessaie dans un instant.', 503);
  }
}

const estAsset = (id: string) => /^[0-9a-f]{32}$/.test(id);

/** Nombre d'images encore gardées seulement dans ce navigateur. */
export const imagesLocales = () => (db && assets ? b.fiches.reduce((n, f) => n + f.images.filter((i) => !estAsset(i.id) && images.has(i.id)).length, 0) : 0);

/** Envoie sur claude.ai les images gardées dans ce navigateur, pour les voir aussi sur le téléphone. */
export async function envoyerImagesLocales(): Promise<{ envoyees: number; restantes: number }> {
  let envoyees = 0;
  let bloque = false;
  if (!db || !assets) return { envoyees, restantes: 0 };
  for (const f of [...b.fiches]) {
    if (bloque) break;
    if (!f.images.some((i) => !estAsset(i.id) && images.has(i.id))) continue;
    const nouvelles: Image[] = [];
    let change = false;
    for (const im of f.images) {
      const url = !estAsset(im.id) ? images.get(im.id) : undefined;
      if (url) {
        try {
          const blob = await (await fetch(url)).blob();
          const r = await assets.upload(blob);
          nouvelles.push({ ...im, id: r.id });
          change = true;
          envoyees++;
          continue;
        } catch (e: any) {
          if (e?.code !== 'too_large' && e?.code !== 'unsupported_type') {
            nouvelles.push(im, ...f.images.slice(f.images.indexOf(im) + 1));
            bloque = true;
            break;
          }
        }
      }
      nouvelles.push(im);
    }
    if (!change) continue;
    const fiche = { ...f, images: nouvelles };
    await ecrireFiche(fiche);
    b.fiches[b.fiches.indexOf(f)] = fiche;
    b.rev++;
    for (const im of f.images) {
      if (!b.fiches.some((x) => x.images.some((y) => y.id === im.id))) { images.delete(im.id); effacer(PREFIXE_IMAGE + im.id); }
    }
  }
  return { envoyees, restantes: imagesLocales() };
}

/** Reprend dans la base les fiches et photos saisies dans ce navigateur avant l'enregistrement en ligne. */
async function migrerEssaisLocaux() {
  if (lire<boolean>(MIGRATION_FAITE)) return;
  const cle = CLES_ANCIENNES.find((k) => lire(k));
  const locale = cle ? lire<Bibliotheque>(cle) : null;
  if (!locale) { ecrire(MIGRATION_FAITE, 'true'); return; }
  const parId = new Map(b.fiches.map((f) => [f.id, f]));
  for (const f of locale.fiches) {
    const enBase = parId.get(f.id);
    const aDesPhotos = f.images.some((im) => images.has(im.id));
    if (enBase && enBase.modifieLe >= f.modifieLe && !aDesPhotos) continue;
    const nouvelles = f.images;
    const fiche: Fiche = { ...(enBase ?? {}), ...f, images: nouvelles, categories: f.categories ?? enBase?.categories ?? [] };
    await ecrireFiche(fiche);
    if (enBase) b.fiches[b.fiches.indexOf(enBase)] = fiche;
    else b.fiches.push(fiche);
  }
  ecrire(MIGRATION_FAITE, 'true');
}

export async function installerDemo() {
  try {
    depart = await (await fetch('demo-depart.json')).json();
  } catch { /* page sans contenu de départ */ }
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIXE_IMAGE)) images.set(k.slice(PREFIXE_IMAGE.length), localStorage.getItem(k) ?? '');
    }
  } catch { /* stockage indisponible */ }

  // base et stockage de claude.ai, quand la page y a accès
  const claude = (window as any).claude;
  if (claude?.use) {
    [db, assets] = await Promise.all([claude.use('db').catch(() => null), claude.use('assets').catch(() => null)]);
  }

  if (db) {
    try {
      const [snap, conf] = await Promise.all([db.collection('fiches').limit(1000).get(), db.doc('config/vocabulaire').get()]);
      const v = conf.exists ? conf.data() : null;
      const fiches = snap.docs.map((d: any) => d.data() as Fiche);
      const base = neuve();
      b = {
        version: 1, rev: 1,
        fiches: fiches.length ? fiches : base.fiches,
        categories: v?.categories ?? base.categories,
        familles: v?.familles ?? base.familles,
        synonymes: v?.synonymes ?? base.synonymes,
        departVersion: v?.departVersion ?? base.departVersion,
      };
      // base vide : on y range le contenu de départ, une seule fois
      if (!fiches.length) {
        for (const f of b.fiches) await ecrireFiche(f);
        await ecrireVocabulaire();
      } else if ((b.departVersion ?? 0) < depart.version) {
        // contenu de départ enrichi depuis : seules les fiches nouvelles sont ajoutées
        const ids = new Set(fiches.map((f: Fiche) => f.id));
        const avant = b.departVersion ?? 0;
        for (const { depuis, ...f } of depart.fiches as (Fiche & { depuis?: number })[]) {
          if (ids.has(f.id) || (depuis ?? 1) <= avant) continue;
          await ecrireFiche(f);
          b.fiches.push(f);
        }
        b.departVersion = depart.version;
        await ecrireVocabulaire();
      }
      await migrerEssaisLocaux();
      enregistreEnLigne = true;
    } catch {
      db = null;
      assets = null;
    }
  }
  if (!db) b = CLES_ANCIENNES.map((k) => lire<Bibliotheque>(k)).find(Boolean) ?? neuve();

  const vrai = window.fetch.bind(window);
  window.fetch = (entree: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entree === 'string' ? entree : entree instanceof URL ? entree.href : entree.url;
    if (!/^\/?api\//.test(url)) return vrai(entree, init);
    return route(url, (init?.method ?? 'GET').toUpperCase(), init?.body);
  };
}
