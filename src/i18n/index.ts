import fr from './fr.json';
import en from './en.json';
import it from './it.json';

export const LANGS = ['fr', 'en', 'it'] as const;
export type Lang = (typeof LANGS)[number];
export type Dict = typeof fr;

const DICTS: Record<Lang, Dict> = { fr, en: en as Dict, it: it as Dict };

export function isLang(l: string): l is Lang {
  return (LANGS as readonly string[]).includes(l);
}

export function dict(lang: string): Dict {
  return DICTS[isLang(lang) ? lang : 'fr'];
}
