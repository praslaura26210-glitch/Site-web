/** Lit un export de favoris (Edge, Chrome, Firefox : format « Netscape bookmark »). */
export interface Favori {
  titre: string;
  url: string;
  dossiers: string[];
  ajoute?: string;
}

const RACINES = /^(barre de favoris|favorites bar|autres favoris|other favorites|favoris|bookmarks bar|barre personnelle|menu des marque-pages)$/i;

function nomDossier(dl: Element): string | null {
  let p = dl.previousElementSibling;
  while (p && p.tagName === 'P') p = p.previousElementSibling;
  if (p?.tagName === 'H3') return p.textContent?.trim() ?? null;
  const dt = dl.parentElement;
  if (dt?.tagName === 'DT') {
    const h3 = dt.querySelector(':scope > h3');
    if (h3) return h3.textContent?.trim() ?? null;
  }
  return null;
}

export function lireFavoris(html: string): Favori[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const vus = new Set<string>();
  const out: Favori[] = [];
  for (const a of doc.querySelectorAll('a[href]')) {
    const url = a.getAttribute('href') ?? '';
    if (!/^https?:\/\//i.test(url) || vus.has(url)) continue;
    vus.add(url);
    const dossiers: string[] = [];
    for (let el = a.parentElement; el; el = el.parentElement) {
      if (el.tagName !== 'DL') continue;
      const nom = nomDossier(el);
      if (nom && !RACINES.test(nom)) dossiers.unshift(nom);
    }
    const date = Number(a.getAttribute('add_date'));
    out.push({
      titre: a.textContent?.trim() || url,
      url,
      dossiers,
      ajoute: date ? new Date(date * 1000).toISOString() : undefined,
    });
  }
  return out;
}

export const estVideo = (url: string) => /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i.test(url);
