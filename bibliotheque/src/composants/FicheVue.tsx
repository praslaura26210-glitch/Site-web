import { Fragment, useEffect, useState } from 'react';
import type { Fiche } from '../types';
import { rayonDe } from '../types';
import { classeTravail, nomTravail, useBiblio } from '../contexte';
import { api, srcImage } from '../lib/api';
import { NOM_EDITEUR, NOM_TYPE, domaine } from '../lib/libelles';
import { FILTRES_VIDES } from '../lib/recherche';
import { Couverture } from './Couverture';
import { Icone } from './Icone';

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

/** Recherche web prête à l'emploi quand on n'a pas encore de lien. */
export const rechercheWeb = (f: Pick<Fiche, 'titre' | 'auteurs' | 'type' | 'editeur'>) =>
  `https://www.google.com/search?q=${encodeURIComponent([f.titre, f.auteurs[0], f.type === 'projet' ? 'architecture' : f.editeur].filter(Boolean).join(' '))}`;

/** « [?] » dans mes notes : un mot à vérifier, signalé discrètement. */
function EnLigne({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\[\?\]|\[[^\]]*à vérifier\])/);
  return (
    <>
      {morceaux.map((m, i) =>
        /^\[(\?|[^\]]*à vérifier)\]$/.test(m)
          ? <span key={i} className="doute" title={m === '[?]' ? 'Mot incertain, à vérifier' : m.slice(1, -1)}>?</span>
          : <Fragment key={i}>{m}</Fragment>,
      )}
    </>
  );
}

/** Mes notes : « ## » donne un intertitre, « - » une liste, une ligne vide sépare les paragraphes. */
export function Notes({ texte }: { texte: string }) {
  const blocs = texte.trim().split(/\n\s*\n/);
  return (
    <div className="notes">
      {blocs.map((b, i) => {
        const lignes = b.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lignes.length === 1 && /^#{1,3}\s/.test(lignes[0])) return <h3 key={i}><EnLigne texte={lignes[0].replace(/^#+\s*/, '')} /></h3>;
        if (lignes.every((l) => /^[-•]\s/.test(l))) {
          return <ul key={i}>{lignes.map((l, k) => <li key={k}><EnLigne texte={l.replace(/^[-•]\s*/, '')} /></li>)}</ul>;
        }
        return (
          <p key={i}>
            {lignes.map((l, k) => <Fragment key={k}>{k > 0 && <br />}<EnLigne texte={l} /></Fragment>)}
          </p>
        );
      })}
    </div>
  );
}

/** Mes notes repliées : on les déroule quand on veut les relire. */
function MesNotes({ texte }: { texte: string }) {
  const mots = texte.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(mots / 230));
  return (
    <details className="deroulant">
      <summary>
        <h2>Mes notes</h2>
        <span className="discret">{minutes} min de lecture</span>
        <span className="fleche"><Icone nom="droite" taille={20} /></span>
      </summary>
      <Notes texte={texte} />
    </details>
  );
}

