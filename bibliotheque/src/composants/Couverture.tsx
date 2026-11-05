import type { Fiche } from '../types';
import { srcImage } from '../lib/api';
import { NOM_TYPE, domaine } from '../lib/libelles';

/** Teintes de la palette pour les couvertures sans image : chaque fiche garde toujours la même. */
const TEINTES = ['#A9705C', '#8C522D', '#A55135', '#712724', '#A26030', '#BD8F79', '#9F4523', '#AE875E'];
const teinte = (id: string) => TEINTES[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TEINTES.length];

/** Image principale de la fiche ; sinon une couverture d'éditeur toute simple : un aplat de couleur, le titre en blanc. */
export function Couverture({ fiche, classe = '' }: { fiche: Fiche; classe?: string }) {
  const i = fiche.images[0];
  if (i) {
    return <img className={`couv ${classe}`} src={srcImage(i.id)} alt="" loading="lazy" decoding="async" draggable={false} style={{ aspectRatio: `${i.w} / ${i.h}` }} />;
  }
  const haut = fiche.auteurs[0] ?? NOM_TYPE[fiche.type];
  const bas = fiche.type === 'site' || fiche.type === 'video' || fiche.type === 'podcast' ? domaine(fiche.source) : fiche.editeur;
  return (
    <div className={`couv couv-dessinee type-${fiche.type} ${classe}`} aria-hidden="true" style={{ ['--aplat' as string]: teinte(fiche.id) }}>
      <span className="couv-type">{haut}</span>
      <span className="couv-titre">{fiche.titre}</span>
      <span className="couv-bas">{bas ?? ''}</span>
    </div>
  );
}
