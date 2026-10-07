import type { Fiche, Statut, TypeFiche } from '../types';

export const NOM_TYPE: Record<TypeFiche, string> = {
  livre: 'Livre', article: 'Article', projet: 'Projet', site: 'Site web', video: 'Vidéo',
};

export const NOM_TYPE_PLURIEL: Record<TypeFiche, string> = {
  livre: 'Livres', article: 'Articles', projet: 'Projets', site: 'Sites', video: 'Vidéos',
};

/** Un livre se lit, un projet ou une vidéo se voit. */
const SE_LIT = (t: TypeFiche) => t === 'livre' || t === 'article';

export function nomStatut(s: Statut, t?: TypeFiche): string {
  const lit = t ? SE_LIT(t) : true;
  if (s === 'en-cours') return 'En cours';
  if (s === 'lu') return t ? (lit ? 'Lu' : 'Vu') : 'Lu / vu';
  return t ? (lit ? 'À lire' : 'À voir') : 'À lire / à voir';
}

/** Libellé du champ « éditeur » selon le type. */
export const NOM_EDITEUR: Record<TypeFiche, string> = {
  livre: 'Éditeur', article: 'Revue', projet: 'Lieu', site: 'Site', video: 'Chaîne ou plateforme',
};

export const NOM_AUTEUR: Record<TypeFiche, string> = {
  livre: 'Auteur', article: 'Auteur', projet: 'Architecte', site: 'Auteur', video: 'Réalisation',
};

export function ligneMeta(f: Fiche): string {
  return [f.auteurs.join(', '), f.editeur, f.annee].filter(Boolean).join(' · ');
}

export const domaine = (url?: string) => {
  try { return url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch { return ''; }
};
