import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import Logo from './Logo';
import { CV_HREF, PDF_HREF } from './liens';
import styles from './chrome.module.css';

/** Fin de chaque page : le portfolio à télécharger, puis l'adresse, les mentions et le © */
export default function Footer({ lang, t, email }: { lang: Lang; t: Dict; email: string }) {
  return (
    <footer className={styles.footer}>
      <section className={`wrap ${styles.book}`} aria-labelledby="fin-book">
        <div>
          <p className="eyebrow">{t.footer.pdfEyebrow}</p>
          <h2 id="fin-book" className={styles.bookTitle}>{t.footer.pdfTitle}</h2>
          <p className={styles.bookText}>{t.footer.pdfText}</p>
        </div>
        <div className={styles.dl}>
          <a className={styles.dlMain} href={PDF_HREF} download aria-label={t.nav.pdfLong}>
            <span>{t.footer.pdfBtn}</span>
            <small>{t.footer.pdfSize}</small>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 2v10M3.5 7.5 8 12l4.5-4.5M2 14.5h12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
          <a className={styles.dlSub} href={CV_HREF} download>
            <span>{t.footer.cvBtn}</span>
            <small>{t.footer.cvSize}</small>
          </a>
        </div>
      </section>
      <div className={`wrap ${styles.base}`}>
        <Link href={`/${lang}/`} className={styles.baseBrand} aria-label="Laura Pras">
          <Logo className={styles.baseLogo} poids={1.7} label="" />
        </Link>
        <ul className={styles.baseLinks}>
          <li><a href={`mailto:${email}`}>{email}</a></li>
          <li><Link href={`/${lang}/mentions-legales/`}>{t.footer.mentions}</Link></li>
        </ul>
        <p className={styles.copy}>© {new Date().getFullYear()} Laura Pras</p>
      </div>
    </footer>
  );
}
