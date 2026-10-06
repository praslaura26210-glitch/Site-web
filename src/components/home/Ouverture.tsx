'use client';
import { useEffect, useRef } from 'react';
import Logo from '@/components/chrome/Logo';
import styles from './home.module.css';

/** Centre de la porte de la cabane, en fractions de la boîte du logo (voir Logo.tsx). */
const PORTE = { x: (70 - 12) / 98, y: (94 - 16) / 112 };
/** Moment où la porte s'ouvre (ms), puis fin de l'ouverture : à accorder avec home.module.css. */
const OUVRE = 2150, FIN = 2650;

/**
 * Ouverture de l'accueil, sur fond terre cuite : la cabane se dessine en blanc, le nom apparaît,
 * puis la porte s'ouvre et laisse voir le site à travers elle.
 * Rejouée à chaque arrivée sur l'accueil ; jamais si l'on a demandé à réduire les animations.
 * Les animations sont en CSS ; le JavaScript règle le moment où le site devient visible.
 */
export default function Ouverture({ skip, portfolio }: { skip: string; portfolio: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const html = document.documentElement;
    if (!html.dataset.intro) return;
    const el = ref.current!;
    el.setAttribute('data-actif', '');
    const r = logo.current!.getBoundingClientRect();
    el.style.setProperty('--px', `${r.left + r.width * PORTE.x}px`);
    el.style.setProperty('--py', `${r.top + r.height * PORTE.y}px`);
    const montre = () => {
      if (!html.dataset.intro) return;
      delete html.dataset.intro;
      window.dispatchEvent(new Event('lp:intro-fin'));
    };
    const cache = () => el.setAttribute('data-out', '');
    const t1 = setTimeout(montre, OUVRE);
    const t2 = setTimeout(cache, FIN);
    const passe = () => { montre(); cache(); };
    const key = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && passe();
    window.addEventListener('keydown', key);
    el.addEventListener('click', passe);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('keydown', key); };
  }, []);
  return (
    <div ref={ref} className={styles.ouverture} aria-hidden="true">
      <div className={styles.ouvIn}>
        <div ref={logo} className={styles.ouvLogoBox}>
          <Logo className={styles.ouvLogo} draw poids={1.3} label="" />
        </div>
        <p className={styles.ouvNom}>Laura Pras</p>
        <p className={styles.ouvSous}>{portfolio}</p>
      </div>
      <button type="button" className={styles.ouvSkip} tabIndex={-1}>{skip}</button>
    </div>
  );
}
