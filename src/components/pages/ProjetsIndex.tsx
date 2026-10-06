'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { live } from '@/lib/store';
import { useQuality } from '@/lib/quality';
import { useStageSection } from '@/components/project/useStageSection';
import styles from './pages.module.css';

type Item = { slug: string; href: string; ordre: number; titre: string; programme: string; annee: number | null };
type Labels = { terrain: string; liste: string; hint: string; titre: string };
const KEY = 'lp-vue-projets';

/**
 * Index des projets : chaque projet est une petite maquette posée sur le terrain.
 * Les étiquettes sont de vrais liens (clavier, lecteurs d'écran) placés par la 3D au-dessus des maquettes.
 * Au clic, la caméra s'envole vers la maquette puis la page projet s'ouvre. Vue liste en un clic.
 */
export default function ProjetsIndex({ items, labels, liste }: { items: Item[]; labels: Labels; liste: React.ReactNode }) {
  const q = useQuality();
  const router = useRouter();
  const [vue, setVue] = useState<'terrain' | 'liste' | null>(null);
  const ref = useRef<HTMLElement>(null);
  const full = q.ready && !q.lite;

  useEffect(() => {
    if (!q.ready) return;
    let v: 'terrain' | 'liste' = full ? 'terrain' : 'liste';
    try { const s = localStorage.getItem(KEY); if (full && (s === 'liste' || s === 'terrain')) v = s; } catch {}
    setVue(v);
  }, [q.ready, full]);
  useStageSection(ref, full && vue === 'terrain', 'index');
  useEffect(() => () => { live.hover = ''; live.focus = ''; }, []);

  const choose = (v: 'terrain' | 'liste') => { setVue(v); try { localStorage.setItem(KEY, v); } catch {} };
  const go = (e: React.MouseEvent, it: Item) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    live.focus = it.slug;
    setTimeout(() => router.push(it.href), 850);
  };

  return (
    <>
      <div className={`wrap ${styles.indexBar}`}>
        <h1 className={styles.h1Small}>{labels.titre}</h1>
        {full && (
          <div className={styles.switch} role="group" aria-label={`${labels.terrain} / ${labels.liste}`}>
            <button type="button" aria-pressed={vue === 'terrain'} onClick={() => choose('terrain')}>{labels.terrain}</button>
            <button type="button" aria-pressed={vue === 'liste'} onClick={() => choose('liste')}>{labels.liste}</button>
          </div>
        )}
      </div>
      {vue === 'terrain' ? (
        <section ref={ref} className={styles.terrain} aria-label={labels.terrain}>
          <p className={styles.terrainHint}>{labels.hint}</p>
          {items.map((it) => (
            <a
              key={it.slug}
              href={it.href}
              ref={(el) => { live.labels[it.slug] = el; }}
              className={styles.pin}
              onMouseEnter={() => (live.hover = it.slug)}
              onMouseLeave={() => (live.hover = '')}
              onFocus={() => (live.hover = it.slug)}
              onBlur={() => (live.hover = '')}
              onClick={(e) => go(e, it)}
            >
              <span className={styles.pinIn}>
                <span className={styles.pinN}>{String(it.ordre).padStart(2, '0')}</span>
                <span className={styles.pinT}>{it.titre}</span>
                <span className={styles.pinM}>{it.programme}{it.annee ? `, ${it.annee}` : ''}</span>
              </span>
            </a>
          ))}
        </section>
      ) : (
        liste
      )}
    </>
  );
}
