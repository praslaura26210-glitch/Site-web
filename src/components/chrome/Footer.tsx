import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import Reseaux from '@/components/pages/Reseaux';
import Logo from './Logo';
import styles from './chrome.module.css';

/** Pied de page, identique partout : logo et ©, puis Contact, Mentions légales et e-mail au milieu, icônes à droite. */
export default function Footer({ lang, t, cv }: { lang: Lang; t: Dict; cv: { email: string; linkedin?: string; instagram?: string } }) {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.base}`}>
        <a href={`/${lang}/`} className={styles.baseBrand} aria-label={`Laura Pras, ${t.nav.home}`}>
          <Logo className={styles.baseLogo} poids={1.7} label="" />
          <span>© {new Date().getFullYear()} Laura Pras</span>
        </a>
        <ul className={styles.baseLinks}>
          <li><Link href={`/${lang}/contact/`}>{t.nav.contact}</Link></li>
          <li><Link href={`/${lang}/mentions-legales/`}>{t.footer.mentions}</Link></li>
          <li><a href={`mailto:${cv.email}`}>{cv.email}</a></li>
        </ul>
        <Reseaux cv={cv} className={styles.baseIcones} ecrire={t.contact.ecrire} />
      </div>
    </footer>
  );
}
