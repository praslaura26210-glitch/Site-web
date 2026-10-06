'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getState, live, setState } from '@/lib/store';
import { useQuality } from '@/lib/quality';
import { useStageSection } from './useStageSection';
import styles from './project.module.css';

gsap.registerPlugin(ScrollTrigger);
const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

type Labels = { title: string; text: string; steps: string[]; existant: string; demolition: string; exposition: string; restauration: string; note: string };

/**
 * « Du plan au volume » : section collante sur 4 hauteurs d'écran. Le scroll fait monter les murs
 * (vue de dessus -> axonométrie), puis passe de l'existant au projet (les démolitions s'enfoncent),
 * puis colore les usages. En version allégée : `fallback` (les dessins).
 */
export default function Volume({ labels, fallback }: { labels: Labels; fallback: React.ReactNode }) {
  const q = useQuality();
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const full = q.ready && !q.lite;
  useStageSection(ref, full);

  useEffect(() => {
    if (!full || !ref.current) return;
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        if (getState().coupe) setState({ coupe: false });
        live.shot = p < 0.1 ? 'plan' : 'axo';
        live.rise = seg(p, 0.1, 0.44);
        live.etat = seg(p, 0.52, 0.72);
        live.orbit = p;
        const usages = p > 0.78;
        if (getState().calques.usages !== usages) setState((s) => ({ calques: { ...s.calques, usages } }));
        setStep(p < 0.1 ? 0 : p < 0.48 ? 1 : p < 0.76 ? 2 : 3);
      },
      onEnter: () => { live.shot = 'plan'; },
    });
    return () => st.kill();
  }, [full]);

  if (!q.ready) return <section className={styles.s3d} style={{ height: '100svh' }} aria-hidden="true" />;
  if (!full) return <>{fallback}</>;
  return (
    <section ref={ref} className={styles.s3d} style={{ height: '420svh' }} aria-label={labels.title}>
      <div className={styles.sticky}>
        <div className={styles.card}>
          <p className="eyebrow">{labels.steps[step]}</p>
          <h2>{labels.title}</h2>
          <p>{labels.text}</p>
          <ol className={styles.steps}>
            {labels.steps.map((s, i) => <li key={s} data-on={i === step || undefined}>{s}</li>)}
          </ol>
          <div className={styles.legend}>
            <span><i style={{ background: 'var(--ombre)' }} />{labels.existant}</span>
            <span><i style={{ background: 'var(--cuite)' }} />{labels.demolition}</span>
            {step === 3 && <><span><i style={{ background: 'var(--expo)' }} />{labels.exposition}</span><span><i style={{ background: 'var(--resto)' }} />{labels.restauration}</span></>}
          </div>
        </div>
        <p className={styles.note}>{labels.note}</p>
      </div>
    </section>
  );
}
