import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
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
  // fiche contact (vCard, écrite par scripts/sync-content.mjs) : en QR code à scanner ; sur téléphone, un toucher l'enregistre
  const vcf = fs.readFileSync(path.join(process.cwd(), 'public', 'laura-pras.vcf'), 'utf8');
  const qr = await QRCode.toString(vcf, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#2B211C', light: '#0000' } });
  return (
    <article className={`wrap ${styles.page} ${styles.contact}`}>
      <header className={styles.cHead}>
        <h1 className={styles.h1}>{t.meta.contactTitle}</h1>
      </header>

      <div className={styles.cGrille}>
        <form className={styles.form} name="contact" method="POST" action={`/${lang}/contact/merci/`} data-netlify="true" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="contact" />
          <input type="hidden" name="langue" value={lang} />
          <p hidden><label>Ne pas remplir <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
          <label className={styles.champ}>
            <span>{C.nom}<i className={styles.requis} aria-hidden="true">*</i></span>
            <input name="nom" type="text" autoComplete="family-name" required />
          </label>
          <label className={styles.champ}>
            <span>{C.prenom}<i className={styles.requis} aria-hidden="true">*</i></span>
            <input name="prenom" type="text" autoComplete="given-name" required />
          </label>
          <label className={styles.champ}>
            <span>{C.email}<i className={styles.requis} aria-hidden="true">*</i></span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className={styles.champ}>
            <span>{C.telephone} <small>({C.facultatif})</small></span>
            <input name="telephone" type="tel" autoComplete="tel" />
          </label>
          <label className={`${styles.champ} ${styles.champLarge}`}>
            <span>{C.message}<i className={styles.requis} aria-hidden="true">*</i></span>
            <textarea name="message" rows={6} required />
          </label>
          <div className={styles.formBas}>
            <button type="submit" className={styles.envoyer}>{C.envoyer}</button>
          </div>
        </form>

        <aside className={styles.coord}>
          <p className="eyebrow">{C.coordonnees}</p>
          <dl className={styles.coordList}>
            <div><dt>{C.email}</dt><dd><a href={`mailto:${cv.email}`} data-copier-texte>{cv.email}</a><button type="button" className="xp-copier" data-copier={cv.email} aria-label={t.xp.copier} title={t.xp.copier}>
              <svg className="xp-copier-t" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1"><rect x="5.5" y="5.5" width="8" height="8" rx="1" /><path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1" /></svg>
              <svg className="xp-copie" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="m3 8.5 3 3 7-7" /></svg>
              <span className="sr-only" aria-live="polite" data-copie-msg="">{''}</span>
            </button></dd></div>
            <div><dt>{C.tel}</dt><dd><a href={`tel:${telHref}`}>{tel}</a></dd></div>
            <div><dt>{C.lieu}</dt><dd>{C.lieuV}</dd></div>
          </dl>
          <Reseaux cv={cv} className={styles.icones} ecrire={C.ecrire} email={false} />
          <a className="xp-vcard" href="/laura-pras.vcf" download="laura-pras.vcf" data-xp-libre="">
            <span className="xp-vcard-qr" role="img" aria-label={t.xp.carteTitre} dangerouslySetInnerHTML={{ __html: qr }} />
            <span className="eyebrow xp-vcard-t">{t.xp.carteTitre}</span>
          </a>
        </aside>
      </div>
    </article>
  );
}
