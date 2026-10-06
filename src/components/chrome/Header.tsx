'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Dict, Lang } from '@/i18n';
import { LANGS } from '@/i18n';
import Logo from './Logo';
import styles from './chrome.module.css';

export default function Header({ lang, t }: { lang: Lang; t: Dict }) {
  const path = usePathname() || `/${lang}/`;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  const swap = (l: string) => path.replace(/^\/(fr|en|it)(?=\/|$)/, `/${l}`);
  const links = [
    { href: `/${lang}/projets/`, label: t.nav.projets },
    { href: `/${lang}/references/`, label: t.nav.references },
    { href: `/${lang}/a-propos/`, label: t.nav.apropos },
    { href: `/${lang}/contact/`, label: t.nav.contact },
  ];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} data-open={open || undefined}>
      <Link href={`/${lang}/`} className={styles.brand} aria-label={`Laura Pras, ${t.nav.home}`}>
        <Logo className={styles.brandLogo} label="" />
        <span className={styles.brandName}>Laura Pras</span>
      </Link>
      <button className={styles.burger} aria-expanded={open} aria-controls="menu-principal" onClick={() => setOpen((o) => !o)}>
        {open ? t.nav.close : t.nav.menu}
      </button>
      <nav id="menu-principal" className={styles.nav} aria-label={t.nav.menu}>
        <ul className={styles.links}>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={path.startsWith(l.href) ? 'page' : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className={styles.langs} aria-label="Langue / Language / Lingua">
          {LANGS.map((l) => (
            <li key={l}>
              <a href={swap(l)} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined}>
                {l.toUpperCase()}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
