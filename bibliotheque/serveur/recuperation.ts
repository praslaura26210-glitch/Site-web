import { dimensions, typeImage } from './dimensions';

/** Notices de livres (Open Library, Google Books, BnF) et aperçus de pages web. */

export interface Notice {
  titre?: string;
  auteurs?: string[];
  annee?: string;
  editeur?: string;
  pages?: string;
  /** Page en ligne du livre (Google Books, Open Library). */
  lien?: string;
  couvertures: string[];
}

const UA = 'Mozilla/5.0 (Bibliotheque personnelle; +https://netlify.app)';

async function lire(url: string, ms = 7000): Promise<Response | null> {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, signal: AbortSignal.timeout(ms), redirect: 'follow' });
    return r.ok ? r : null;
  } catch {
    return null;
  }
}

const annee = (s?: string) => s?.match(/\b(1[5-9]\d\d|20\d\d)\b/)?.[1];

/** ISBN-13 (978…) → ISBN-10, qui sert d'identifiant de produit chez Amazon. */
export function versIsbn10(isbn: string): string | null {
  if (isbn.length === 10) return isbn;
  if (isbn.length !== 13 || !isbn.startsWith('978')) return null;
  const corps = isbn.slice(3, 12);
  const somme = [...corps].reduce((s, c, i) => s + Number(c) * (10 - i), 0);
  const cle = (11 - (somme % 11)) % 11;
  return corps + (cle === 10 ? 'X' : String(cle));
}

export function nettoyerIsbn(s: string): string {
  return s.toUpperCase().replace(/[^0-9X]/g, '');
}

export function lireOpenLibrary(json: any, isbn: string): Notice | null {
  const d = json?.[`ISBN:${isbn}`];
  if (!d) return null;
  return {
    titre: [d.title, d.subtitle].filter(Boolean).join(' : ') || undefined,
    auteurs: d.authors?.map((a: any) => a.name).filter(Boolean),
    annee: annee(d.publish_date),
    editeur: d.publishers?.[0]?.name,
    pages: d.number_of_pages ? String(d.number_of_pages) : undefined,
    lien: d.url,
    couvertures: [d.cover?.large, d.cover?.medium].filter(Boolean),
  };
}

export function lireGoogleBooks(json: any): Notice | null {
  const v = json?.items?.[0]?.volumeInfo;
  if (!v) return null;
  const vignette = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
  return {
    titre: [v.title, v.subtitle].filter(Boolean).join(' : ') || undefined,
    auteurs: v.authors,
    annee: annee(v.publishedDate),
    editeur: v.publisher,
    pages: v.pageCount ? String(v.pageCount) : undefined,
    lien: v.infoLink ? String(v.infoLink).replace(/^http:/, 'https:') : undefined,
    couvertures: vignette ? [String(vignette).replace(/^http:/, 'https:').replace('&edge=curl', '')] : [],
  };
}

const decoder = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');

/** BnF, format Dublin Core : « Titre : sous-titre / Auteur », « Nom, Prénom (1943-....). Auteur du texte ». */
export function lireBnf(xml: string): Notice | null {
  const champ = (nom: string) => [...xml.matchAll(new RegExp(`<dc:${nom}[^>]*>([\\s\\S]*?)</dc:${nom}>`, 'g'))].map((m) => decoder(m[1]).trim());
  const titres = champ('title');
  if (!titres.length) return null;
  const auteurs = champ('creator').map((c) => {
    const nom = c.replace(/\s*\(.*$/, '').replace(/\.\s*Auteur.*$/, '').trim();
    const [famille, prenom] = nom.split(/,\s*/);
    return prenom ? `${prenom} ${famille}` : famille;
  });
  const editeur = champ('publisher')[0]?.replace(/\s*\(.*\)\s*$/, '');
  return {
    titre: titres[0].split(' / ')[0].replace(/\s+:\s+/, ' : ').trim(),
    auteurs: auteurs.length ? auteurs : undefined,
    annee: annee(champ('date')[0]),
    editeur,
    couvertures: [],
  };
}

export async function chercherIsbn(isbnBrut: string): Promise<Notice | null> {
  const isbn = nettoyerIsbn(isbnBrut);
  if (isbn.length !== 10 && isbn.length !== 13) return null;
  const [ol, gb, bnf] = await Promise.all([
    lire(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`).then((r) => r?.json().catch(() => null)),
    lire(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`).then((r) => r?.json().catch(() => null)),
    lire(`https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=${encodeURIComponent(`bib.isbn adj "${isbn}"`)}&recordSchema=dublincore&maximumRecords=1`).then((r) => r?.text().catch(() => null)),
  ]);
  const notices = [lireOpenLibrary(ol, isbn), lireGoogleBooks(gb), bnf ? lireBnf(bnf) : null].filter((n): n is Notice => Boolean(n));
  if (!notices.length) return null;
  // le premier service qui répond l'emporte, champ par champ
  const fusion: Notice = { couvertures: [] };
  for (const n of notices) {
    fusion.titre ??= n.titre;
    fusion.auteurs ??= n.auteurs?.length ? n.auteurs : undefined;
    fusion.annee ??= n.annee;
    fusion.editeur ??= n.editeur;
    fusion.pages ??= n.pages;
    fusion.lien ??= n.lien;
    fusion.couvertures.push(...n.couvertures);
  }
  // couvertures par ISBN, même sans notice : Amazon (souvent la meilleure pour les livres français), puis Open Library
  const isbn10 = versIsbn10(isbn);
  if (isbn10) fusion.couvertures.unshift(`https://m.media-amazon.com/images/P/${isbn10}.01._SCLZZZZZZZ_.jpg`);
  fusion.couvertures.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`);
  return fusion;
}

/** Télécharge une image distante ; refuse les fichiers trop petits (pixels « pas de couverture ») ou trop lourds. */
export async function telechargerImage(url: string): Promise<{ data: ArrayBuffer; type: string; w: number; h: number } | null> {
  if (!/^https?:\/\//.test(url)) return null;
  const r = await lire(url, 8000);
  if (!r) return null;
  const data = await r.arrayBuffer();
  if (data.byteLength > 4_000_000) return null;
  const type = typeImage(data);
  const dim = dimensions(data);
  if (!type || !dim || dim.w < 40 || dim.h < 40) return null;
  return { data, type, ...dim };
}

export interface Apercu {
  titre?: string;
  site?: string;
  annee?: string;
  image?: string;
}

/** Lit les balises Open Graph d'une page web. */
export function lireApercu(html: string, base: string): Apercu {
  const meta = (nom: string) => {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${nom}["'][^>]*content=["']([^"']*)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${nom}["']`, 'i');
    const m = html.match(re1) ?? html.match(re2);
    return m ? decoder(m[1]).trim() : undefined;
  };
  const titre = meta('og:title') ?? meta('twitter:title') ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  let image = meta('og:image') ?? meta('og:image:url') ?? meta('twitter:image');
  if (image) {
    try { image = new URL(image, base).href; } catch { image = undefined; }
  }
  return {
    titre: titre ? decoder(titre) : undefined,
    site: meta('og:site_name'),
    annee: annee(meta('article:published_time') ?? meta('og:published_time') ?? meta('datePublished')),
    image,
  };
}

export async function chercherApercu(url: string): Promise<Apercu | null> {
  if (!/^https?:\/\//.test(url)) return null;
  const r = await lire(url, 8000);
  if (!r || !(r.headers.get('content-type') ?? '').includes('html')) return null;
  const html = (await r.text()).slice(0, 600_000);
  return lireApercu(html, r.url || url);
}
