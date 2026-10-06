'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './project.module.css';

type P = { id: string; label: string; svg?: string; preview?: string; full?: string; ratio: number; ko?: number };

/**
 * Lecture des plans : zoom à la molette / au pincement / aux boutons / au clavier, déplacement au glisser.
 * Le SVG reste net à toutes les échelles. Les plans très lourds s'affichent d'abord en image
 * et le SVG n'est chargé qu'au-delà d'un zoom x1,8.
 */
export default function PlanViewer({ plans, labels, className }: { plans: P[]; labels: { hint: string; zoomIn: string; zoomOut: string; reset: string }; className?: string }) {
  const [cur, setCur] = useState(plans[0].id);
  const plan = plans.find((p) => p.id === cur)!;
  const [svg, setSvg] = useState('');
  const view = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const tf = useRef({ s: 1, x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const apply = () => {
    const { s, x, y } = tf.current;
    if (canvas.current) canvas.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    setScale(s);
  };
  const fit = useCallback(() => {
    const v = view.current!.getBoundingClientRect();
    const w = Math.min(v.width, v.height * plan.ratio);
    canvas.current!.style.width = `${w}px`;
    tf.current = { s: 1, x: (v.width - w) / 2, y: (v.height - w / plan.ratio) / 2 };
    apply();
  }, [plan.ratio]);

  const [hd, setHd] = useState(false);
  useEffect(() => {
    setSvg('');
    setHd(false);
    if (!plan.preview && plan.svg) fetch(plan.svg).then((r) => r.text()).then(setSvg).catch(() => {});
    requestAnimationFrame(fit);
  }, [plan, fit]);
  useEffect(() => {
    if (scale <= 1.6) return;
    if (plan.svg && plan.preview && !svg) fetch(plan.svg).then((r) => r.text()).then(setSvg).catch(() => {});
    if (plan.full && !hd) setHd(true);
  }, [scale, plan, svg, hd]);
  useEffect(() => {
    const on = () => fit();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [fit]);

  const zoomAt = (f: number, cx: number, cy: number) => {
    const t = tf.current;
    const s = Math.min(24, Math.max(0.6, t.s * f));
    const k = s / t.s;
    t.x = cx - (cx - t.x) * k;
    t.y = cy - (cy - t.y) * k;
    t.s = s;
    apply();
  };
  const center = () => { const r = view.current!.getBoundingClientRect(); return [r.width / 2, r.height / 2] as const; };

  useEffect(() => {
    const el = view.current!;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);

  const down = (e: React.PointerEvent) => { (e.target as Element).setPointerCapture?.(e.pointerId); pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); };
  const move = (e: React.PointerEvent) => {
    const ps = pointers.current;
    const prev = ps.get(e.pointerId);
    if (!prev) return;
    if (ps.size === 1) {
      tf.current.x += e.clientX - prev.x;
      tf.current.y += e.clientY - prev.y;
      apply();
    } else if (ps.size === 2) {
      const [a, b] = [...ps.values()];
      const other = a === prev ? b : a;
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
      const d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      const r = view.current!.getBoundingClientRect();
      if (d0 > 0) zoomAt(d1 / d0, (e.clientX + other.x) / 2 - r.left, (e.clientY + other.y) / 2 - r.top);
    }
    ps.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const up = (e: React.PointerEvent) => pointers.current.delete(e.pointerId);
  const key = (e: React.KeyboardEvent) => {
    const [cx, cy] = center();
    if (e.key === '+' || e.key === '=') zoomAt(1.25, cx, cy);
    else if (e.key === '-') zoomAt(0.8, cx, cy);
    else if (e.key === '0') fit();
    else if (e.key.startsWith('Arrow')) {
      const d = 40;
      if (e.key === 'ArrowLeft') tf.current.x += d;
      if (e.key === 'ArrowRight') tf.current.x -= d;
      if (e.key === 'ArrowUp') tf.current.y += d;
      if (e.key === 'ArrowDown') tf.current.y -= d;
      apply();
    } else return;
    e.preventDefault();
  };

  return (
    <div className={styles.viewerWrap}>
      {plans.length > 1 && (
        <div className={styles.tabs} role="tablist">
          {plans.map((p) => (
            <button key={p.id} role="tab" aria-selected={p.id === cur} className={styles.tab} onClick={() => setCur(p.id)}>{p.label}</button>
          ))}
        </div>
      )}
      <div
        ref={view}
        className={`${styles.viewer} ${className || ''}`}
        tabIndex={0}
        role="img"
        aria-label={`${plan.label}. ${labels.hint}`}
        data-cursor="drag"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        <div ref={canvas} className={styles.canvas}>
          {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : plan.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hd && plan.full ? plan.full : plan.preview} alt="" draggable={false} />
          ) : null}
        </div>
        <div className={styles.tools}>
          <button type="button" onClick={() => { const [x, y] = center(); zoomAt(1.4, x, y); }} aria-label={labels.zoomIn}>+</button>
          <button type="button" onClick={() => { const [x, y] = center(); zoomAt(1 / 1.4, x, y); }} aria-label={labels.zoomOut}>−</button>
          <button type="button" onClick={fit} aria-label={labels.reset}>⤢</button>
        </div>
        <p className={styles.hint}>{labels.hint}</p>
        <p className={styles.scale}>×{scale.toFixed(1)}</p>
      </div>
    </div>
  );
}
