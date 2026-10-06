import { dict, type Lang } from '@/i18n';
import { getCV } from '@/lib/content';
import { meta } from '@/lib/seo';
import { IcoEmail, IcoInstagram, IcoLinkedin, IcoTel } from '@/components/pages/Icones';
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
  const reseaux = [
    { label: 'LinkedIn', url: cv.linkedin, Ico: IcoLinkedin },
    { label: 'Instagram', url: cv.instagram, Ico: IcoInstagram },
  ].filter((l) => l.url && !String(l.url).startsWith('['));
  return (
    <article className={`wrap ${styles.page} ${styles.contact}`}>
      <div className={styles.cWrap}>
        <h1 className="eyebrow">{t.meta.contactTitle}</h1>
        <p className={styles.cTitre}>{C.titre}</p>

        <form className={styles.form} name="contact" method="POST" action={`/${lang}/contact/merci/`} data-netlify="true" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="contact" />
          <input type="hidden" name="langue" value={lang} />
          <p hidden><label>Ne pas remplir <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
          <label className={styles.champ}>
            <span>{C.nom}</span>
            <input name="nom" type="text" autoComplete="name" required />
          </label>
          <label className={styles.champ}>
            <span>{C.email}</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className={`${styles.champ} ${styles.champLarge}`}>
            <span>{C.message}</span>
            <textarea name="message" rows={5} required />
          </label>
          <button type="submit" className={styles.envoyer}>
            {C.envoyer}
            <svg viewBox="0 0 24 12" width="24" height="12" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
          </button>
        </form>

        <div className={styles.cBas}>
          <ul className={styles.icones}>
            <li><a href={`mailto:${cv.email}`} aria-label={`${C.ecrire} : ${cv.email}`} title={C.ecrire}><IcoEmail /></a></li>
            <li><a href={`tel:${telHref}`} aria-label={`${C.tel} : ${tel}`} title={C.tel}><IcoTel /></a></li>
            {reseaux.map(({ label, url, Ico }) => (
              <li key={label}><a href={url} target="_blank" rel="me noopener" aria-label={label} title={label}><Ico /></a></li>
            ))}
          </ul>
          <dl className={styles.coordList}>
            <div><dt>{C.email}</dt><dd><a href={`mailto:${cv.email}`}>{cv.email}</a></dd></div>
            <div><dt>{C.tel}</dt><dd><a href={`tel:${telHref}`}>{tel}</a></dd></div>
            <div><dt>{C.lieu}</dt><dd>{C.lieuV}</dd></div>
          </dl>
        </div>
      </div>
    </article>
  );
}
