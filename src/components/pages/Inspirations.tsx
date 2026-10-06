'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './pages.module.css';

export type Inspiration = { id: string; theme: string; titre: string; auteur: string; lieu: string; annee: string; credit: string; texte: string; w: number; h: number };

/** Mosaïque de références : des photos ; un clic ouvre la fiche (texte tiré du rapport d'études). */
export default function Inspirations({ items, themes, labels }: { items: Inspiration[]; themes: { id: string; label: string }[]; labels: { tout: string; fermer: string; ouvrir: string } }) {
  const [filtre, setFiltre] = useState('tout');
  const [cur, setCur] = useState<Inspiration | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!cur) return;
    dlg.current?.showModal();
  }, [cur]);
  const vus = filtre === 'tout' ? items : items.filter((x) => x.theme === filtre);
  const nomTheme = (id: string) => themes.find((t) => t.id === id)?.label || '';
  return (
    <>
      <div className={styles.filtres} role="group" aria-label={labels.tout}>
        {[{ id: 'tout', label: labels.tout }, ...themes].map((t) => (
          <button key={t.id} type="button" aria-pressed={filtre === t.id} onClick={() => setFiltre(t.id)}>{t.label}</button>
        ))}
      </div>
      <ul className={styles.mosaique}>
        {vus.map((x) => (
          <li key={x.id}>
            <button type="button" className={styles.tuile} onClick={() => setCur(x)} aria-label={`${labels.ouvrir} : ${x.titre}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/site/inspirations/${x.id}.webp`} alt="" width={x.w} height={x.h} loading="lazy" />
              <span className={styles.tuileTxt}>
                <span className={styles.tuileT}>{x.titre}</span>
                <span className={styles.tuileA}>{[x.auteur, x.annee].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {cur && (
        <dialog ref={dlg} className={styles.fiche} onClose={() => setCur(null)} onClick={(e) => e.target === dlg.current && dlg.current?.close()} aria-label={cur.titre}>
          <div className={styles.ficheIn}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/site/inspirations/${cur.id}.webp`} alt={cur.titre} width={cur.w} height={cur.h} />
            <div className={styles.ficheTxt}>
              <p className={styles.ficheTheme}>{nomTheme(cur.theme)}</p>
              <h2 className={styles.ficheT}>{cur.titre}</h2>
              <p className={styles.ficheMeta}>{[cur.auteur, cur.lieu, cur.annee].filter(Boolean).join(' · ')}</p>
              <p className={styles.ficheX}>{cur.texte}</p>
              <p className={styles.ficheCredit}>{cur.credit}</p>
              <button type="button" className="lien" onClick={() => dlg.current?.close()} autoFocus>{labels.fermer}</button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
