export type Reference = { id: string; titre: string; auteur: string; lieu: string; annee: string; credit: string; info?: string; texte?: string; w: number; h: number };

/**
 * Ce qui m'anime (À propos) : les photos des projets qui ont marqué Laura, côte à côte.
 * Un clic ouvre la photo sur place, à côté de ce qu'elle en retient (experience/anime.ts) :
 * rien ne s'ouvre par-dessus la page. Sans JavaScript, la première est ouverte.
 */
export default function Anime({ items, labels }: { items: Reference[]; labels: { ouvrir: string; auteur: string; lieu: string; annee: string } }) {
  return (
    <ul className="xp-an" data-anime>
      {items.map((x, i) => (
        <li key={x.id} data-on={i === 0 || undefined}>
          <button type="button" className="xp-an-btn" aria-expanded={i === 0} aria-controls={`an-${x.id}`} aria-label={`${labels.ouvrir} : ${x.titre}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/site/inspirations/${x.id}.webp`} alt="" width={x.w} height={x.h} loading="lazy" />
          </button>
          <div className="xp-an-txt" id={`an-${x.id}`}>
            <h3 className="xp-an-titre">{x.titre}</h3>
            {x.texte && <p className="xp-an-texte">{x.texte}</p>}
            <dl className="xp-an-dl">
              {x.auteur && <div><dt>{labels.auteur}</dt><dd>{x.auteur}</dd></div>}
              {x.lieu && <div><dt>{labels.lieu}</dt><dd>{x.lieu}</dd></div>}
              {x.annee && <div><dt>{labels.annee}</dt><dd>{x.annee}</dd></div>}
            </dl>
            {x.info && <p className="xp-an-info">{x.info}</p>}
            <p className="xp-an-credit">{x.credit}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
