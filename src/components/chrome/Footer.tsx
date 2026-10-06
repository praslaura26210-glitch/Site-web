import Link from 'next/link';
import type { Dict, Lang } from '@/i18n';
import Reseaux from '@/components/pages/Reseaux';
import Logo from './Logo';
import styles from './chrome.module.css';

/** Pied de page, identique partout : logo à gauche ; Contact et Mentions légales au milieu ; icônes et © à droite. */
export default function Footer({ lang, t, cv }: { lang: Lang; t: Dict; cv: { email: string; linkedin?: string; instagram?: string } }) {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.base}`}>
        <a href={`/${lang}/`} className={styles.baseBrand} aria-label={`Laura Pras, ${t.nav.home}`}>
          <Logo className={styles.baseLogo} poids={1.7} label="" />
          <span>Laura Pras</span>
        </a>
        <ul className={styles.baseLinks}>
          <li><Link href={`/${lang}/contact/`}>{t.nav.contact}</Link></li>
          <li><Link href={`/${lang}/mentions-legales/`}>{t.footer.mentions}</Link></li>
        </ul>
        <div className={styles.baseDroite}>
          <Reseaux cv={cv} className={styles.baseIcones} ecrire={t.contact.ecrire} />
          <p className={styles.copy}>© {new Date().getFullYear()} Laura Pras</p>
        </div>
      </div>
    </footer>
  );
}
