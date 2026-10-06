'use client';
import { useState } from 'react';
import type { Media } from '@/lib/media';
import Planche, { type Labels } from './Planche';
import styles from './project.module.css';

/** Un même plan en plusieurs versions (ex. aménagement / électricité) : on choisit, le clic agrandit. */
export default function Bascule({ options, labels, credit }: { options: { label: string; m: Media }[]; labels: Labels; credit?: string }) {
  const [i, setI] = useState(0);
  return (
    <div className={styles.bascule}>
      <div className={styles.basculeTabs} role="tablist">
        {options.map((o, k) => (
          <button key={o.label} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)}>{o.label}</button>
        ))}
      </div>
      <div key={i} className={styles.basculeVue}>
        <Planche m={options[i].m} sizes="(max-width: 900px) 100vw, 60vw" labels={labels} credit={credit} />
      </div>
    </div>
  );
}
