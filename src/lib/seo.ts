import type { Metadata } from 'next';
import { LANGS, type Lang } from '@/i18n';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://laurapras.fr';

/** Titre, description et adresses alternatives (fr / en / it) d'une page. */
export function meta(lang: Lang, path: string, title: string, description: string, image?: string): Metadata {
  const languages = Object.fromEntries(LANGS.map((l) => [l, `/${l}${path}`]));
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: `/${lang}${path}`, languages: { ...languages, 'x-default': `/fr${path}` } },
    openGraph: { title, description, locale: { fr: 'fr_FR', en: 'en_GB', it: 'it_IT' }[lang], type: 'website', images: image ? [image] : ['/media/site/dessin-couverture-2000.webp'] },
    icons: { icon: '/favicon.svg' },
  };
}
