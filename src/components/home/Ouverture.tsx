'use client';
import { useEffect, useRef } from 'react';
import Logo from '@/components/chrome/Logo';
import styles from './home.module.css';

/**
 * Ouverture de l'accueil : le logo se dessine d'un seul trait, le nom apparaît, puis le site.
 * Une fois par visite ; jamais si l'on a demandé à réduire les animations (voir le script du layout).
 * L'animation est en CSS : elle démarre dès le premier affichage, le JavaScript ne fait que la terminer.
 */
export default function Ouverture({ skip, portfolio }: { skip: string; portfolio: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const html = document.documentElement;
    if (!html.dataset.intro) return;
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      try { sessionStorage.setItem('lp-intro-vue', '1'); } catch {}
      ref.current?.setAttribute('data-out', '');
      delete html.dataset.intro;
      window.dispatchEvent(new Event('lp:intro-fin'));
    };
    const timer = setTimeout(fin, 4300);
    const key = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && fin();
    window.addEventListener('keydown', key);
    ref.current?.addEventListener('click', fin);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', key); };
  }, []);
  return (
    <div ref={ref} className={styles.ouverture} aria-hidden="true">
      <div className={styles.ouvIn}>
        <Logo className={styles.ouvLogo} draw poids={1.25} label="" />
        <p className={styles.ouvNom}>Laura Pras</p>
        <p className={styles.ouvSous}>{portfolio}</p>
      </div>
      <button type="button" className={styles.ouvSkip} tabIndex={-1}>{skip}</button>
    </div>
  );
}
