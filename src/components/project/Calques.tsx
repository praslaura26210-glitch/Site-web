'use client';
import { useEffect, useState } from 'react';
import styles from './project.module.css';

type Layer = { id: string; label: string; src: string };

/** Plans superposés au même cadrage ; chaque calque s'allume ou s'éteint. */
export default function Calques({ layers, title }: { layers: Layer[]; title: string }) {
  const [svgs, setSvgs] = useState<string[]>([]);
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(layers.map((l, i) => [l.id, i === 0])));
  useEffect(() => {
    Promise.all(layers.map((l) => fetch(l.src).then((r) => r.text()))).then(setSvgs).catch(() => {});
  }, [layers]);
  return (
    <div>
      <div className={styles.tabs} role="group" aria-label={title}>
        {layers.map((l) => (
          <button key={l.id} type="button" className={styles.toggle} aria-pressed={on[l.id]} onClick={() => setOn((o) => ({ ...o, [l.id]: !o[l.id] }))}>{l.label}</button>
        ))}
      </div>
      <div className={styles.ba} style={{ touchAction: 'auto' }}>
        {svgs.length ? layers.map((l, i) => (
          <div key={l.id} className={`${styles.layer} ${i ? styles.over : ''}`} style={{ opacity: on[l.id] ? 1 : 0, transition: 'opacity .5s', mixBlendMode: i ? 'multiply' : undefined }} dangerouslySetInnerHTML={{ __html: svgs[i] }} />
        )) : <div className={styles.loading}>…</div>}
      </div>
    </div>
  );
}
