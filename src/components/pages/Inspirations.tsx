'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './pages.module.css';

export type Inspiration = { id: string; titre: string; auteur: string; lieu: string; annee: string; credit: string; info?: string; w: number; h: number };

/** Références : des photos ; un clic ouvre une fiche simple (le projet, qui l'a fait, où, quand). */
export default function Inspirations({ items, labels }: { items: Inspiration[]; labels: { fermer: string; ouvrir: string; auteur: string; lieu: string; annee: string } }) {
  const [cur, setCur] = useState<Inspiration | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (cur) dlg.current?.showModal(); }, [cur]);
  return (
    <>
      <ul className={styles.refGrille}>
        {items.map((x) => (
          <li key={x.id} className="rv">
            <button type="button" className={styles.tuile} onClick={() => setCur(x)} aria-label={`${labels.ouvrir} : ${x.titre}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/site/inspirations/${x.id}.webp`} alt="" width={x.w} height={x.h} loading="lazy" />
              <span className={styles.tuileT}>{x.titre}</span>
              <span className={styles.tuileA}>{x.auteur || x.lieu}</span>
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
              <h2 className={styles.ficheT}>{cur.titre}</h2>
              <dl className={styles.ficheDl}>
                {cur.auteur && <div><dt>{labels.auteur}</dt><dd>{cur.auteur}</dd></div>}
                {cur.lieu && <div><dt>{labels.lieu}</dt><dd>{cur.lieu}</dd></div>}
                {cur.annee && <div><dt>{labels.annee}</dt><dd>{cur.annee}</dd></div>}
                {cur.info && <div><dt>&nbsp;</dt><dd>{cur.info}</dd></div>}
              </dl>
              <p className={styles.ficheCredit}>{cur.credit}</p>
              <button type="button" className="lien" onClick={() => dlg.current?.close()} autoFocus>{labels.fermer}</button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
