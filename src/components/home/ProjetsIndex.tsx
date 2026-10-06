'use client';
import Link from 'next/link';
import { useState } from 'react';
import styles from './home.module.css';

export type Ligne = { slug: string; titre: string; programme: string; annee: number | null; img: { src: string; srcSmall: string; w: number; h: number; pos?: string } };

/**
 * Index des projets : la grande image du projet survolé à gauche, la liste à droite.
 * Sur téléphone, chaque ligne porte sa vignette.
 */
export default function ProjetsIndex({ lignes, lang, voir }: { lignes: Ligne[]; lang: string; voir: string }) {
  const [cur, setCur] = useState(0);
  return (
    <div className={styles.index}>
      <div className={styles.apercu} aria-hidden="true">
        {lignes.map((l, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={l.slug} src={l.img.srcSmall} srcSet={`${l.img.srcSmall} 1000w, ${l.img.src} 2000w`} sizes="58vw" alt="" width={l.img.w} height={l.img.h} loading={i === 0 ? 'eager' : 'lazy'} data-on={i === cur || undefined} style={l.img.pos ? { objectPosition: l.img.pos } : undefined} />
        ))}
        <p className={styles.apercuLeg}>
          <span>{String(cur + 1).padStart(2, '0')}</span>
          {lignes[cur].titre}
        </p>
      </div>
      <ol className={styles.liste}>
        {lignes.map((l, i) => (
          <li key={l.slug} className="rv" data-on={i === cur || undefined}>
            <Link href={`/${lang}/projets/${l.slug}/`} onPointerEnter={() => setCur(i)} onFocus={() => setCur(i)} aria-label={`${l.titre}, ${voir}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.vignette} src={l.img.srcSmall} alt="" width={l.img.w} height={l.img.h} loading="lazy" style={l.img.pos ? { objectPosition: l.img.pos } : undefined} />
              <span className={styles.lN}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.lT}>{l.titre}</span>
              <span className={styles.lP}>{l.programme}</span>
              <span className={styles.lA}>{l.annee}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
