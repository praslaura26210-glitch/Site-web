'use client';
import { useEffect, useId, useRef } from 'react';
import styles from './project.module.css';

/**
 * Matière : la photo de maquette reçoit une lumière rasante qui suit la souris
 * (filtre SVG d'éclairage, sans WebGL : un seul canvas 3D reste actif sur le site).
 */
export default function Matiere({ src, w, h, alt }: { src: string; w: number; h: number; alt: string }) {
  const id = useId().replace(/:/g, '');
  const light = useRef<SVGFEDistantLightElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(pointer: fine)').matches) return;
    let raf = 0, ax = 225, el = 28, tx = ax, te = el;
    const loop = () => {
      ax += (tx - ax) * 0.12; el += (te - el) * 0.12;
      light.current?.setAttribute('azimuth', ax.toFixed(1));
      light.current?.setAttribute('elevation', el.toFixed(1));
      if (Math.abs(tx - ax) + Math.abs(te - el) > 0.1) raf = requestAnimationFrame(loop); else raf = 0;
    };
    const move = (e: PointerEvent) => {
      const r = box.current!.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tx = (Math.atan2(y, x) * 180) / Math.PI;
      te = 18 + Math.min(1, Math.hypot(x, y) * 2) * 40;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const node = box.current!;
    node.addEventListener('pointermove', move);
    return () => { node.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={box} className={styles.relief}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={alt}>
        <defs>
          <filter id={`f${id}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="hauteur" />
            <feGaussianBlur in="hauteur" stdDeviation="1.2" result="lisse" />
            <feDiffuseLighting in="lisse" surfaceScale="5" diffuseConstant="1.05" lightingColor="#fff1e0" result="lum">
              <feDistantLight ref={light} azimuth="225" elevation="28" />
            </feDiffuseLighting>
            <feComposite in="SourceGraphic" in2="lum" operator="arithmetic" k1="0.85" k2="0.3" k3="0" k4="0" />
          </filter>
        </defs>
        <image href={src} width={w} height={h} filter={`url(#f${id})`} />
      </svg>
    </div>
  );
}
