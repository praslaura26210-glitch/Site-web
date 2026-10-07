import { randomUUID } from 'node:crypto';
import type { Bibliotheque, Categorie, Famille, Fiche, Image } from '../src/types';
import { TYPES, STATUTS } from '../src/types';
import { CATEGORIES_DEPART, FAMILLES_DEPART, SYNONYMES_DEPART } from '../src/vocabulaire';
import depart from '../depart/depart.json';
import { lireBibliotheque, ecrireBibliotheque, lireImage, ecrireImage, supprimerImage } from './stockage';
import { cookieFin, cookieSession, estConnecte, motDePasseConfigure, verifierMotDePasse } from './session';
import { chercherApercu, chercherIsbn, telechargerImage } from './recuperation';
import { dimensions, typeImage } from './dimensions';

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

const erreur = (message: string, status: number) => json({ erreur: message }, status);

type FicheDepart = Fiche & { depuis: number };
const DEPART = depart as unknown as { version: number; fiches: FicheDepart[]; categories?: Categorie[]; images: Record<string, string> };

async function ecrireImagesDepart(fiches: Fiche[]) {
  for (const id of new Set(fiches.flatMap((f) => f.images.map((i) => i.id)))) {
    const b64 = DEPART.images[id];
    if (!b64) continue;
    const buf = Buffer.from(b64, 'base64');
    await ecrireImage(id, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, 'image/webp');
  }
}

const sansDepuis = ({ depuis: _, ...f }: FicheDepart): Fiche => f;

/** Ajoute les mots-clés et synonymes de départ qui manquent, sans toucher aux réglages existants. */
function completerVocabulaire(b: Bibliotheque) {
  for (const fam of FAMILLES_DEPART) {
    const cible = b.familles.find((f) => f.id === fam.id);
    if (!cible) { b.familles.push(structuredClone(fam)); continue; }
    const connus = new Set(b.familles.flatMap((f) => f.groupes.flatMap((g) => g.mots)));
    for (const g of fam.groupes) {
      const manquants = g.mots.filter((m) => !connus.has(m));
      if (!manquants.length) continue;
      const gc = cible.groupes.find((x) => x.nom === g.nom);
      if (gc) gc.mots.push(...manquants);
      else cible.groupes.push({ nom: g.nom, mots: manquants });
    }
  }
  const premiers = new Set(b.synonymes.map((l) => l[0]));
  for (const l of SYNONYMES_DEPART) if (!premiers.has(l[0])) b.synonymes.push(l);
}

/**
 * Première ouverture : la bibliothèque commence avec le contenu de départ.
 * Ensuite, seules les fiches ajoutées dans une version plus récente du contenu de départ sont intégrées
 * (une fiche de départ supprimée ne revient pas).
 */
async function charger(): Promise<Bibliotheque> {
  const b = await lireBibliotheque();
  if (!b) {
    const fiches = DEPART.fiches.map(sansDepuis);
    await ecrireImagesDepart(fiches);
    const neuve: Bibliotheque = {
      version: 1, rev: 1, fiches, categories: DEPART.categories ?? CATEGORIES_DEPART,
      familles: FAMILLES_DEPART, synonymes: SYNONYMES_DEPART, departVersion: DEPART.version,
    };
    await ecrireBibliotheque(neuve);
    return neuve;
  }
  // bibliothèques créées avant l'ajout des catégories
  b.categories ??= structuredClone(DEPART.categories ?? CATEGORIES_DEPART);
  for (const f of b.fiches) f.categories ??= [];
  const deja = b.departVersion ?? 1;
  if (deja < DEPART.version) {
    const presentes = new Set(b.fiches.map((f) => f.id));
    const nouvelles = DEPART.fiches.filter((f) => f.depuis > deja && !presentes.has(f.id)).map(sansDepuis);
    await ecrireImagesDepart(nouvelles);
    b.fiches.push(...nouvelles);
    completerVocabulaire(b);
    for (const c of DEPART.categories ?? []) if (!b.categories.some((x) => x.id === c.id)) b.categories.push(c);
    b.departVersion = DEPART.version;
    b.rev++;
    await ecrireBibliotheque(b);
  }
  return b;
}

const texte = (v: unknown, max = 20000) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const textes = (v: unknown) => (Array.isArray(v) ? v.map((x) => texte(x, 300)).filter((x): x is string => Boolean(x && x.trim())) : []);

