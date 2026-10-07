import { useEffect, useMemo, useState } from 'react';
import type { Fiche, Statut } from '../types';
import { STATUTS } from '../types';
import { liensDe, useBiblio } from '../contexte';
import { api, srcImage } from '../lib/api';
import { NOM_EDITEUR, NOM_TYPE, domaine, nomStatut } from '../lib/libelles';
import { FILTRES_VIDES } from '../lib/recherche';
import { Couverture } from './Couverture';
import { Icone } from './Icone';

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

export function FicheVue({ id }: { id: string }) {
  const { biblio, majFiche, retirerFiche, naviguer, notifier, setFiltres } = useBiblio();
  const fiche = biblio.fiches.find((f) => f.id === id);
  const [visionneuse, setVisionneuse] = useState<number | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const liens = useMemo(() => liensDe(biblio, id), [biblio, id]);

  // fiches qui partagent au moins deux mots-clés, pas encore liées
  const proches = useMemo(() => {
    if (!fiche) return [];
    const lies = new Set([id, ...liens.map((l) => l.fiche.id)]);
    return biblio.fiches
      .filter((f) => !lies.has(f.id))
      .map((f) => ({ f, communs: f.motsCles.filter((m) => fiche.motsCles.includes(m)) }))
      .filter((x) => x.communs.length >= 2)
      .sort((a, b) => b.communs.length - a.communs.length)
      .slice(0, 6);
  }, [biblio.fiches, fiche, id, liens]);

  if (!fiche) {
    return (
      <div className="vide">
        <p>Cette fiche n’existe plus.</p>
        <a className="bouton" href="#/">Retour à l’étagère</a>
      </div>
    );
  }

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
      // les images gardées pour la lecture hors ligne disparaissent aussi de l'appareil
      try {
        const c = await caches.open('bibliotheque-v1');
        await Promise.all(fiche!.images.map((i) => c.delete(srcImage(i.id))));
      } catch { /* pas de cache sur cet appareil */ }
      notifier('Fiche supprimée.');
      naviguer('');
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
    }
  }

  const voirMotCle = (m: string) => {
    setFiltres({ ...FILTRES_VIDES, motsCles: [m] });
    naviguer('');
  };
  const voirAuteur = (a: string) => {
    setFiltres({ ...FILTRES_VIDES, q: a });
    naviguer('');
  };

  const infos: [string, string | undefined][] = [
    ['ISBN', fiche.isbn],
    ['Numéro', fiche.numero],
    ['Pages', fiche.pages],
    ['Consulté le', fiche.consulte ? date(fiche.consulte) : undefined],
    ['Où la trouver', fiche.emplacement],
    ['Crédit des images', fiche.credit],
    ['Ajoutée le', date(fiche.creeLe)],
  ];

  return (
    <article className="fiche">
      <div className="fiche-barre">
        <a className="lien-retour mono" href="#/"><Icone nom="retour" taille={16} /> Étagère</a>
        <div className="fiche-actions">
          <a className="bouton" href={`#/modifier/${encodeURIComponent(id)}`}>Modifier</a>
          <button className="bouton danger-doux" onClick={() => setConfirmer(true)}>Supprimer</button>
        </div>
      </div>

      <div className={`fiche-grille${fiche.images.length ? '' : ' sans-image'}`}>
        <div className="fiche-images">
          {fiche.images.length > 0 ? (
            <>
              <div className="defile">
                {fiche.images.map((im, i) => (
                  <button key={im.id} className="defile-item" onClick={() => setVisionneuse(i)} aria-label={`Agrandir l’image ${i + 1}`}>
                    <img src={srcImage(im.id)} alt="" style={{ aspectRatio: `${im.w} / ${im.h}` }} />
                  </button>
                ))}
              </div>
              {fiche.images.length > 1 && <p className="mono discret defile-compte">{fiche.images.length} images — faire glisser</p>}
            </>
          ) : (
            <div className="fiche-couv-dessinee"><Couverture fiche={fiche} /></div>
          )}
        </div>

        <div className="fiche-texte">
          <p className="surtitre mono">
            {NOM_TYPE[fiche.type]}
            {fiche.annee && ` · ${fiche.annee}`}
          </p>
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
          {fiche.editeur && (
            <p className="fiche-editeur"><span className="mono discret">{NOM_EDITEUR[fiche.type]} </span>{fiche.editeur}</p>
          )}
          {fiche.source && (
            <p>
              <a className="lien-source" href={fiche.source} target="_blank" rel="noreferrer">
                <Icone nom="lien" taille={16} /> {domaine(fiche.source) || 'Source'}
              </a>
            </p>
          )}

          <div className="statut-choix" role="radiogroup" aria-label="Statut">
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

          {fiche.retenu && (
            <section className="bloc">
              <h2 className="etiquette">Ce que j’en retiens</h2>
              <p className="texte-lecture">{fiche.retenu}</p>
            </section>
          )}
          {fiche.lienTravail && (
            <section className="bloc">
              <h2 className="etiquette">Lien avec mon travail</h2>
              <p className="texte-lecture">{fiche.lienTravail}</p>
            </section>
          )}
          {fiche.citations.length > 0 && (
            <section className="bloc">
              <h2 className="etiquette">Citations</h2>
              {fiche.citations.map((c, i) => (
                <figure key={i} className="citation">
                  <blockquote>« {c.texte} »</blockquote>
                  {(c.page || c.note) && (
                    <figcaption>
                      {c.page && <span className="mono">p. {c.page}</span>}
                      {c.note && <span className="citation-note">{c.note}</span>}
                    </figcaption>
                  )}
                </figure>
              ))}
            </section>
          )}
          {fiche.motsCles.length > 0 && (
            <section className="bloc">
              <h2 className="etiquette">Mots-clés</h2>
              <div className="mots">
                {fiche.motsCles.map((m) => (
                  <button key={m} className="mot" onClick={() => voirMotCle(m)}>{m}</button>
                ))}
              </div>
            </section>
          )}
          {liens.length > 0 && (
            <section className="bloc">
              <h2 className="etiquette">Voir aussi</h2>
              <ul className="cartes">
                {liens.map(({ fiche: f, note }) => (
                  <li key={f.id}>
                    <a className="carte" href={`#/fiche/${encodeURIComponent(f.id)}`}>
                      <span className="carte-couv"><Couverture fiche={f} /></span>
                      <span>
                        <span className="carte-titre">{f.titre}</span>
                        <span className="mono discret carte-meta">{[NOM_TYPE[f.type], f.auteurs[0]].filter(Boolean).join(' · ')}</span>
                        {note && <span className="carte-note">{note}</span>}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {proches.length > 0 && (
            <section className="bloc">
              <h2 className="etiquette">Fiches proches <span className="discret">(mots-clés en commun)</span></h2>
              <ul className="cartes">
                {proches.map(({ f, communs }) => (
                  <li key={f.id} className="carte-proche">
                    <a className="carte" href={`#/fiche/${encodeURIComponent(f.id)}`}>
                      <span className="carte-couv"><Couverture fiche={f} /></span>
                      <span>
                        <span className="carte-titre">{f.titre}</span>
                        <span className="mono discret carte-meta">{communs.join(' · ')}</span>
                      </span>
                    </a>
                    <button
                      className="lien-texte"
                      onClick={() => enregistrer({ ...fiche, voirAussi: [...fiche.voirAussi, { id: f.id }] }, 'Lien ajouté.')}
                    >
                      + Relier
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <dl className="infos">
            {infos.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt className="mono">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
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

  // glisser le doigt pour changer d'image
  const [x0, setX0] = useState<number | null>(null);

  return (
    <div
      className="visionneuse"
      role="dialog"
      aria-modal="true"
      onClick={fermer}
      onTouchStart={(e) => setX0(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) setI((x) => (x + (dx < 0 ? 1 : -1) + n) % n);
        setX0(null);
      }}
    >
      <img src={srcImage(fiche.images[i].id)} alt="" onClick={(e) => e.stopPropagation()} />
      <button className="visionneuse-fermer" onClick={fermer} aria-label="Fermer"><Icone nom="fermer" taille={24} /></button>
      {n > 1 && (
        <>
          <button className="visionneuse-nav gauche" onClick={(e) => { e.stopPropagation(); setI((x) => (x - 1 + n) % n); }} aria-label="Image précédente"><Icone nom="gauche" taille={28} /></button>
          <button className="visionneuse-nav droite" onClick={(e) => { e.stopPropagation(); setI((x) => (x + 1) % n); }} aria-label="Image suivante"><Icone nom="droite" taille={28} /></button>
          <p className="visionneuse-compte mono">{i + 1} / {n}</p>
        </>
      )}
    </div>
  );
}
