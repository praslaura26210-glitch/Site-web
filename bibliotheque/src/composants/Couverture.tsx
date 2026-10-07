import type { Fiche } from '../types';
import { srcImage } from '../lib/api';
import { NOM_TYPE, domaine } from '../lib/libelles';

/** Proportion largeur / hauteur de la vignette, bornée pour garder une étagère régulière. */
export function proportion(f: Fiche): number {
  const i = f.images[0];
  if (i) return Math.min(1.5, Math.max(0.62, i.w / i.h));
  return f.type === 'livre' || f.type === 'article' ? 0.68 : 0.8;
}

/** Image de la fiche, ou couverture dessinée quand il n'y en a pas. */
export function Couverture({ fiche, classe = '' }: { fiche: Fiche; classe?: string }) {
  const i = fiche.images[0];
  if (i) {
    return <img className={`couv ${classe}`} src={srcImage(i.id)} alt="" loading="lazy" decoding="async" draggable={false} />;
  }
  const bas = fiche.type === 'site' || fiche.type === 'video' ? domaine(fiche.source) : fiche.auteurs[0];
  return (
    <div className={`couv couv-dessinee type-${fiche.type} ${classe}`} aria-hidden="true">
      <span className="couv-type">{NOM_TYPE[fiche.type]}</span>
      <span className="couv-titre">{fiche.titre}</span>
      {bas && <span className="couv-bas">{bas}</span>}
    </div>
  );
}
