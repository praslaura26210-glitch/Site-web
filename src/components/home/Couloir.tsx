'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './home.module.css';

/** Le dessin du couloir, tel quel. Un clic l'ouvre en grand, avec la mention de l'auteure. */
export default function Couloir({ legende, ouvrir, fermer }: { legende: string; ouvrir: string; fermer: string }) {
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dlg.current?.showModal(); }, [open]);
  return (
    <>
      <button type="button" className={styles.couloir} onClick={() => setOpen(true)} aria-label={`${ouvrir} : ${legende}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/site/dessin-couverture-2000.webp"
          srcSet="/media/site/dessin-couverture-1000.webp 1000w, /media/site/dessin-couverture-2000.webp 2000w"
          sizes="(max-width: 900px) 100vw, 58vw"
          alt={legende}
          width={1398}
          height={1328}
          fetchPriority="high"
        />
      </button>
      {open && (
        <dialog ref={dlg} className={styles.grand} onClose={() => setOpen(false)} onClick={(e) => e.target === dlg.current && dlg.current?.close()} aria-label={legende}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/site/dessin-couverture-2000.webp" alt={legende} width={1398} height={1328} />
          <button type="button" className={styles.grandFermer} onClick={() => dlg.current?.close()} aria-label={fermer} autoFocus>✕</button>
          <p className={styles.grandCredit}>© Laura Pras</p>
        </dialog>
      )}
    </>
  );
}
