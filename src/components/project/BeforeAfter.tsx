'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './project.module.css';

type Pair = { id: string; label: string; existant: string; projet: string };
const cache = new Map<string, string>();
const load = (u: string) => (cache.has(u) ? Promise.resolve(cache.get(u)!) : fetch(u).then((r) => r.text()).then((t) => (cache.set(u, t), t)));

/** Curseur avant / après : existant à gauche, projet à droite. Clavier : le curseur est un vrai <input type=range>. */
export default function BeforeAfter({ pairs, labels }: { pairs: Pair[]; labels: { existant: string; projet: string; hint: string } }) {
  const [cur, setCur] = useState(pairs[0].id);
  const [svgs, setSvgs] = useState<{ e: string; p: string } | null>(null);
  const [x, setX] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const pair = pairs.find((p) => p.id === cur)!;

  useEffect(() => {
    let ok = true;
    setSvgs(null);
    Promise.all([load(pair.existant), load(pair.projet)]).then(([e, p]) => ok && setSvgs({ e, p }));
    return () => { ok = false; };
  }, [pair.existant, pair.projet]);

  const fromEvent = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setX(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div>
      <div className={styles.tabs} role="tablist">
        {pairs.map((p) => (
          <button key={p.id} role="tab" aria-selected={p.id === cur} className={styles.tab} onClick={() => setCur(p.id)}>{p.label}</button>
        ))}
      </div>
      <div
        ref={box}
        className={styles.ba}
        data-cursor="drag"
        onPointerDown={(e) => { drag.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); fromEvent(e.clientX); }}
        onPointerMove={(e) => drag.current && fromEvent(e.clientX)}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
      >
        {svgs ? (
          <>
            <div className={styles.layer} dangerouslySetInnerHTML={{ __html: svgs.e }} />
            <div className={`${styles.layer} ${styles.over}`} style={{ clipPath: `inset(0 0 0 ${x}%)` }} dangerouslySetInnerHTML={{ __html: svgs.p }} />
            <div className={styles.handle} style={{ left: `${x}%` }}><span aria-hidden="true">⇆</span></div>
          </>
        ) : (
          <div className={styles.loading}>…</div>
        )}
      </div>
      <div className={styles.baLabels}><span>← {labels.existant}</span><span>{labels.projet} →</span></div>
      <input className={styles.baRange} type="range" min={0} max={100} step={0.5} value={x} onChange={(e) => setX(+e.target.value)} aria-label={labels.hint} />
    </div>
  );
}
