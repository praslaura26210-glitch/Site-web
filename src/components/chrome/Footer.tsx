import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import { PDF_HREF } from './Header';
import styles from './chrome.module.css';

export default function Footer({ lang, t, email }: { lang: Lang; t: Dict; email: string }) {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.footerIn}`}>
        <p className={styles.footerName}>Laura Pras</p>
        <ul className={styles.footerLinks}>
          <li><a href={`mailto:${email}`}>{email}</a></li>
          <li><a href={PDF_HREF} download>{t.nav.pdfLong}</a></li>
          <li><Link href={`/${lang}/mentions-legales/`}>{t.footer.mentions}</Link></li>
          <li>© {new Date().getFullYear()} Laura Pras</li>
        </ul>
      </div>
    </footer>
  );
}
