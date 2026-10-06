import fs from 'node:fs';
import path from 'node:path';
import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import Inspirations from '@/components/pages/Inspirations';
import styles from '@/components/pages/pages.module.css';

const data = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site/inspirations.json'), 'utf8'));

const L = (lang: Lang) => tr(lang, {
  fr: { intro: 'Des projets qui ont du sens pour moi.', fermer: 'Fermer', ouvrir: 'Voir la fiche', auteur: 'Conception', lieu: 'Lieu', annee: 'Année', visite: "Vu lors des visites de l'ENSA Grenoble" },
  en: { intro: 'Projects that mean something to me.', fermer: 'Close', ouvrir: 'Open', auteur: 'Design', lieu: 'Place', annee: 'Year', visite: 'Seen on ENSA Grenoble study visits' },
  it: { intro: 'Progetti che hanno un senso per me.', fermer: 'Chiudi', ouvrir: 'Apri la scheda', auteur: 'Progetto', lieu: 'Luogo', annee: 'Anno', visite: "Visto durante le visite dell'ENSA di Grenoble" },
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/references/', `${t.meta.referencesTitle} · Laura Pras`, L(lang).intro);
}

/** Références : quelques photos de projets ; un clic ouvre la fiche (qui l'a conçu, où, quand). */
export default async function References({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const l = L(lang);
  const d = data();
  const items = (d.visibles as string[]).map((id) => d.items.find((x: any) => x.id === id)).filter(Boolean).map((x: any) => ({
    id: x.id, titre: x.titre, auteur: x.auteur, lieu: x.lieu, annee: x.annee, credit: x.credit, w: x.w, h: x.h,
    info: !x.auteur ? l.visite : undefined,
  }));
  return (
    <article className={`wrap ${styles.page}`}>
      <header className={styles.refHead}>
        <h1 className={styles.h1}>{t.meta.referencesTitle}</h1>
        <p className={styles.refIntro}>{l.intro}</p>
      </header>
      <Inspirations items={items} labels={{ fermer: l.fermer, ouvrir: l.ouvrir, auteur: l.auteur, lieu: l.lieu, annee: l.annee }} />
    </article>
  );
}
