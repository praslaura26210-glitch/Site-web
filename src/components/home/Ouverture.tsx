'use client';
import { useEffect, useRef } from 'react';
import Logo from '@/components/chrome/Logo';
import { xpOuverture } from '@/experience/ouverture';
import styles from './home.module.css';

/**
 * Ouverture de l'accueil, sur fond blanc : de longs axes traversent l'écran et dessinent la cabane,
 * le nom apparaît, puis tout devient flou et s'efface sur la page (voir experience/ouverture.ts).
 * Rejouée à chaque arrivée sur l'accueil ; jamais si l'on a demandé à réduire les animations.
 */
export default function Ouverture({ skip, portfolio }: { skip: string; portfolio: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!document.documentElement.dataset.intro) return;
    return xpOuverture(ref.current!, () => window.dispatchEvent(new Event('lp:intro-fin')));
  }, []);
  return (
    <div ref={ref} className={styles.ouverture} aria-hidden="true">
      <div className={styles.ouvIn}>
        <div className={styles.ouvLogoBox}>
          <Logo className={styles.ouvLogo} draw poids={1.3} label="" />
        </div>
        <p className={styles.ouvNom}>Laura Pras</p>
        <p className={styles.ouvSous}>{portfolio}</p>
      </div>
      <button type="button" className={styles.ouvSkip} tabIndex={-1}>{skip}</button>
    </div>
  );
}
