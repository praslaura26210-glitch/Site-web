import { dict, type Lang } from '@/i18n';
import { getCV } from '@/lib/content';
import { meta } from '@/lib/seo';
import { tr } from '@/components/project/Shell';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return { ...meta(lang, '/mentions-legales/', `${t.meta.mentionsTitle} · Laura Pras`, t.meta.mentionsTitle), robots: { index: false } };
}

// Hébergeur : à vérifier sur netlify.com au moment de la mise en ligne (adresse relevée dans des sources secondaires).
const HEBERGEUR = 'Netlify, Inc., 2325 3rd Street, Suite 296, San Francisco, CA 94107, États-Unis · www.netlify.com';

export default async function Mentions({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  const L = tr(lang, {
    fr: { edit: 'Édition', editT: `Site personnel édité par Laura Pras, étudiante. Contact : ${cv.email}.`, heb: 'Hébergement', droits: 'Droits', droitsT: "Les textes, dessins, plans, photographies et maquettes présentés sont l'œuvre de Laura Pras, sauf mention contraire, et ne peuvent être reproduits sans son accord. Les projets d'école ont été réalisés dans le cadre des studios de l'ENSA Grenoble cités sur chaque page ; Pilates Room est un projet de l'agence MTG Intérieur, présenté avec son accord.", donnees: 'Données personnelles', donneesT: "Ce site ne dépose aucun cookie de suivi et ne collecte aucune donnée. Seules deux préférences techniques sont gardées dans votre navigateur (intro déjà vue, vue liste ou terrain), sans être transmises.", polices: 'Polices', policesT: 'EB Garamond et Montserrat, sous licence SIL Open Font License.' },
    en: { edit: 'Publisher', editT: `Personal website published by Laura Pras, student. Contact: ${cv.email}.`, heb: 'Hosting', droits: 'Rights', droitsT: 'The texts, drawings, plans, photographs and models shown are the work of Laura Pras unless stated otherwise and may not be reproduced without her consent. School projects were produced in the ENSA Grenoble design studios named on each page; Pilates Room is a project by MTG Intérieur, shown with its consent.', donnees: 'Personal data', donneesT: 'This site sets no tracking cookies and collects no data. Only two technical preferences are kept in your browser (intro already seen, list or terrain view), and they are never sent anywhere.', polices: 'Typefaces', policesT: 'EB Garamond and Montserrat, under the SIL Open Font License.' },
    it: { edit: 'Editore', editT: `Sito personale pubblicato da Laura Pras, studentessa. Contatto: ${cv.email}.`, heb: 'Hosting', droits: 'Diritti', droitsT: "I testi, i disegni, le piante, le fotografie e i plastici presentati sono opera di Laura Pras, salvo indicazione contraria, e non possono essere riprodotti senza il suo consenso. I progetti scolastici sono stati realizzati nei laboratori dell'ENSA di Grenoble indicati in ogni pagina; Pilates Room è un progetto dello studio MTG Intérieur, presentato con il suo consenso.", donnees: 'Dati personali', donneesT: 'Questo sito non utilizza cookie di tracciamento e non raccoglie dati. Nel browser restano solo due preferenze tecniche (intro già vista, vista elenco o terreno), mai trasmesse.', polices: 'Caratteri', policesT: 'EB Garamond e Montserrat, con licenza SIL Open Font License.' },
  });
  return (
    <article className={`wrap ${styles.page}`}>
      <h1 className={styles.h1}>{t.meta.mentionsTitle}</h1>
      <dl className={styles.legal}>
        <dt>{L.edit}</dt><dd>{L.editT}</dd>
        <dt>{L.heb}</dt><dd>{HEBERGEUR}</dd>
        <dt>{L.droits}</dt><dd>{L.droitsT}</dd>
        <dt>{L.donnees}</dt><dd>{L.donneesT}</dd>
        <dt>{L.polices}</dt><dd>{L.policesT}</dd>
      </dl>
    </article>
  );
}
