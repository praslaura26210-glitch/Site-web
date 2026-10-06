import Link from 'next/link';
import { dict, type Lang } from '@/i18n';
import { meta } from '@/lib/seo';
import styles from '@/components/pages/pages.module.css';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return { ...meta(lang, '/contact/merci/', `${t.contact.merciT} · Laura Pras`, t.contact.merciX), robots: { index: false, follow: false } };
}

/** Page affichée après l'envoi du formulaire de contact. */
export default async function Merci({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  return (
    <article className={`wrap ${styles.page} ${styles.merci}`}>
      <p className="eyebrow">{t.meta.contactTitle}</p>
      <h1 className={styles.cTitre}>{t.contact.merciT}</h1>
      <p className={styles.headLead}>{t.contact.merciX}</p>
      <Link className="lien" href={`/${lang}/`}>{t.contact.retour}</Link>
    </article>
  );
}
