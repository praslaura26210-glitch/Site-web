import { dict, type Lang } from '@/i18n';
import { getCV } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/lib/tr';
import CopyEmail from '@/components/pages/CopyEmail';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/contact/', `${t.meta.contactTitle} · Laura Pras`, t.home.approach);
}

export default async function Contact({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const cv = getCV();
  const L = tr(lang, {
    fr: { titre: 'Écrivez-moi', texte: "Pour une rencontre, une question sur un projet ou un échange autour de la matière et de l'existant : un e-mail suffit.", copy: "Copier l'adresse", copied: 'Adresse copiée', lieu: 'Grenoble · Épinouze (Drôme)', pdf: 'Avant de partir : le portfolio complet', pdfT: '63 pages, tous les projets, plans et textes.' },
    en: { titre: 'Write to me', texte: 'For a meeting, a question about a project or a conversation about material and existing buildings, an email is all it takes.', copy: 'Copy the address', copied: 'Address copied', lieu: 'Grenoble · Épinouze (Drôme, France)', pdf: 'Before you go: the full portfolio', pdfT: '63 pages, every project, drawings and texts.' },
    it: { titre: 'Scrivetemi', texte: "Per un incontro, una domanda su un progetto o uno scambio sulla materia e sull'esistente, basta una e-mail.", copy: "Copia l'indirizzo", copied: 'Indirizzo copiato', lieu: 'Grenoble · Épinouze (Drôme, Francia)', pdf: 'Prima di andare: il portfolio completo', pdfT: '63 pagine, tutti i progetti, disegni e testi.' },
  });
  const liens = [
    { label: 'LinkedIn', url: cv.linkedin },
    { label: 'Instagram', url: cv.instagram },
  ].filter((l) => l.url && !String(l.url).startsWith('['));
  return (
    <article className={`wrap ${styles.page} ${styles.contact}`}>
      <h1 className={styles.h1}>{L.titre}</h1>
      <p className={styles.headLead}>{L.texte}</p>
      <CopyEmail email={cv.email} labels={{ copy: L.copy, copied: L.copied }} />
      <p className={styles.lieu}>{L.lieu}</p>
      {liens.length > 0 && (
        <ul className={styles.social}>
          {liens.map((l) => <li key={l.label}><a href={l.url} rel="me noopener" target="_blank">{l.label} ↗</a></li>)}
        </ul>
      )}
    </article>
  );
}
