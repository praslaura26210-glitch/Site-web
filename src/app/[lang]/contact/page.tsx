import { dict, type Lang } from '@/i18n';
import { getCV } from '@/lib/content';
import { meta } from '@/lib/seo';
import Reseaux from '@/components/pages/Reseaux';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return meta(lang, '/contact/', `${t.meta.contactTitle} · Laura Pras`, t.contact.titre);
}

/**
 * Contact : un formulaire (Netlify Forms : les messages arrivent dans le tableau de bord Netlify
 * et sont transférés par e-mail une fois la notification activée), puis les coordonnées et les icônes.
 */
export default async function Contact({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const C = t.contact;
  const cv = getCV();
  const tel = String(cv.telephone);
  const telHref = `+33${tel.replace(/\s/g, '').replace(/^0/, '')}`;
  return (
    <article className={`wrap ${styles.page} ${styles.contact}`}>
      <header className={styles.refHead}>
        <h1 className={styles.h1}>{t.meta.contactTitle}</h1>
        <p className={styles.refIntro}>{C.titre}</p>
      </header>

      <div className={styles.cGrille}>
        <form className={styles.form} name="contact" method="POST" action={`/${lang}/contact/merci/`} data-netlify="true" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="contact" />
          <input type="hidden" name="langue" value={lang} />
          <p hidden><label>Ne pas remplir <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
          <label className={styles.champ}>
            <span>{C.nom} *</span>
            <input name="nom" type="text" autoComplete="family-name" required />
          </label>
          <label className={styles.champ}>
            <span>{C.prenom} *</span>
            <input name="prenom" type="text" autoComplete="given-name" required />
          </label>
          <label className={styles.champ}>
            <span>{C.email} *</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className={styles.champ}>
            <span>{C.telephone} <small>({C.facultatif})</small></span>
            <input name="telephone" type="tel" autoComplete="tel" />
          </label>
          <label className={`${styles.champ} ${styles.champLarge}`}>
            <span>{C.message} *</span>
            <textarea name="message" rows={7} required />
          </label>
          <button type="submit" className={styles.envoyer}>
            {C.envoyer}
            <svg viewBox="0 0 24 12" width="18" height="9" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
        </form>

        <aside className={styles.coord}>
          <p className="eyebrow">{C.coordonnees}</p>
          <dl className={styles.coordList}>
            <div><dt>{C.email}</dt><dd><a href={`mailto:${cv.email}`}>{cv.email}</a></dd></div>
            <div><dt>{C.tel}</dt><dd><a href={`tel:${telHref}`}>{tel}</a></dd></div>
            <div><dt>{C.lieu}</dt><dd>{C.lieuV}</dd></div>
          </dl>
          <Reseaux cv={cv} className={styles.icones} ecrire={C.ecrire} />
        </aside>
      </div>
    </article>
  );
}
