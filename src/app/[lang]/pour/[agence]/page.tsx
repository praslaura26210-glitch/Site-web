import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LANGS, dict, type Lang } from '@/i18n';
import { getProjets } from '@/lib/content';
import { meta } from '@/lib/seo';
import ProjetsGrille from '@/components/home/ProjetsGrille';
import Portfolio from '@/components/home/Portfolio';
import styles from '@/components/pages/pages.module.css';

/**
 * Page « Pour une agence » : une adresse privée par agence (…/fr/pour/atelier-x/), avec un mot écrit pour elle
 * et les projets dans l'ordre qui la concerne. Jamais indexée, jamais liée depuis le site.
 * Les agences se déclarent dans content/site/agences.json.
 */
type Agence = { slug: string; nom: string; exemple?: boolean; mot: Partial<Record<Lang, string>>; ordre?: string[] };
const agences = (): Agence[] => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site/agences.json'), 'utf8')).agences;

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.flatMap((lang) => agences().map((a) => ({ lang, agence: a.slug })));
}

type Params = { params: Promise<{ lang: string; agence: string }> };

export async function generateMetadata({ params }: Params) {
  const { lang, agence } = (await params) as { lang: Lang; agence: string };
  const a = agences().find((x) => x.slug === agence);
  const t = dict(lang);
  return { ...meta(lang, `/pour/${agence}/`, `Laura Pras · ${t.xp.pour} ${a?.nom || ''}`, t.meta.siteDescription), robots: { index: false, follow: false }, alternates: undefined };
}

export default async function Pour({ params }: Params) {
  const { lang, agence } = (await params) as { lang: Lang; agence: string };
  const a = agences().find((x) => x.slug === agence);
  if (!a) notFound();
  const t = dict(lang);
  const tous = getProjets(lang);
  const ordre = a.ordre || [];
  const projets = [...ordre.map((s) => tous.find((p) => p.slug === s)).filter((p): p is (typeof tous)[number] => !!p), ...tous.filter((p) => !ordre.includes(p.slug))];
  const mot = a.mot[lang] || a.mot.fr;
  return (
    <div className={`wrap ${styles.page} xp-pour`}>
      {a.exemple && <p className="xp-pour-exemple">{t.xp.pourExemple}</p>}
      <header className="xp-pour-tete">
        <p className="eyebrow">{t.xp.pourIntro} <strong>{a.nom}</strong></p>
        <h1 className={styles.h1}>Laura Pras</h1>
        <p className="eyebrow">{t.home.statut}</p>
        {mot && <p className="xp-pour-mot">{mot}</p>}
        <p className="xp-pour-liens">
          <Link href={`/${lang}/contact/`} className="lien">{t.xp.pourEcrire}</Link>
          <Link href={`/${lang}/accrochage/`} className="lien">{t.xp.accrochageLien}</Link>
          <Portfolio t={t} />
        </p>
      </header>
      <ProjetsGrille projets={projets} lang={lang} headingLevel={2} />
    </div>
  );
}
