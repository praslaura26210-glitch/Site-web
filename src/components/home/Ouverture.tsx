'use client';
import { useEffect, useRef } from 'react';
import Logo from '@/components/chrome/Logo';
import { xpOuverture } from '@/experience/ouverture';
import styles from './home.module.css';

/**
 * Ouverture de l'accueil : la page derrière un verre dépoli ; chaque trait de la cabane naît d'un long axe
 * tracé à travers l'écran, puis le nom ; ensuite le verre fond (voir experience/ouverture.ts).
 * Rejouée à chaque arrivée sur l'accueil ; jamais si l'on a demandé à réduire les animations.
 */
/** Le texte en lettres séparées : chacune se trace (contour) puis se remplit, l'une après l'autre. */
const lettres = (texte: string, depart: number) => [...texte].map((c, k) => (
  <tspan key={k} style={{ ['--k' as string]: depart + k }}>{c}</tspan>
));

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
          <Logo className={styles.ouvLogo} poids={0.5} label="" />
        </div>
        {/* le nom s'écrit : le contour de chaque lettre se trace, puis elle se remplit (home.module.css) */}
        <svg className={styles.ouvEcrit} viewBox="0 0 240 58" aria-hidden="true">
          <text className={styles.ouvNom} x="120" y="22" textAnchor="middle">{lettres('LAURA PRAS', 0)}</text>
          <text className={styles.ouvSous} x="120" y="48" textAnchor="middle">{lettres(portfolio.toUpperCase(), 10)}</text>
        </svg>
      </div>
      <button type="button" className={styles.ouvSkip} tabIndex={-1}>{skip}</button>
    </div>
  );
}
