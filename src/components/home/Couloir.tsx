'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './home.module.css';

/*
 * Repères pris sur le dessin (fractions de la largeur et de la hauteur de l'image) :
 * ligne d'horizon et axe du couloir, puis départ et arrivée de la silhouette.
 */
const HORIZON = 0.44, AXE = 0.455, AXE_PRES = 0.49;
const PIEDS_DEPART = 0.74, PIEDS_ARRIVEE = 0.56;
/** taille d'une personne quand ses pieds sont au bas de l'image (fraction de la hauteur) */
const TAILLE = 0.5 / (0.88 - HORIZON);
const MARCHE = 9500, PAUSE = 4500;

/**
 * Le dessin du couloir. Une ombre de silhouette s'y éloigne lentement, en perspective,
 * puis revient au départ. Un clic ouvre le dessin en grand (avec la mention de l'auteure).
 */
export default function Couloir({ legende, ouvrir, fermer }: { legende: string; ouvrir: string; fermer: string }) {
  const perso = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = perso.current!;
    let raf = 0, t0 = 0;
    const s0 = (PIEDS_DEPART - HORIZON), s1 = (PIEDS_ARRIVEE - HORIZON);
    const z0 = 1 / s0, z1 = 1 / s1;
    const frame = (now: number) => {
      if (!t0) t0 = now;
      const c = (now - t0) % (MARCHE + PAUSE);
      const t = Math.min(1, c / MARCHE);
      // vitesse constante en profondeur : la silhouette ralentit à l'œil en s'éloignant
      const z = z0 + (z1 - z0) * t;
      const s = 1 / z;
      const pieds = HORIZON + s;
      const x = AXE + (AXE_PRES - AXE) * (s / s0);
      const h = TAILLE * s;
      const o = c > MARCHE ? 0 : Math.min(1, c / 700) * Math.min(1, (MARCHE - c) / 1400);
      el.style.left = `${x * 100}%`;
      el.style.top = `${pieds * 100}%`;
      el.style.height = `${h * 100}%`;
      el.style.opacity = o.toFixed(3);
      raf = requestAnimationFrame(frame);
    };
    const go = () => { raf = requestAnimationFrame(frame); };
    if (document.documentElement.dataset.intro) window.addEventListener('lp:intro-fin', () => setTimeout(go, 600), { once: true });
    else go();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!open) return;
    dlg.current?.showModal();
  }, [open]);

  return (
    <>
      <button type="button" className={styles.couloir} onClick={() => setOpen(true)} aria-label={`${ouvrir} : ${legende}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/site/dessin-couverture-2000.webp"
          srcSet="/media/site/dessin-couverture-1000.webp 1000w, /media/site/dessin-couverture-2000.webp 2000w"
          sizes="(max-width: 900px) 100vw, 58vw"
          alt={legende}
          width={1398}
          height={1328}
          fetchPriority="high"
        />
        <div ref={perso} className={styles.perso} aria-hidden="true">
          <svg viewBox="0 0 30 100" preserveAspectRatio="xMidYMax meet">
            <ellipse cx="15" cy="99" rx="9" ry="1.6" className={styles.persoSol} />
            <g className={styles.persoCorps}>
              <circle cx="15" cy="8.5" r="6" />
              <path d="M8.5 19c0-3 2.8-5 6.5-5s6.5 2 6.5 5l1 27c0 2-1.6 3-3.6 3h-7.8c-2 0-3.6-1-3.6-3z" />
              <path className={styles.brasG} d="M8.6 20c-1.6 0-2.6 1.3-2.7 3l-.9 20c0 1.4 2.6 1.6 2.9.2l2.6-19z" />
              <path className={styles.brasD} d="M21.4 20c1.6 0 2.6 1.3 2.7 3l.9 20c0 1.4-2.6 1.6-2.9.2l-2.6-19z" />
              <path className={styles.jambeG} d="M10 47h5l-.6 49.5c0 1.6-3.6 1.6-3.7 0z" />
              <path className={styles.jambeD} d="M15 47h5l-.7 49.5c-.1 1.6-3.7 1.6-3.7 0z" />
            </g>
          </svg>
        </div>
      </button>
      {open && (
        <dialog ref={dlg} className={styles.grand} onClose={() => setOpen(false)} onClick={(e) => e.target === dlg.current && dlg.current?.close()} aria-label={legende}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/site/dessin-couverture-2000.webp" alt={legende} width={1398} height={1328} />
          <p className={styles.grandBar}>
            <span>{legende}</span>
            <button type="button" className="lien" onClick={() => dlg.current?.close()} autoFocus>{fermer}</button>
          </p>
        </dialog>
      )}
    </>
  );
}
