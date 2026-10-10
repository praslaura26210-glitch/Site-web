import Link from 'next/link';
import type { Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import { couverture } from './ProjetsGrille';

/** Frise : les projets dans l'ordre des années, sur une ligne qu'on fait glisser (voir experience/vues.ts). */
export default function Frise({ projets, lang, labels }: { projets: Projet[]; lang: Lang; labels: { precedent: string; suivant: string } }) {
  const tri = projets.map((p, i) => ({ p, n: i + 1 })).sort((a, b) => (a.p.annee ?? 9999) - (b.p.annee ?? 9999) || a.n - b.n);
  return (
    <div className="xp-frise" data-frise>
      <ol className="xp-frise-piste" data-frise-piste tabIndex={0} style={{ listStyle: 'none', margin: 0 }}>
        {tri.map(({ p, n }) => {
          const { img, pos } = couverture(p);
          return (
            <li key={p.slug} className="xp-frise-item">
              <span className="xp-frise-an">{p.annee ?? '—'}</span>
              <Link href={`/${lang}/projets/${p.slug}/`} draggable={false}>
                <span className="xp-frise-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.srcSmall} alt="" width={img.w} height={img.h} loading="lazy" draggable={false} style={pos ? { objectPosition: pos } : undefined} />
                </span>
                <span className="xp-frise-t"><span className="xp-ex-n">{String(n).padStart(2, '0')}</span> {p.titre}</span>
                <span className="xp-frise-p">{p.programme}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="xp-frise-bas">
        <button type="button" data-frise-prec aria-label={labels.precedent}><svg viewBox="0 0 24 12" width="20" height="10" aria-hidden="true"><path d="M24 6H2M7 1 2 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg></button>
        <span className="xp-frise-jauge" aria-hidden="true"><i data-frise-jauge /></span>
        <button type="button" data-frise-suiv aria-label={labels.suivant}><svg viewBox="0 0 24 12" width="20" height="10" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg></button>
      </div>
    </div>
  );
}
