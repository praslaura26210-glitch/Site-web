import type { Fiche, Statut, TypeFiche } from '../types';

export const NOM_TYPE: Record<TypeFiche, string> = {
  livre: 'Livre', article: 'Article', projet: 'Projet', site: 'Site web', video: 'Vidéo', podcast: 'Podcast', exposition: 'Exposition', memoire: 'Mémoire',
};

export const NOM_TYPE_PLURIEL: Record<TypeFiche, string> = {
  livre: 'Livres', article: 'Articles', projet: 'Projets', site: 'Sites', video: 'Vidéos', podcast: 'Podcasts', exposition: 'Expositions', memoire: 'Mémoires et thèses',
};

/** Un livre se lit, un projet ou une vidéo se voit. */
const SE_LIT = (t: TypeFiche) => t === 'livre' || t === 'article' || t === 'memoire';
/** Un podcast s'écoute. */
const S_ECOUTE = (t: TypeFiche) => t === 'podcast';

export function nomStatut(s: Statut, t?: TypeFiche): string {
  const lit = t ? SE_LIT(t) : true;
  if (s === 'en-cours') return 'En cours';
  if (t && S_ECOUTE(t)) return s === 'lu' ? 'Écouté' : 'À écouter';
  if (s === 'lu') return t ? (lit ? 'Lu' : 'Vu') : 'Lu / vu';
  return t ? (lit ? 'À lire' : 'À voir') : 'À lire / à voir';
}

/** Libellé du champ « éditeur » selon le type. */
export const NOM_EDITEUR: Record<TypeFiche, string> = {
  livre: 'Éditeur', article: 'Source', projet: 'Lieu', site: 'Site', video: 'Chaîne ou plateforme', podcast: 'Émission', exposition: 'Lieu', memoire: 'Université',
};

export const NOM_AUTEUR: Record<TypeFiche, string> = {
  livre: 'Auteur', article: 'Auteur', projet: 'Architecte', site: 'Auteur', video: 'Réalisation', podcast: 'Invité·e', exposition: 'Auteur·rice', memoire: 'Auteur',
};

export function ligneMeta(f: Fiche): string {
  return [f.auteurs.join(', '), f.editeur, f.annee].filter(Boolean).join(' · ');
}

export const domaine = (url?: string) => {
  try { return url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch { return ''; }
};
