'use client';
import { useEffect, useState } from 'react';
import styles from './home.module.css';

/**
 * Le dessin du couloir : il apparaît en terre cuite à la sortie de l'ouverture,
 * puis reprend lentement sa couleur de mine de plomb. Sans ouverture, il est affiché tel quel.
 */
export default function Couloir({ alt }: { alt: string }) {
  const [terre, setTerre] = useState(false);
  useEffect(() => {
    if (!document.documentElement.dataset.intro) return;
    setTerre(true);
    const go = () => setTimeout(() => setTerre(false), 350);
    window.addEventListener('lp:intro-fin', go, { once: true });
    return () => window.removeEventListener('lp:intro-fin', go);
  }, []);
  return (
    <div className={styles.couloir} data-terre={terre || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/site/dessin-couverture-2000.webp"
        srcSet="/media/site/dessin-couverture-1000.webp 1000w, /media/site/dessin-couverture-2000.webp 2000w"
        sizes="(max-width: 900px) 100vw, 58vw"
        alt={alt}
        width={1398}
        height={1328}
        fetchPriority="high"
      />
    </div>
  );
}