export function FicheVue({ id }: { id: string }) {
  const { biblio, majFiche, retirerFiche, naviguer, notifier, setFiltres } = useBiblio();
  const fiche = biblio.fiches.find((f) => f.id === id);
  const [visionneuse, setVisionneuse] = useState<number | null>(null);
  const [imageActive, setImageActive] = useState(0);
  const [confirmer, setConfirmer] = useState(false);

  if (!fiche) {
    return (
      <div className="vide">
        <p>Cette fiche n’existe plus.</p>
        <a className="bouton" href="#/">Retour à l’accueil</a>
      </div>
    );
  }

  const rayon = rayonDe(fiche.type);
  const livre = rayon === 'livres';
  const projet = rayon === 'projets';
  const active = Math.min(imageActive, Math.max(0, fiche.images.length - 1));
  // les projets cités dans ce livre (ou cet article), et inversement les livres qui citent ce projet
  const projetsCites = biblio.fiches.filter((f) => f.citeDans?.includes(fiche.id));
  const citePar = (fiche.citeDans ?? []).map((i) => biblio.fiches.find((f) => f.id === i)).filter((f): f is Fiche => Boolean(f));

  async function enregistrer(f: Fiche, message?: string) {
    majFiche(f);
    try {
      const r = await api.enregistrer(f);
      majFiche(r.fiche, r.rev);
      if (message) notifier(message);
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
      majFiche(fiche!);
    }
  }

  async function supprimer() {
    try {
      const r = await api.supprimer(id);
      retirerFiche(id, r.rev);
      try {
        const c = await caches.open('bibliotheque-v1');
        await Promise.all(fiche!.images.map((i) => c.delete(srcImage(i.id))));
      } catch { /* pas de cache sur cet appareil */ }
      notifier('Fiche supprimée.');
      naviguer(rayon);
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
    }
  }

  const voirAuteur = (a: string) => {
    setFiltres({ ...FILTRES_VIDES, q: a });
    naviguer('');
  };
  const voirMotCle = (m: string) => {
    setFiltres({ ...FILTRES_VIDES, motsCles: [m] });
    naviguer(rayon);
  };
  const retour = () => (history.length > 1 ? history.back() : naviguer(rayon));
  const credit = (i: number) => fiche.images[i]?.credit || fiche.credit;
  const lu = fiche.statut === 'lu';

  const surtitre = projet ? [NOM_TYPE[fiche.type], fiche.annee].filter(Boolean).join(' · ') : [NOM_TYPE[fiche.type], fiche.editeur, fiche.annee].filter(Boolean).join(' · ');

  const titres = (
    <div className="fiche-titres">
      <p className="surtitre">{surtitre}</p>
      <h1 className="fiche-titre">{fiche.titre}</h1>
      {fiche.auteurs.length > 0 && (
        <p className="fiche-auteurs">
          {fiche.auteurs.map((a, i) => (
            <span key={a}>
              {i > 0 && ', '}
              <button className="lien-texte" onClick={() => voirAuteur(a)}>{a}</button>
            </span>
          ))}
        </p>
      )}
      <div className="fiche-boutons">
        {(fiche.categories ?? []).map((c) => (
          <a key={c} className={`travail ${classeTravail(biblio, c)}`} href={`#/travail/${encodeURIComponent(c)}`}>{nomTravail(biblio, c)}</a>
        ))}
        {!projet && (
          <button
            className="bascule-lu"
            aria-pressed={lu}
            onClick={() => enregistrer({ ...fiche, statut: lu ? 'a-lire' : 'lu' }, lu ? 'Marqué comme non lu.' : 'Marqué comme lu.')}
          >
            <span className="point-lu" /> {lu ? 'Lu' : 'Pas encore lu'}
          </button>
        )}
        {!livre && !projet && fiche.source && (
          <a className="lien-site" href={fiche.source} target="_blank" rel="noreferrer">Lire l’article <Icone nom="lien" taille={15} /></a>
        )}
      </div>
    </div>
  );

  const corps = (
    <>
      {fiche.resume && (
        <section className="bloc">
          <h2>Résumé</h2>
          <p className="resume">{fiche.resume}</p>
        </section>
      )}

      {!projet && (projetsCites.length > 0 || livre) && (
        <section className="bloc">
          <h2>{livre ? 'Projets du livre' : 'Projets cités'}</h2>
          <ul className={`encarts${projetsCites.length ? '' : ' vides'}`}>
            {projetsCites.map((p) => (
              <li key={p.id}>
                <a className={`encart${p.images.length ? '' : ' sans-image'}`} href={`#/fiche/${encodeURIComponent(p.id)}`}>
                  {p.images.length > 0 && <span className="carte-image"><Couverture fiche={p} /></span>}
                  <span className="carte-texte">
                    <span className="carte-titre">{p.titre}</span>
                    <span className="carte-meta"><span>{[p.auteurs[0], p.editeur].filter(Boolean).join(' · ')}</span></span>
                    {(p.resume || p.retenu) && <span className="encart-note">{(p.resume || p.retenu)!.replace(/^#+\s*/gm, '')}</span>}
                  </span>
                </a>
              </li>
            ))}
            <li>
              <a className="encart-ajout" href={`#/ajouter/projet/${encodeURIComponent(fiche.id)}`}>
                <Icone nom="plus" taille={22} />
                Ajouter un projet {livre ? 'de ce livre' : 'cité'}
              </a>
            </li>
          </ul>
        </section>
      )}

      {fiche.retenu && <MesNotes texte={fiche.retenu} />}

      {fiche.citations.length > 0 && (
        <section className="bloc">
          <h2>Citations</h2>
          {fiche.citations.map((c, i) => (
            <figure key={i} className="citation">
              <blockquote>« {c.texte} »</blockquote>
              {(c.page || c.note) && (
                <figcaption>
                  {c.page && <span>p. {c.page}</span>}
                  {c.note && <span>{c.note}</span>}
                </figcaption>
              )}
            </figure>
          ))}
        </section>
      )}

      <footer className="fiche-pied">
        <dl>
          {fiche.motsCles.length > 0 && (
            <div>
              <dt>Mots-clés</dt>
              <dd className="mots">
                {fiche.motsCles.map((m) => <button key={m} className="mot" onClick={() => voirMotCle(m)}>{m}</button>)}
              </dd>
            </div>
          )}
          {fiche.isbn && <div><dt>ISBN</dt><dd>{fiche.isbn}</dd></div>}
          {fiche.pages && <div><dt>Pages</dt><dd>{fiche.pages}</dd></div>}
          {fiche.numero && <div><dt>Numéro</dt><dd>{fiche.numero}</dd></div>}
          {fiche.consulte && <div><dt>Consulté le</dt><dd>{date(fiche.consulte)}</dd></div>}
          {fiche.emplacement && <div><dt>Où la trouver</dt><dd>{fiche.emplacement}</dd></div>}
          <div><dt>Ajoutée le</dt><dd>{date(fiche.creeLe)}</dd></div>
        </dl>
        <div>
          <button className="lien-texte petit" style={{ color: 'var(--encre-3)' }} onClick={() => setConfirmer(true)}>Supprimer la fiche</button>
        </div>
      </footer>
    </>
  );

  return (
    <article className="fiche">
      <div className="fiche-haut">
        <button className="lien-retour" onClick={retour}><Icone nom="retour" taille={17} /> Retour</button>
        <div className="fiche-actions">
          <button
            className="bouton-icone bouton-coeur"
            aria-pressed={!!fiche.favori}
            aria-label={fiche.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            title={fiche.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            onClick={() => enregistrer({ ...fiche, favori: !fiche.favori }, fiche.favori ? 'Retirée des favoris.' : 'Ajoutée aux favoris.')}
          >
            <Icone nom="coeur" />
          </button>
          <a className="bouton petit" href={`#/modifier/${encodeURIComponent(id)}`}><Icone nom="modifier" taille={15} /> Modifier</a>
        </div>
      </div>

      {livre ? (
        <div className="fiche-livre-grille">
          <div className="fiche-couv">
            {fiche.images.length > 0 ? (
              <button onClick={() => setVisionneuse(0)} aria-label="Agrandir la couverture">
                <img src={srcImage(fiche.images[0].id)} alt={`Couverture : ${fiche.titre}`} style={{ aspectRatio: `${fiche.images[0].w} / ${fiche.images[0].h}` }} />
              </button>
            ) : (
              <Couverture fiche={fiche} />
            )}
          </div>
          <div className="fiche-contenu">
            {titres}
            {corps}
          </div>
        </div>
      ) : (
        <>
          {fiche.images.length > 0 && (
            <div className="fiche-galerie">
              <button className="grande" onClick={() => setVisionneuse(active)} aria-label="Agrandir l’image et voir son crédit">
                <img src={srcImage(fiche.images[active].id)} alt="" style={{ aspectRatio: `${fiche.images[active].w} / ${fiche.images[active].h}` }} />
              </button>
              {fiche.images.length > 1 && (
                <div className="vignettes-galerie">
                  {fiche.images.map((im, i) => (
                    <button key={im.id} aria-current={i === active} aria-label={`Image ${i + 1}`} onClick={() => setImageActive(i)}>
                      <img src={srcImage(im.id)} alt="" />
                    </button>
                  ))}
                </div>
              )}
              {credit(active) && <p className="credit-image">{credit(active)}</p>}
            </div>
          )}
          <div className="fiche-projet-grille">
            <div className="fiche-contenu">
              {titres}
              {corps}
            </div>
            <dl className="infos-projet">
              {fiche.auteurs.length > 0 && <div><dt>{projet ? 'Architectes' : 'Auteur'}</dt><dd>{fiche.auteurs.join(', ')}</dd></div>}
              {fiche.editeur && <div><dt>{NOM_EDITEUR[fiche.type]}</dt><dd>{fiche.editeur}</dd></div>}
              {fiche.annee && <div><dt>Année</dt><dd>{fiche.annee}</dd></div>}
              <div>
                <dt>{projet ? 'En savoir plus' : 'Lien'}</dt>
                <dd>
                  {fiche.source ? (
                    <a href={fiche.source} target="_blank" rel="noreferrer">{projet ? 'Site du projet' : 'Ouvrir'} · {domaine(fiche.source)} ↗</a>
                  ) : (
                    <a href={rechercheWeb(fiche)} target="_blank" rel="noreferrer">Chercher en ligne ↗</a>
                  )}
                </dd>
              </div>
              {citePar.length > 0 && (
                <div>
                  <dt>Cité dans</dt>
                  <dd>{citePar.map((f, i) => <Fragment key={f.id}>{i > 0 && ', '}<a href={`#/fiche/${encodeURIComponent(f.id)}`}>{f.titre}</a></Fragment>)}</dd>
                </div>
              )}
            </dl>
          </div>
        </>
      )}

      {visionneuse !== null && <Visionneuse fiche={fiche} depart={visionneuse} fermer={() => setVisionneuse(null)} />}

      {confirmer && (
        <div className="dialogue-fond" onClick={() => setConfirmer(false)}>
          <div className="dialogue" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p>Supprimer « {fiche.titre} » ?</p>
            <span className="aide">Ses images seront effacées aussi.</span>
            <div className="dialogue-actions">
              <button className="bouton" onClick={() => setConfirmer(false)} autoFocus>Annuler</button>
              <button className="bouton danger" onClick={supprimer}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/** Image en grand, avec qui l'a faite et d'où elle vient. */
function Visionneuse({ fiche, depart, fermer }: { fiche: Fiche; depart: number; fermer: () => void }) {
  const [i, setI] = useState(depart);
  const n = fiche.images.length;
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % n);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + n) % n);
    };
    addEventListener('keydown', touche);
    document.body.style.overflow = 'hidden';
    return () => {
      removeEventListener('keydown', touche);
      document.body.style.overflow = '';
    };
  }, [fermer, n]);

  const [x0, setX0] = useState<number | null>(null);
  const credit = fiche.images[i]?.credit || fiche.credit;

  return (
    <div
      className="visionneuse"
      role="dialog"
      aria-modal="true"
      aria-label={`Image : ${fiche.titre}`}
      onClick={fermer}
      onTouchStart={(e) => setX0(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) setI((x) => (x + (dx < 0 ? 1 : -1) + n) % n);
        setX0(null);
      }}
    >
      <figure>
        <img src={srcImage(fiche.images[i].id)} alt="" onClick={(e) => e.stopPropagation()} />
        <figcaption onClick={(e) => e.stopPropagation()}>
          <strong>{fiche.titre}</strong>
          <br />{credit || 'Crédit non renseigné'}
          {fiche.source && fiche.type !== 'livre' && <><br /><a href={fiche.source} target="_blank" rel="noreferrer">Source : {domaine(fiche.source)}</a></>}
          {n > 1 && <><br />{i + 1} / {n}</>}
        </figcaption>
      </figure>
      <button className="visionneuse-fermer" onClick={fermer} aria-label="Fermer"><Icone nom="fermer" taille={24} /></button>
      {n > 1 && (
        <>
          <button className="visionneuse-nav gauche" onClick={(e) => { e.stopPropagation(); setI((x) => (x - 1 + n) % n); }} aria-label="Image précédente"><Icone nom="gauche" taille={28} /></button>
          <button className="visionneuse-nav droite" onClick={(e) => { e.stopPropagation(); setI((x) => (x + 1) % n); }} aria-label="Image suivante"><Icone nom="droite" taille={28} /></button>
        </>
      )}
    </div>
  );
}
