'use client';
import { useEffect, useRef } from 'react';
import Logo from '@/components/chrome/Logo';
import styles from './home.module.css';

/** Centre de la porte de la cabane, en fractions de la boîte du logo (voir Logo.tsx). */
const PORTE = { x: (70 - 12) / 98, y: (94 - 16) / 112 };

/**
 * Ouverture de l'accueil : la cabane se dessine trait par trait, le nom apparaît,
 * puis on « entre » par la porte : un disque terre cuite s'ouvre depuis la porte et recouvre l'écran,
 * avant de laisser place au site. Rejouée à chaque arrivée sur l'accueil ; jamais si l'on a demandé
 * à réduire les animations (voir le script du layout). L'animation est en CSS ; le JavaScript la termine.
 */
export default function Ouverture({ skip, portfolio }: { skip: string; portfolio: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const html = document.documentElement;
    if (!html.dataset.intro) return;
    const el = ref.current!;
    const r = logo.current!.getBoundingClientRect();
    el.style.setProperty('--px', `${r.left + r.width * PORTE.x}px`);
    el.style.setProperty('--py', `${r.top + r.height * PORTE.y}px`);
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      el.setAttribute('data-out', '');
      delete html.dataset.intro;
      window.dispatchEvent(new Event('lp:intro-fin'));
    };
    const timer = setTimeout(fin, 4500);
    const key = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && fin();
    window.addEventListener('keydown', key);
    el.addEventListener('click', fin);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', key); };
  }, []);
  return (
    <div ref={ref} className={styles.ouverture} aria-hidden="true">
      <div className={styles.ouvIn}>
        <div ref={logo} className={styles.ouvLogoBox}>
          <Logo className={styles.ouvLogo} draw poids={1.25} label="" />
        </div>
        <p className={styles.ouvNom}>Laura Pras</p>
        <p className={styles.ouvSous}>{portfolio}</p>
      </div>
      <div className={styles.porte} />
      <button type="button" className={styles.ouvSkip} tabIndex={-1}>{skip}</button>
    </div>
  );
}