/** Ne garde que les champs connus, avec les bons types. */
function nettoyer(f: any, ancienne?: Fiche): Fiche {
  const maintenant = new Date().toISOString();
  return {
    id: String(f.id),
    type: TYPES.includes(f.type) ? f.type : 'livre',
    titre: (texte(f.titre, 500) ?? '').trim() || 'Sans titre',
    sousTitre: texte(f.sousTitre, 300) || undefined,
    auteurs: textes(f.auteurs),
    annee: texte(f.annee, 20),
    editeur: texte(f.editeur, 300),
    source: texte(f.source, 2000),
    images: (Array.isArray(f.images) ? f.images : [])
      .filter((i: any) => i && typeof i.id === 'string')
      .map((i: any) => ({ id: i.id, w: Number(i.w) || 1, h: Number(i.h) || 1, credit: texte(i.credit, 300) || undefined })),
    credit: texte(f.credit, 500),
    categories: [...new Set(textes(f.categories))],
    favori: f.favori === true || undefined,
    citeDans: textes(f.citeDans),
    resume: texte(f.resume),
    motsCles: [...new Set(textes(f.motsCles))],
    retenu: texte(f.retenu),
    lienTravail: texte(f.lienTravail),
    citations: (Array.isArray(f.citations) ? f.citations : [])
      .filter((c: any) => c && typeof c.texte === 'string' && c.texte.trim())
      .map((c: any) => ({ texte: texte(c.texte)!, page: texte(c.page, 40), note: texte(c.note, 2000) })),
    liens: (Array.isArray(f.liens) ? f.liens : [])
      .filter((l: any) => l && typeof l.url === 'string' && /^https?:\/\//i.test(l.url.trim()))
      .slice(0, 50)
      .map((l: any) => ({ titre: texte(l.titre, 300) ?? '', url: texte(l.url, 2000)!.trim() })),
    voirAussi: (Array.isArray(f.voirAussi) ? f.voirAussi : [])
      .filter((l: any) => l && typeof l.id === 'string' && l.id !== f.id)
      .map((l: any) => ({ id: l.id, note: texte(l.note, 500) })),
    statut: STATUTS.includes(f.statut) ? f.statut : 'a-lire',
    emplacement: texte(f.emplacement, 300),
    isbn: texte(f.isbn, 20),
    numero: texte(f.numero, 40),
    pages: texte(f.pages, 40),
    consulte: texte(f.consulte, 20),
    couvertureCherchee: f.couvertureCherchee === true || undefined,
    imageCherchee: f.imageCherchee === true || undefined,
    creeLe: ancienne?.creeLe ?? texte(f.creeLe, 40) ?? maintenant,
    modifieLe: maintenant,
  };
}

const imagesUtilisees = (b: Bibliotheque) => new Set(b.fiches.flatMap((f) => f.images.map((i) => i.id)));

async function nettoyerImages(avant: Image[], b: Bibliotheque) {
  const utilisees = imagesUtilisees(b);
  await Promise.all(avant.filter((i) => !utilisees.has(i.id)).map((i) => supprimerImage(i.id).catch(() => {})));
}

async function enregistrerDistante(url: string): Promise<Image | null> {
  const img = await telechargerImage(url);
  if (!img) return null;
  const id = randomUUID();
  await ecrireImage(id, img.data, img.type);
  return { id, w: img.w, h: img.h };
}

/** Renomme ou supprime un mot-clé dans toutes les fiches. */
function appliquerMotCle(b: Bibliotheque, de: string, vers: string | null) {
  for (const f of b.fiches) {
    if (!f.motsCles.includes(de)) continue;
    const reste = f.motsCles.filter((m) => m !== de);
    f.motsCles = vers && !reste.includes(vers) ? [...reste, vers] : reste;
  }
}

export async function gerer(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const morceaux = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [route, param] = morceaux;
  const m = req.method;

  try {
    if (route === 'etat') return json({ configure: motDePasseConfigure(), connecte: estConnecte(req) });

    if (route === 'connexion' && m === 'POST') {
      if (!motDePasseConfigure()) return erreur('Le mot de passe n’est pas encore défini dans Netlify (variable MOT_DE_PASSE).', 503);
      const corps = await req.json().catch(() => ({}));
      if (!verifierMotDePasse(String(corps.motDePasse ?? ''))) {
        await new Promise((r) => setTimeout(r, 800));
        return erreur('Mot de passe incorrect.', 401);
      }
      return json({ ok: true }, 200, { 'set-cookie': cookieSession() });
    }

    if (route === 'deconnexion') return json({ ok: true }, 200, { 'set-cookie': cookieFin() });

    if (!estConnecte(req)) return erreur('Connexion nécessaire.', 401);

    if (route === 'bibliotheque' && m === 'GET') return json(await charger());

    if (route === 'fiches' && m === 'PUT' && param) {
      const b = await charger();
      const corps = await req.json();
      const i = b.fiches.findIndex((f) => f.id === param);
      const ancienne = i >= 0 ? b.fiches[i] : undefined;
      const fiche = nettoyer({ ...corps, id: param }, ancienne);
      if (i >= 0) b.fiches[i] = fiche;
      else b.fiches.push(fiche);
      b.rev++;
      await ecrireBibliotheque(b);
      if (ancienne) await nettoyerImages(ancienne.images, b);
      return json({ fiche, rev: b.rev });
    }

    if (route === 'fiches' && m === 'POST') {
      // import groupé (favoris)
      const b = await charger();
      const corps = await req.json();
      const nouvelles = (Array.isArray(corps) ? corps : []).map((f: any) => nettoyer({ ...f, id: f.id || randomUUID() }));
      b.fiches.push(...nouvelles);
      b.rev++;
      await ecrireBibliotheque(b);
      return json({ fiches: nouvelles, rev: b.rev });
    }

    if (route === 'fiches' && m === 'DELETE' && param) {
      const b = await charger();
      const ancienne = b.fiches.find((f) => f.id === param);
      if (!ancienne) return erreur('Fiche introuvable.', 404);
      b.fiches = b.fiches.filter((f) => f.id !== param);
      for (const f of b.fiches) f.voirAussi = f.voirAussi.filter((l) => l.id !== param);
      b.rev++;
      await ecrireBibliotheque(b);
      await nettoyerImages(ancienne.images, b);
      return json({ rev: b.rev });
    }

    if (route === 'vocabulaire' && m === 'PUT') {
      const b = await charger();
      const corps = await req.json();
      if (Array.isArray(corps.familles)) {
        b.familles = (corps.familles as Famille[]).map((f) => ({
          id: String(f.id),
          nom: String(f.nom),
          groupes: (f.groupes ?? []).map((g) => ({ nom: String(g.nom), mots: [...new Set(textes(g.mots))] })),
        }));
      }
      if (Array.isArray(corps.categories)) {
        b.categories = (corps.categories as Categorie[])
          .filter((c) => c && c.id && String(c.nom ?? '').trim())
          .map((c) => ({ id: String(c.id).slice(0, 80), nom: String(c.nom).trim().slice(0, 80) }));
        // une catégorie supprimée disparaît aussi des fiches
        const ids = new Set(b.categories.map((c) => c.id));
        for (const f of b.fiches) f.categories = (f.categories ?? []).filter((c) => ids.has(c));
      }
      if (Array.isArray(corps.synonymes)) {
        b.synonymes = corps.synonymes.map(textes).filter((l: string[]) => l.length > 1);
      }
      if (corps.renommer?.de) appliquerMotCle(b, String(corps.renommer.de), corps.renommer.vers ? String(corps.renommer.vers) : null);
      b.rev++;
      await ecrireBibliotheque(b);
      return json(b);
    }

    if (route === 'images' && m === 'POST') {
      const data = await req.arrayBuffer();
      const type = typeImage(data);
      const dim = dimensions(data);
      if (!type || !dim) return erreur('Format d’image non reconnu.', 400);
      if (data.byteLength > 5_000_000) return erreur('Image trop lourde.', 413);
      const id = randomUUID();
      await ecrireImage(id, data, type);
      return json({ id, ...dim });
    }

    if (route === 'images' && m === 'GET' && param) {
      const img = await lireImage(param);
      if (!img) return new Response('Introuvable', { status: 404 });
      return new Response(img.data, { headers: { 'content-type': img.type, 'cache-control': 'private, max-age=31536000, immutable' } });
    }

    if (route === 'isbn' && param) {
      const notice = await chercherIsbn(param);
      if (!notice) return erreur('Aucune notice trouvée pour cet ISBN.', 404);
      let image: Image | null = null;
      for (const c of notice.couvertures) {
        image = await enregistrerDistante(c);
        if (image) break;
      }
      const { couvertures: _, ...reste } = notice;
      return json({ ...reste, image });
    }

    if (route === 'image-distante' && m === 'POST') {
      // image trouvée sur Internet : le serveur la télécharge et la garde
      const corps = await req.json().catch(() => ({}));
      const image = await enregistrerDistante(String(corps.url ?? ''));
      if (!image) return erreur('Image introuvable à cette adresse (il faut l’adresse de l’image elle-même).', 404);
      return json(image);
    }

    if (route === 'apercu') {
      const cible = url.searchParams.get('url') ?? '';
      const apercu = await chercherApercu(cible);
      if (!apercu) return erreur('Page inaccessible.', 404);
      const image = apercu.image ? await enregistrerDistante(apercu.image) : null;
      return json({ titre: apercu.titre, site: apercu.site, annee: apercu.annee, image });
    }

    return erreur('Adresse inconnue.', 404);
  } catch (e) {
    console.error(e);
    return erreur('Erreur du serveur.', 500);
  }
}
