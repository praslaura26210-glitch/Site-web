'use client';
import Link from 'next/link';
import { useState } from 'react';
import styles from './home.module.css';

export type Ligne = { slug: string; titre: string; programme: string; annee: number | null; img: { src: string; srcSmall: string; w: number; h: number; pos?: string } };

/**
 * Index des projets : la liste à gauche ; à droite, le projet survolé sous forme de livre (sa couverture).
 * Sur téléphone, chaque ligne porte sa vignette.
 */
export default function ProjetsIndex({ lignes, lang, voir }: { lignes: Ligne[]; lang: string; voir: string }) {
  const [cur, setCur] = useState(0);
  return (
    <div className={styles.index}>
      <ol className={styles.liste}>
        {lignes.map((l, i) => (
          <li key={l.slug} className="rv" data-on={i === cur || undefined}>
            <Link href={`/${lang}/projets/${l.slug}/`} onPointerEnter={() => setCur(i)} onFocus={() => setCur(i)} aria-label={`${l.titre}, ${voir}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.vignette} src={l.img.srcSmall} alt="" width={l.img.w} height={l.img.h} loading="lazy" style={l.img.pos ? { objectPosition: l.img.pos } : undefined} />
              <span className={styles.lN}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.lT}>{l.titre}</span>
              <span className={styles.lP}>{l.programme}{l.annee ? ` • ${l.annee}` : ''}</span>
            </Link>
          </li>
        ))}
      </ol>
      {/* à droite, le projet survolé en livre : sa couverture, son épaisseur ; un clic l'ouvre (page du projet) */}
      <div className={styles.apercu} aria-hidden="true">
        {lignes.map((l, i) => (
          <Link key={l.slug} href={`/${lang}/projets/${l.slug}/`} tabIndex={-1} className={styles.livreCouv} data-on={i === cur || undefined}>
            <span className={styles.lcLivre}>
              <span className={styles.lcTranche} />
              <span className={styles.lcFace}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.img.srcSmall} srcSet={`${l.img.srcSmall} 1000w, ${l.img.src} 2000w`} sizes="40vw" alt="" width={l.img.w} height={l.img.h} loading={i === 0 ? 'eager' : 'lazy'} style={l.img.pos ? { objectPosition: l.img.pos } : undefined} />
                <span className={styles.lcN}>N° {String(i + 1).padStart(2, '0')}{l.annee ? ` — ${l.annee}` : ''}</span>
                <span className={styles.lcT}>{l.titre}</span>
                <span className={styles.lcNom}>Laura Pras</span>
              </span>
            </span>
            <span className={styles.lcOmbre} />
          </Link>
        ))}
      </div>
    </div>
  );
}
