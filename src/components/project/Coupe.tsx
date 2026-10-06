'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { live, setState, useStore, type Calques } from '@/lib/store';
import { useQuality } from '@/lib/quality';
import { useStageSection } from './useStageSection';
import styles from './project.module.css';

gsap.registerPlugin(ScrollTrigger);

type Labels = { title: string; text: string; position: string; calques: string; names: Record<keyof Calques, string> };
type PlanGeo = { vb: [number, number]; x0: number; x1: number };

/**
 * Coupe vivante : un plan de coupe traverse la maquette. Le scroll le déplace d'est en ouest,
 * le curseur permet de le placer à la main ; le plan RDC indique la position en temps réel.
 */
export default function Coupe({ labels, planSrc, geo, fallback }: { labels: Labels; planSrc: string; geo: PlanGeo; fallback: React.ReactNode }) {
  const q = useQuality();
  const full = q.ready && !q.lite;
  const ref = useRef<HTMLElement>(null);
  const [svg, setSvg] = useState('');
  const [cut, setCut] = useState(0.8);
  const manual = useRef(false);
  const calques = useStore((s) => s.calques);
  useStageSection(ref, full);

  useEffect(() => {
    if (!full) return;
    fetch(planSrc).then((r) => r.text()).then(setSvg).catch(() => {});
  }, [full, planSrc]);

  useEffect(() => {
    if (!full || !ref.current) return;
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        live.shot = 'coupe';
        live.rise = 1;
        live.etat = 1;
        if (!manual.current) {
          const c = 0.92 - self.progress * 0.84;
          live.cut = c;
          setCut(c);
        }
      },
      onToggle: (self) => setState({ coupe: self.isActive || self.progress > 0.5 }),
      onLeaveBack: () => { setState({ coupe: false }); manual.current = false; },
    });
    return () => st.kill();
  }, [full]);

  const onRange = (v: number) => {
    manual.current = true;
    live.cut = v;
    setCut(v);
    setState({ coupe: true });
  };
  const toggle = (k: keyof Calques) => setState((s) => ({ calques: { ...s.calques, [k]: !s.calques[k] } }));

  if (!q.ready) return <section className={styles.s3d} style={{ height: '100svh' }} aria-hidden="true" />;
  if (!full) return <>{fallback}</>;
  const left = ((geo.x0 + cut * (geo.x1 - geo.x0)) / geo.vb[0]) * 100;
  return (
    <section ref={ref} className={styles.s3d} style={{ height: '340svh' }} aria-label={labels.title}>
      <div className={styles.sticky}>
        <div className={styles.panel}>
          <h2>{labels.title}</h2>
          <p>{labels.text}</p>
          <div className={styles.mini} aria-hidden="true">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
            <div className={styles.cutLine} style={{ left: `${left}%` }} />
          </div>
          <label>
            <span className="sr-only">{labels.position}</span>
            <input className={styles.range} type="range" min={0.02} max={0.98} step={0.005} value={cut} onChange={(e) => onRange(+e.target.value)} aria-label={labels.position} />
          </label>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>{labels.calques}</p>
            <div className={styles.toggles}>
              {(Object.keys(labels.names) as (keyof Calques)[]).map((k) => (
                <button key={k} type="button" className={styles.toggle} aria-pressed={calques[k]} onClick={() => toggle(k)}>
                  {labels.names[k]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
