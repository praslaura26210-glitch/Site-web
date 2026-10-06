import type { Lang } from '@/i18n';

/** Choisit la version d'un texte selon la langue (repli sur le français). */
export function tr<T>(lang: Lang, v: { fr: T; en: T; it: T }): T {
  return v[lang] ?? v.fr;
}
