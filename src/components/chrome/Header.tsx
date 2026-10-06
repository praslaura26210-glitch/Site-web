'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Dict, Lang } from '@/i18n';
import { LANGS } from '@/i18n';
import Logo from './Logo';
import styles from './chrome.module.css';

const NOMS: Record<Lang, string> = { fr: 'Français', en: 'English', it: 'Italiano' };

/** Choix de la langue : une petite icône (globe) qui ouvre la liste. */
function Langues({ lang, path, label }: { lang: Lang; path: string; label: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', off);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', off); window.removeEventListener('keydown', esc); };
  }, [open]);
  const swap = (l: string) => path.replace(/^\/(fr|en|it)(?=\/|$)/, `/${l}`);
  return (
    <div className={styles.langues} ref={box}>
      <button type="button" className={styles.globe} aria-expanded={open} aria-controls="choix-langue" aria-label={label} title={label} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1">
          <circle cx="10" cy="10" r="8" />
          <ellipse cx="10" cy="10" rx="3.4" ry="8" />
          <path d="M2.3 7.3h15.4M2.3 12.7h15.4" />
        </svg>
        <span className={styles.globeCode}>{lang.toUpperCase()}</span>
      </button>
      <ul id="choix-langue" className={styles.langList} hidden={!open}>
        {LANGS.map((l) => (
          <li key={l}>
            <a href={swap(l)} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined}>{NOMS[l]}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  const links = [
    { href: `/${lang}/projets/`, label: t.nav.projets },
    { href: `/${lang}/a-propos/`, label: t.nav.apropos },
    { href: `/${lang}/references/`, label: t.nav.references },
    { href: `/${lang}/contact/`, label: t.nav.contact },
  ];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} data-open={open || undefined}>
      {/* lien classique (rechargement) : l'ouverture se rejoue à chaque retour à l'accueil par le logo */}
      <a href={`/${lang}/`} className={styles.brand} aria-label={`Laura Pras, ${t.nav.home}`}>
        <Logo className={styles.brandLogo} poids={1.7} label="" />
        <span className={styles.brandName}>Laura Pras</span>
      </a>
      <div className={styles.right}>
        <button className={styles.burger} aria-expanded={open} aria-controls="menu-principal" onClick={() => setOpen((o) => !o)}>
          {open ? t.nav.close : t.nav.menu}
        </button>
        <nav id="menu-principal" className={styles.nav} aria-label={t.nav.menu}>
          <ul className={styles.links}>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={path.startsWith(l.href) ? 'page' : undefined}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Langues lang={lang} path={path} label={t.nav.langue} />
      </div>
    </header>
  );
}
