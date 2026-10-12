// Les projets qui animent Laura (content/site/inspirations.json : elle choisit ceux qu'on voit dans « visibles »).
import fs from 'node:fs';
import path from 'node:path';
import type { Lang } from '@/i18n';
import { tr } from './tr';

export type Reference = { id: string; theme: string; titre: string; auteur: string; lieu: string; annee: string; credit: string; info?: string; texte?: string; w: number; h: number };

export function getReferences(lang: Lang): Reference[] {
  const R = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site/inspirations.json'), 'utf8'));
  const visite = tr(lang, { fr: "Vu lors des visites de l'ENSA Grenoble", en: 'Seen on ENSA Grenoble study visits', it: "Visto durante le visite dell'ENSA di Grenoble" });
  return (R.visibles as string[]).map((id) => R.items.find((x: { id: string }) => x.id === id)).filter(Boolean).map((x: Record<string, string> & { w: number; h: number }) => ({
    id: x.id, theme: x.theme, titre: x.titre, auteur: x.auteur, lieu: x.lieu, annee: x.annee, credit: x.credit, w: x.w, h: x.h,
    info: !x.auteur ? visite : undefined, texte: x[lang] || x.fr,
  }));
}
