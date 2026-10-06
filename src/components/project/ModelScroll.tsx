'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { live, type Scene } from '@/lib/store';
import { useQuality } from '@/lib/quality';
import { useStageSection } from './useStageSection';
import styles from './project.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 3D collante générique : le scroll fait avancer live.rise (0 -> 1) et tourne la caméra.
 * `steps` : étiquettes affichées selon la progression ; `bounds` : seuils de changement d'étape.
 */
export default function ModelScroll({ scene, title, text, steps, bounds, note, height = 380, fallback }: {
  scene: Scene; title: string; text: string; steps: string[]; bounds: number[]; note: string; height?: number; fallback: React.ReactNode;
}) {
  const q = useQuality();
  const full = q.ready && !q.lite;
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  useStageSection(ref, full, scene);

  useEffect(() => {
    if (!full || !ref.current) return;
    live.rise = 0; live.orbit = 0;
    const st = ScrollTrigger.create({
      trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        live.rise = Math.min(1, p / 0.92);
        live.orbit = p;
        setStep(bounds.filter((b) => p >= b).length);
      },
    });
    return () => st.kill();
  }, [full, bounds]);

  if (!q.ready) return <section className={styles.s3d} style={{ height: '100svh' }} aria-hidden="true" />;
  if (!full) return <>{fallback}</>;
  return (
    <section ref={ref} className={styles.s3d} style={{ height: `${height}svh` }} aria-label={title}>
      <div className={styles.sticky}>
        <div className={styles.card}>
          <p className="eyebrow">{steps[step]}</p>
          <h2>{title}</h2>
          <p>{text}</p>
          <ol className={styles.steps}>
            {steps.map((s, i) => <li key={s} data-on={i === step || undefined}>{s}</li>)}
          </ol>
        </div>
        <p className={styles.note}>{note}</p>
      </div>
    </section>
  );
}
