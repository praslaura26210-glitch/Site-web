import type { Fiche } from '../types';
import { srcImage } from '../lib/api';
import { NOM_TYPE, domaine } from '../lib/libelles';

/** Image principale de la fiche ; sinon une couverture dessinée à la manière d'un éditeur. */
export function Couverture({ fiche, classe = '' }: { fiche: Fiche; classe?: string }) {
  const i = fiche.images[0];
  if (i) {
    return <img className={`couv ${classe}`} src={srcImage(i.id)} alt="" loading="lazy" decoding="async" draggable={false} style={{ aspectRatio: `${i.w} / ${i.h}` }} />;
  }
  const haut = fiche.auteurs[0] ?? NOM_TYPE[fiche.type];
  const bas = fiche.type === 'site' || fiche.type === 'video' ? domaine(fiche.source) : fiche.editeur;
  return (
    <div className={`couv couv-dessinee type-${fiche.type} ${classe}`} aria-hidden="true">
      <span className="couv-type">{haut}</span>
      <span className="couv-titre">{fiche.titre}</span>
      <span className="couv-bas">{bas ?? ''}</span>
    </div>
  );
}
