import { Fragment, useEffect, useMemo, useState } from 'react';
import type { Fiche, Statut } from '../types';
import { STATUTS, rayonDe } from '../types';
import { classeTravail, liensDe, nomTravail, useBiblio } from '../contexte';
import { api, srcImage } from '../lib/api';
import { NOM_EDITEUR, NOM_TYPE, domaine, nomStatut } from '../lib/libelles';
import { FILTRES_VIDES } from '../lib/recherche';
import { Couverture } from './Couverture';
import { Icone } from './Icone';

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

/** Recherche web prête à l'emploi quand on n'a pas encore de lien. */
export const rechercheWeb = (f: Pick<Fiche, 'titre' | 'auteurs' | 'type' | 'editeur'>) =>
  `https://www.google.com/search?q=${encodeURIComponent([f.titre, f.auteurs[0], f.type === 'livre' ? 'livre' : f.editeur].filter(Boolean).join(' '))}`;

/** « [?] » dans mes notes : un mot à vérifier, mis en évidence. */
function EnLigne({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\[\?\]|\[[^\]]*à vérifier\])/);
  return (
    <>
      {morceaux.map((m, i) =>
        /^\[(\?|[^\]]*à vérifier)\]$/.test(m)
          ? <span key={i} className="doute" title="Mot incertain, à vérifier">{m === '[?]' ? '?' : m.slice(1, -1)}</span>
          : <Fragment key={i}>{m}</Fragment>,
      )}
    </>
  );
}

/** Mes notes en article : « ## » donne un intertitre, « - » une liste, une ligne vide sépare les paragraphes. */
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

export function FicheVue({ id }: { id: string }) {
  const { biblio, majFiche, retirerFiche, naviguer, notifier, setFiltres } = useBiblio();
  const fiche = biblio.fiches.find((f) => f.id === id);
  const [visionneuse, setVisionneuse] = useState<number | null>(null);
  const [imageActive, setImageActive] = useState(0);
  const [confirmer, setConfirmer] = useState(false);
  const liens = useMemo(() => liensDe(biblio, id), [biblio, id]);

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
  const active = Math.min(imageActive, Math.max(0, fiche.images.length - 1));

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

  const surtitre = [NOM_TYPE[fiche.type], fiche.editeur, fiche.annee].filter(Boolean).join(' · ');
  const nomLien = livre ? 'Voir le livre en ligne' : rayon === 'projets' ? 'Site du projet' : 'Ouvrir la page';
  const credit = (i: number) => fiche.images[i]?.credit || fiche.credit;

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
      {(fiche.categories ?? []).length > 0 && (
        <div className="travaux">
          {fiche.categories.map((c) => (
            <a key={c} className={`travail ${classeTravail(biblio, c)}`} href={`#/travail/${encodeURIComponent(c)}`}>{nomTravail(biblio, c)}</a>
          ))}
        </div>
      )}
      <div className="fiche-boutons">
        <div className="segments" role="radiogroup" aria-label="Statut">
          {STATUTS.map((s: Statut) => (
            <button
              key={s}
              role="radio"
              aria-checked={fiche.statut === s}
              className="pastille"
              onClick={() => fiche.statut !== s && enregistrer({ ...fiche, statut: s }, `Statut : ${nomStatut(s, fiche.type).toLowerCase()}.`)}
            >
              {nomStatut(s, fiche.type)}
            </button>
          ))}
        </div>
        <span className="separateur" aria-hidden="true" />
        {fiche.source ? (
          <a className="bouton principal" href={fiche.source} target="_blank" rel="noreferrer">
            {nomLien} <Icone nom="lien" taille={16} />
          </a>
        ) : (
          <a className="bouton" href={rechercheWeb(fiche)} target="_blank" rel="noreferrer">
            Chercher en ligne <Icone nom="lien" taille={16} />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <article className={`fiche fiche-${livre ? 'livre' : rayon === 'projets' ? 'projet' : 'article'}`}>
      <div className="fiche-haut">
        <button className="lien-retour" onClick={retour}><Icone nom="retour" taille={18} /> Retour</button>
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
          <a className="bouton petit" href={`#/modifier/${encodeURIComponent(id)}`}><Icone nom="modifier" taille={16} /> Modifier</a>
        </div>
      </div>

      {livre ? (
        <header className="fiche-tete">
          <div className="fiche-couv">
            {fiche.images.length > 0 ? (
              <button onClick={() => setVisionneuse(0)} aria-label="Agrandir la couverture">
                <img src={srcImage(fiche.images[0].id)} alt={`Couverture : ${fiche.titre}`} style={{ aspectRatio: `${fiche.images[0].w} / ${fiche.images[0].h}` }} />
              </button>
            ) : (
              <Couverture fiche={fiche} />
            )}
          </div>
          {titres}
        </header>
      ) : (
        <header className="fiche-tete">
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
          {titres}
        </header>
      )}

      <div className="fiche-corps">
        {fiche.resume && (
          <section className="bloc">
            <h2>Résumé</h2>
            <p className="resume">{fiche.resume}</p>
          </section>
        )}
        {fiche.retenu && (
          <section className="bloc">
            <h2>Mes notes</h2>
            <Notes texte={fiche.retenu} />
          </section>
        )}
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
        {liens.length > 0 && (
          <section className="bloc">
            <h2>Voir aussi</h2>
            <ul className="liens-fiche">
              {liens.map(({ fiche: f, note }) => (
                <li key={f.id}>
                  <a className="lien-fiche" href={`#/fiche/${encodeURIComponent(f.id)}`}>
                    <span className="lien-fiche-couv"><Couverture fiche={f} /></span>
                    <span>
                      <strong>{f.titre}</strong>
                      <span className="discret">{[NOM_TYPE[f.type], f.auteurs[0]].filter(Boolean).join(' · ')}</span>
                      {note && <span className="note">{note}</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
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
            {fiche.source && <div><dt>Lien</dt><dd>{domaine(fiche.source)}</dd></div>}
            {fiche.isbn && <div><dt>ISBN</dt><dd>{fiche.isbn}</dd></div>}
            {fiche.pages && <div><dt>Pages</dt><dd>{fiche.pages}</dd></div>}
            {fiche.numero && <div><dt>Numéro</dt><dd>{fiche.numero}</dd></div>}
            {!livre && fiche.editeur && <div><dt>{NOM_EDITEUR[fiche.type]}</dt><dd>{fiche.editeur}</dd></div>}
            {fiche.consulte && <div><dt>Consulté le</dt><dd>{date(fiche.consulte)}</dd></div>}
            {fiche.emplacement && <div><dt>Où la trouver</dt><dd>{fiche.emplacement}</dd></div>}
            <div><dt>Ajoutée le</dt><dd>{date(fiche.creeLe)}</dd></div>
          </dl>
          <div>
            <button className="lien-texte petit" style={{ color: 'var(--danger)' }} onClick={() => setConfirmer(true)}>Supprimer la fiche</button>
          </div>
        </footer>
      </div>

      {visionneuse !== null && <Visionneuse fiche={fiche} depart={visionneuse} fermer={() => setVisionneuse(null)} />}

      {confirmer && (
        <div className="dialogue-fond" onClick={() => setConfirmer(false)}>
          <div className="dialogue" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p>Supprimer « {fiche.titre} » ? Ses images et ses liens seront effacés aussi.</p>
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
          {fiche.source && <><br /><a href={fiche.source} target="_blank" rel="noreferrer">Source : {domaine(fiche.source)}</a></>}
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
