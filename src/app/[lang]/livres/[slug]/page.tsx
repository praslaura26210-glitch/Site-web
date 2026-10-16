import { notFound } from 'next/navigation';
import { LANGS, type Lang } from '@/i18n';
import { ORDRE } from '@/lib/content';
import LivreProjet, { livreMeta } from '@/components/home/LivreProjet';

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.flatMap((lang) => ORDRE.map((slug) => ({ lang, slug })));
}

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  return livreMeta(lang, slug);
}

/** Le livre d'un projet, qu'on feuillette (components/home/LivreProjet.tsx). */
export default async function Page({ params }: Params) {
  const { lang, slug } = (await params) as { lang: Lang; slug: string };
  if (!(ORDRE as readonly string[]).includes(slug)) notFound();
  return <LivreProjet lang={lang} slug={slug} />;
}
