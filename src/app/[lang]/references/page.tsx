import fs from 'node:fs';
import path from 'node:path';
import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import Inspirations from '@/components/pages/Inspirations';
import styles from '@/components/pages/pages.module.css';

const data = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site/inspirations.json'), 'utf8'));

const L = (lang: Lang) => tr(lang, {
  fr: { intro: "Des lieux qui ont nourri mon rapport d'études, « L'architecture comme expérience sensible » : la lumière, la matière, le site, ce qui existe déjà. Cliquez sur une image pour en savoir plus.", tout: 'Tout', fermer: 'Fermer', ouvrir: 'Voir la fiche', themes: { lumiere: 'Lumière', matiere: 'Matière', site: 'Site', existant: 'Existant', carnet: 'Carnet' } },
  en: { intro: 'Places that fed my study report, “Architecture as a sensory experience”: light, material, site, what already exists. Click an image to find out more.', tout: 'All', fermer: 'Close', ouvrir: 'Open', themes: { lumiere: 'Light', matiere: 'Material', site: 'Site', existant: 'Existing', carnet: 'Notebook' } },
  it: { intro: "Luoghi che hanno nutrito la mia tesina, «L'architettura come esperienza sensibile»: la luce, la materia, il sito, ciò che esiste già. Cliccate su un'immagine per saperne di più.", tout: 'Tutto', fermer: 'Chiudi', ouvrir: 'Apri la scheda', themes: { lumiere: 'Luce', matiere: 'Materia', site: 'Sito', existant: 'Esistente', carnet: 'Taccuino' } },
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/references/', `${t.meta.referencesTitle} · Laura Pras`, L(lang).intro);
}

/** Références : mosaïque de photos tirées du rapport d'études ; un clic ouvre la fiche. */
export default async function References({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const l = L(lang);
  const items = data().items.map((x: any) => ({ id: x.id, theme: x.theme, titre: x.titre, auteur: x.auteur, lieu: x.lieu, annee: x.annee, credit: x.credit, texte: x[lang], w: x.w, h: x.h }));
  const themes = Object.entries(l.themes).map(([id, label]) => ({ id, label }));
  return (
    <article className={`wrap ${styles.page}`}>
      <header className={styles.head}>
        <h1 className={styles.h1}>{t.meta.referencesTitle}</h1>
        <p className={styles.headLead}>{l.intro}</p>
      </header>
      <Inspirations items={items} themes={themes} labels={{ tout: l.tout, fermer: l.fermer, ouvrir: l.ouvrir }} />
    </article>
  );
}
