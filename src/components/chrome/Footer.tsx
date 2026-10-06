import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import Logo from './Logo';
import styles from './chrome.module.css';

/** Pied de page : logo et nom, e-mail, mentions légales, © */
export default function Footer({ lang, t, email }: { lang: Lang; t: Dict; email: string }) {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.base}`}>
        <a href={`/${lang}/`} className={styles.baseBrand} aria-label={`Laura Pras, ${t.nav.home}`}>
          <Logo className={styles.baseLogo} poids={1.7} label="" />
          <span>Laura Pras</span>
        </a>
        <ul className={styles.baseLinks}>
          <li><a href={`mailto:${email}`}>{email}</a></li>
          <li><Link href={`/${lang}/contact/`}>{t.nav.contact}</Link></li>
          <li><Link href={`/${lang}/mentions-legales/`}>{t.footer.mentions}</Link></li>
        </ul>
        <p className={styles.copy}>© {new Date().getFullYear()} Laura Pras</p>
      </div>
    </footer>
  );
}
