import { Fragment, useEffect, useState } from 'react';
import type { Fiche, Image, Pdf } from '../types';
import { rayonDe } from '../types';
import { nomTravail, useBiblio } from '../contexte';
import { api, srcImage, srcPdf } from '../lib/api';
import { NOM_AUTEUR, NOM_EDITEUR, NOM_TYPE, domaine } from '../lib/libelles';
import { FILTRES_VIDES, normaliser, suggerer } from '../lib/recherche';
import { compresser } from '../lib/images';
import { dessinConnu, detecter } from '../lib/dessins';
import { Couverture } from './Couverture';
import { Icone } from './Icone';

const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

/** Recherche web prête à l'emploi quand on n'a pas encore de lien. */
export const rechercheWeb = (f: Pick<Fiche, 'titre' | 'auteurs' | 'type' | 'editeur'>) =>
  `https://www.google.com/search?q=${encodeURIComponent([f.titre, f.auteurs[0], f.type === 'projet' ? 'architecture' : f.editeur].filter(Boolean).join(' '))}`;

/** Ce que les notes savent de leur fiche : les images (pour les mots qui en ont) et de quoi les ouvrir. */
interface CtxNotes {
  images: { im: Image; i: number }[];
  ouvrir?: (i: number) => void;
  definitions: Map<string, string>;
}

const cleMot = (m: string) => normaliser(m);

/** Les images dont la légende parle de ce mot (« charpente » → légende « Charpente à chandelle »). */
function imagesDuMot(ctx: CtxNotes, mot: string) {
  const m = cleMot(mot);
  if (m.length < 3) return [];
  return ctx.images.filter(({ im }) => {
    const l = cleMot(im.credit ?? '');
    return l.length >= 3 && (` ${l} `.includes(` ${m} `) || ` ${m} `.includes(` ${l} `));
  });
}

/** Toutes les définitions écrites dans les notes : [[mot|définition]]. */
function lireDefinitions(texte: string) {
  const defs = new Map<string, string>();
  for (const [, mot, def] of texte.matchAll(/\[\[([^\]|]+)\|([^\]]+)\]\]/g)) defs.set(cleMot(mot), def.trim());
  return defs;
}

const MORCEAUX = /(\[\[[^\]]+\]\]|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[^*]+\*\*|\[\?\]|\[[^\]]*à vérifier\])/;

/**
 * Une ligne de notes :
 * « [?] » signale un mot à vérifier ; [[mot]] ou [[mot|définition]] fait un mot rouge qu'on touche
 * pour voir sa définition et ses images ; [texte](https://…) fait un lien ; **gras**.
 */
function EnLigne({ texte, ctx, toucher }: { texte: string; ctx?: CtxNotes; toucher?: (mot: string) => void }) {
  const morceaux = texte.split(MORCEAUX);
  return (
    <>
      {morceaux.map((m, i) => {
        if (/^\[(\?|[^\]]*à vérifier)\]$/.test(m)) return <span key={i} className="doute" title={m === '[?]' ? 'Mot incertain, à vérifier' : m.slice(1, -1)}>?</span>;
        const terme = m.match(/^\[\[([^\]|]+)(?:\|[^\]]+)?\]\]$/);
        if (terme) {
          const mot = terme[1].trim();
          return toucher ? (
            <button key={i} type="button" className={`mot-cle-notes${ctx && imagesDuMot(ctx, mot).length ? ' avec-image' : ''}`} onClick={() => toucher(mot)}>{mot}</button>
          ) : <strong key={i} className="mot-cle-notes">{mot}</strong>;
        }
        const lien = m.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
        if (lien) return <a key={i} className="lien-texte" href={lien[2]} target="_blank" rel="noreferrer">{lien[1]}</a>;
        if (/^\*\*[^*]+\*\*$/.test(m)) return <strong key={i}>{m.slice(2, -2)}</strong>;
        return <Fragment key={i}>{m}</Fragment>;
      })}
    </>
  );
}

/** Ce qui s'ouvre sous le paragraphe quand on touche un mot rouge (ou l'appareil photo d'un intertitre). */
function BulleMot({ mot, ctx, fermer }: { mot: string; ctx: CtxNotes; fermer: () => void }) {
  const def = ctx.definitions.get(cleMot(mot));
  const imgs = imagesDuMot(ctx, mot);
  return (
    <aside className="bulle-mot" aria-label={mot}>
      <div className="bulle-tete">
        <strong>{mot}</strong>
        <button type="button" className="bouton-icone" aria-label="Fermer" onClick={fermer}><Icone nom="fermer" taille={16} /></button>
      </div>
      {def && <p><EnLigne texte={def} /></p>}
      {imgs.length > 0 && (
        <ul className="bulle-images">
          {imgs.map(({ im, i }) => (
            <li key={im.id}>
              <button type="button" onClick={() => ctx.ouvrir?.(i)} aria-label={`Agrandir : ${im.credit ?? mot}`}>
                <img src={srcImage(im.id)} alt="" loading="lazy" style={{ aspectRatio: `${im.w} / ${im.h}` }} />
              </button>
              {im.credit && <span>{im.credit}</span>}
            </li>
          ))}
        </ul>
      )}
      {!def && !imgs.length && (
        <p className="discret">Pas encore d’image pour ce mot. Ajoute un scan avec le « + » sous tes notes, puis donne-lui la légende « {mot} ».</p>
      )}
    </aside>
  );
}

const ancre = (t: string) => `n-${cleMot(t).replace(/ /g, '-')}`;

/**
 * Mes notes : « ## » donne un titre, « ### » un sous-titre (un sommaire se fait tout seul),
 * « - » une liste, une ligne vide sépare les paragraphes ; voir EnLigne pour les mots rouges et les liens.
 */
export function Notes({ texte, images = [], ouvrir }: { texte: string; images?: { im: Image; i: number }[]; ouvrir?: (i: number) => void }) {
  const [ouvert, setOuvert] = useState<{ bloc: number; mot: string } | null>(null);
  const ctx: CtxNotes = { images, ouvrir, definitions: lireDefinitions(texte) };
  const blocs = texte.trim().split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((l) => l.length);
  const titre = (l: string[]) => (l.length === 1 && /^#{1,3}\s/.test(l[0]) ? { niveau: l[0].startsWith('###') ? 3 : 2, texte: l[0].replace(/^#+\s*/, '') } : null);
  const titres = blocs.map(titre).filter((t): t is { niveau: number; texte: string } => t !== null);
  const sansBalises = (t: string) => t.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').replace(/\*\*/g, '');
  const aller = (t: string) => document.getElementById(ancre(sansBalises(t)))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const bulle = (i: number) => ouvert?.bloc === i && <BulleMot mot={ouvert.mot} ctx={ctx} fermer={() => setOuvert(null)} />;
  const toucher = (i: number) => (mot: string) => setOuvert((o) => (o?.bloc === i && o.mot === mot ? null : { bloc: i, mot }));

  return (
    <div className="notes">
      {titres.length >= 3 && (
        <details className="sommaire">
          <summary><span className="sommaire-titre">Sommaire</span><span className="fleche"><Icone nom="bas" taille={18} /></span></summary>
          <ol>
            {titres.reduce<{ titre: string; sous: string[] }[]>((g, t) => {
              if (t.niveau === 3 && g.length) g[g.length - 1].sous.push(t.texte);
              else g.push({ titre: t.texte, sous: [] });
              return g;
            }, []).map((g, k) => (
              <li key={k}>
                <button type="button" className="sommaire-partie" onClick={() => aller(g.titre)}>{sansBalises(g.titre)}</button>
                {g.sous.length > 0 && (
                  <span className="sommaire-sous">
                    {g.sous.map((x, j) => <button key={j} type="button" onClick={() => aller(x)}>{sansBalises(x)}</button>)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
      {blocs.map((lignes, i) => {
        const t = titre(lignes);
        if (t) {
          const propre = sansBalises(t.texte);
          const Balise = t.niveau === 3 ? 'h4' : 'h3';
          const avecImages = imagesDuMot(ctx, propre).length > 0;
          return (
            <Fragment key={i}>
              <Balise id={ancre(propre)} className="titre-notes">
                <EnLigne texte={t.texte} ctx={ctx} toucher={toucher(i)} />
                {avecImages && (
                  <button type="button" className="bouton-icone photo-titre" aria-label={`Images : ${propre}`} title="Voir les images" onClick={() => toucher(i)(propre)}>
                    <Icone nom="photo" taille={16} />
                  </button>
                )}
              </Balise>
              {bulle(i)}
            </Fragment>
          );
        }
        if (lignes.every((l) => /^[-•]\s/.test(l))) {
          return (
            <Fragment key={i}>
              <ul>{lignes.map((l, k) => <li key={k}><EnLigne texte={l.replace(/^[-•]\s*/, '')} ctx={ctx} toucher={toucher(i)} /></li>)}</ul>
              {bulle(i)}
            </Fragment>
          );
        }
        const citation = lignes.every((l) => l.startsWith('>'));
        const contenu = lignes.map((l, k) => <Fragment key={k}>{k > 0 && <br />}<EnLigne texte={citation ? l.replace(/^>\s*/, '') : l} ctx={ctx} toucher={toucher(i)} /></Fragment>);
        return (
          <Fragment key={i}>
            {citation ? <blockquote className="citation-notes">{contenu}</blockquote> : <p>{contenu}</p>}
            {bulle(i)}
          </Fragment>
        );
      })}
    </div>
  );
}

/** Les projets présentés dans un livre : des encarts, et de quoi en ajouter un. */
function ProjetsCites({ fiche, projets }: { fiche: Fiche; projets: Fiche[] }) {
  return (
    <div className="bloc projets-cites">
      <h3 className="titre-encarts">Projets présentés{fiche.type === 'livre' ? ' dans le livre' : ''}</h3>
      <ul className={`encarts${projets.length ? '' : ' vides'}`}>
        {projets.map((p) => (
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
          <a
            className="encart-ajout encart-ajout-petit"
            href={`#/ajouter/projet/${encodeURIComponent(fiche.id)}`}
            aria-label={`Ajouter un projet présenté dans ${fiche.type === 'livre' ? 'ce livre' : 'cet article'}`}
            title={`Ajouter un projet présenté dans ${fiche.type === 'livre' ? 'ce livre' : 'cet article'}`}
          >
            <Icone nom="plus" taille={20} />
          </a>
        </li>
      </ul>
    </div>
  );
}

/** Mes notes repliées : on les déroule quand on veut les relire. Les projets du livre y sont rangés. */
function MesNotes({ fiche, projets, ouvrir, enregistrer }: { fiche: Fiche; projets: Fiche[]; ouvrir: (i: number) => void; enregistrer: (f: Fiche, m?: string) => void }) {
  const texte = fiche.retenu ?? '';
  const avecProjets = fiche.type !== 'projet';
  const livre = fiche.type === 'livre';
  // pour un livre, la première image est la couverture : les suivantes sont les scans et schémas
  const images = fiche.images.map((im, i) => ({ im, i })).filter(({ i }) => !livre || i > 0);
  return (
    <details className="deroulant">
      <summary>
        <h2>Mes notes</h2>
        <span className="discret">
          {texte ? '' : 'pas encore de notes'}
          {projets.length > 0 && `${texte ? '' : ' · '}${projets.length} projet${projets.length > 1 ? 's' : ''}`}
        </span>
        <span className="fleche"><Icone nom="droite" taille={20} /></span>
      </summary>
      <div className="deroulant-contenu">
        {texte ? <Notes texte={texte} images={images} ouvrir={ouvrir} /> : (
          <p className="discret">Pour écrire tes notes : <a className="lien-texte" href={`#/modifier/${encodeURIComponent(fiche.id)}`}>Modifier</a>.</p>
        )}
        {livre && (
          <section className="scans-notes" aria-label="Scans et schémas">
            {images.length > 0 && <h3 className="titre-encarts">Scans et schémas</h3>}
            {images.length > 0 && (
              <ul className="scans-liste">
                {images.map(({ im, i }) => (
                  <li key={im.id}>
                    <button type="button" onClick={() => ouvrir(i)} aria-label={`Agrandir : ${im.credit ?? 'scan'}`}>
                      <img src={srcImage(im.id)} alt="" loading="lazy" style={{ aspectRatio: `${im.w} / ${im.h}` }} />
                    </button>
                    <span>{im.credit || 'Sans légende'}</span>
                  </li>
                ))}
              </ul>
            )}
            {images.length > 0 && <p className="aide">Touche un scan pour l’agrandir et changer sa légende : la légende « charpente » le relie au mot « charpente » des notes.</p>}
            <AjoutImage fiche={fiche} enregistrer={enregistrer} className="ajout-scan">
              <Icone nom="plus" taille={14} /> Ajouter un scan ou un schéma
            </AjoutImage>
          </section>
        )}
        {avecProjets && projets.length > 0 && <ProjetsCites fiche={fiche} projets={projets} />}
      </div>
    </details>
  );
}

/** Liens utiles (vidéo, plans…) ; on les ajoute avec le crayon (Modifier la fiche). */
function Liens({ fiche }: { fiche: Fiche }) {
  const liens = fiche.liens ?? [];
  if (!liens.length) return null;
  return (
    <section className="bloc liens-fiche">
      <h2>Liens</h2>
      <ul>
        {liens.map((l, i) => (
          <li key={i}>
            <a href={l.url} target="_blank" rel="noreferrer">
              <span>{l.titre || domaine(l.url)}</span>
              <span className="discret">{domaine(l.url)} <Icone nom="lien" taille={14} /></span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

const poids = (o?: number) => (!o ? '' : o < 1e6 ? `${Math.max(1, Math.round(o / 1e3))} ko` : `${(o / 1e6).toFixed(1).replace('.', ',')} Mo`);

const avecPdf = (nom: string) => (/\.pdf$/i.test(nom) ? nom : `${nom}.pdf`);

/** Un PDF joint : on l'ouvre d'un clic ; le crayon le renomme, la croix le supprime (après confirmation). */
function LignePdf({ d, renommer, retirer }: { d: Pdf; renommer: (nom: string) => void; retirer: () => void }) {
  const [nom, setNom] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const affiche = d.nom.replace(/\.pdf$/i, '');
  function valider() {
    const n = (nom ?? '').trim();
    setNom(null);
    if (n && n !== affiche) renommer(avecPdf(n));
  }
  if (confirmer) {
    return (
      <li className="pdf-confirmer">
        <span>Supprimer « {affiche} » ?</span>
        <span className="actions-confirmer">
          <button className="bouton" onClick={() => setConfirmer(false)}>Annuler</button>
          <button className="bouton danger" onClick={retirer}>Supprimer</button>
        </span>
      </li>
    );
  }
  return (
    <li>
      {nom !== null ? (
        <input
          className="renommer-pdf"
          value={nom}
          autoFocus
          aria-label="Nouveau nom du PDF"
          onChange={(e) => setNom(e.target.value)}
          onBlur={valider}
          onKeyDown={(e) => { if (e.key === 'Enter') valider(); if (e.key === 'Escape') setNom(null); }}
        />
      ) : (
        <a href={srcPdf(d.id)} target="_blank" rel="noreferrer">
          <span>{affiche}</span>
          <span className="discret">PDF{d.taille ? ` · ${poids(d.taille)}` : ''}</span>
        </a>
      )}
      <span className="actions-pdf">
        <button className="bouton-icone" aria-label={`Renommer ${affiche}`} title="Renommer" onClick={() => setNom(affiche)}>
          <Icone nom="modifier" taille={16} />
        </button>
        <button className="bouton-icone" aria-label={`Supprimer ${affiche}`} title="Supprimer" onClick={() => setConfirmer(true)}>
          <Icone nom="fermer" taille={16} />
        </button>
      </span>
    </li>
  );
}

/** PDF joints (plans, dossier, article) ; on les ajoute avec le « + » des images. */
function Pdfs({ fiche, enregistrer }: { fiche: Fiche; enregistrer: (f: Fiche, m?: string) => void }) {
  const pdfs = fiche.pdfs ?? [];
  if (!pdfs.length) return null;
  return (
    <section className="bloc liens-fiche pdfs-fiche">
      <h2>Documents</h2>
      <ul>
        {pdfs.map((d) => (
          <LignePdf
            key={d.id}
            d={d}
            renommer={(nom) => enregistrer({ ...fiche, pdfs: pdfs.map((x) => (x.id === d.id ? { ...x, nom } : x)) }, 'PDF renommé.')}
            retirer={() => enregistrer({ ...fiche, pdfs: pdfs.filter((x) => x.id !== d.id) }, 'PDF supprimé.')}
          />
        ))}
      </ul>
    </section>
  );
}

const estPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);

/** Choisir des images (et, sauf pour une couverture, des PDF) sur l'appareil et les ajouter tout de suite à la fiche. */
function AjoutImage({ fiche, enregistrer, className, children, pdf = true }: { fiche: Fiche; enregistrer: (f: Fiche, m?: string) => void; className: string; children: React.ReactNode; pdf?: boolean }) {
  const { notifier } = useBiblio();
  const [envoi, setEnvoi] = useState(false);
  async function ajouter(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    setEnvoi(true);
    const nouvelles = [];
    const pdfs = [];
    for (const fichier of [...fichiers]) {
      try {
        if (pdf && estPdf(fichier)) pdfs.push(await api.envoyerPdf(fichier));
        else nouvelles.push(await api.envoyerImage(await compresser(fichier)));
      } catch (e) {
        notifier(e instanceof Error ? e.message : 'Fichier non envoyé.');
      }
    }
    setEnvoi(false);
    if (!nouvelles.length && !pdfs.length) return;
    const message = pdfs.length && nouvelles.length ? 'Images et PDF ajoutés.' : pdfs.length ? (pdfs.length > 1 ? 'PDF ajoutés.' : 'PDF ajouté.') : nouvelles.length > 1 ? 'Images ajoutées.' : 'Image ajoutée.';
    enregistrer({ ...fiche, images: [...fiche.images, ...nouvelles], pdfs: [...(fiche.pdfs ?? []), ...pdfs] }, message);
  }
  return (
    <label className={className} aria-busy={envoi}>
      {envoi ? <span>Envoi…</span> : children}
      <input type="file" accept={pdf ? 'image/*,application/pdf,.pdf' : 'image/*'} multiple hidden onChange={(e) => { ajouter(e.target.files); e.target.value = ''; }} />
    </label>
  );
}

/** Le bas de la fiche, replié : catégories, mots-clés, références, suppression. */
function Details({ fiche, enregistrer, demanderSuppression }: { fiche: Fiche; enregistrer: (f: Fiche, m?: string) => void; demanderSuppression: () => void }) {
  const { biblio, motsCles, setFiltres, naviguer } = useBiblio();
  const [mot, setMot] = useState('');
  const cats = fiche.categories ?? [];
  const libres = biblio.categories.filter((c) => !cats.includes(c.id));
  const props = suggerer(mot, motsCles, fiche.motsCles).slice(0, 5);

  const ajouterMot = (m: string) => {
    const x = m.trim();
    setMot('');
    if (!x || fiche.motsCles.some((y) => normaliser(y) === normaliser(x))) return;
    // un mot déjà dans la liste garde son orthographe
    const connu = motsCles.find((y) => normaliser(y.mot) === normaliser(x))?.mot;
    enregistrer({ ...fiche, motsCles: [...fiche.motsCles, connu ?? x] }, 'Mot-clé ajouté.');
  };

  return (
    <details className="details-fiche">
      <summary>Catégories, mots-clés et détails</summary>
      <dl>
        <div>
          <dt>Catégories</dt>
          <dd className="mots">
            {cats.map((c) => (
              <span key={c} className="mot">
                <a href={`#/travail/${encodeURIComponent(c)}`}>{nomTravail(biblio, c)}</a>
                <button type="button" aria-label={`Retirer ${nomTravail(biblio, c)}`} onClick={() => enregistrer({ ...fiche, categories: cats.filter((x) => x !== c) })}>
                  <Icone nom="fermer" taille={11} />
                </button>
              </span>
            ))}
            {libres.length > 0 && (
              <select
                id="ajout-categorie"
                className="ajout-petit"
                value=""
                aria-label="Ajouter une catégorie"
                onChange={(e) => e.target.value && enregistrer({ ...fiche, categories: [...cats, e.target.value] }, 'Catégorie ajoutée.')}
              >
                <option value="">+ catégorie</option>
                {libres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            )}
          </dd>
        </div>
        <div>
          <dt>Mots-clés</dt>
          <dd className="mots">
            {fiche.motsCles.map((m) => (
              <span key={m} className="mot">
                <button type="button" className="mot-lien" onClick={() => { setFiltres({ ...FILTRES_VIDES, motsCles: [m] }); naviguer(rayonDe(fiche.type)); }}>{m}</button>
                <button type="button" aria-label={`Retirer ${m}`} onClick={() => enregistrer({ ...fiche, motsCles: fiche.motsCles.filter((x) => x !== m) })}>
                  <Icone nom="fermer" taille={11} />
                </button>
              </span>
            ))}
            <span className="ajout-mot-fiche">
              <input
                id="ajout-mot-cle"
                className="ajout-petit"
                placeholder="+ mot-clé"
                aria-label="Ajouter un mot-clé"
                value={mot}
                onChange={(e) => setMot(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterMot(mot); } }}
              />
              {props.length > 0 && (
                <span className="suggestions petites">
                  {props.map((p) => <button type="button" key={p.mot} onMouseDown={(e) => e.preventDefault()} onClick={() => ajouterMot(p.mot)}>{p.mot}</button>)}
                </span>
              )}
            </span>
          </dd>
        </div>
        {fiche.isbn && <div><dt>ISBN</dt><dd>{fiche.isbn}</dd></div>}
        {fiche.pages && <div><dt>Pages</dt><dd>{fiche.pages}</dd></div>}
        {fiche.numero && <div><dt>Numéro</dt><dd>{fiche.numero}</dd></div>}
        {fiche.consulte && <div><dt>Consulté le</dt><dd>{date(fiche.consulte)}</dd></div>}
        {fiche.emplacement && <div><dt>Où la trouver</dt><dd>{fiche.emplacement}</dd></div>}
        <div><dt>Ajoutée le</dt><dd>{date(fiche.creeLe)}</dd></div>
      </dl>
      <button className="lien-texte petit supprimer" onClick={demanderSuppression}>Supprimer la fiche…</button>
    </details>
  );
}

export function FicheVue({ id }: { id: string }) {
  const { biblio, majFiche, retirerFiche, naviguer, notifier, retour } = useBiblio();
  const fiche = biblio.fiches.find((f) => f.id === id);
  const [visionneuse, setVisionneuse] = useState<number | null>(null);
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
  // ressource (article, podcast, exposition, vidéo) : comme un projet, sans image : infos, petit descriptif, puis mes notes
  const ressource = rayon === 'articles';
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
        const c = await caches.open('arki-v2');
        await Promise.all(fiche!.images.map((i) => c.delete(srcImage(i.id))));
      } catch { /* pas de cache sur cet appareil */ }
      notifier('Fiche supprimée.');
      naviguer(rayon);
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
    }
  }

  const voirAuteur = (a: string) => naviguer(`auteur/${encodeURIComponent(a)}`);
  const credit = (i: number) => fiche.images[i]?.credit || (i === 0 ? fiche.credit : '');
  const lu = fiche.statut === 'lu';
  const documents = fiche.images.slice(1);

  const titres = (
    <div className="fiche-titres">
      <p className="surtitre">{projet ? NOM_TYPE[fiche.type] : [NOM_TYPE[fiche.type], fiche.editeur, fiche.annee].filter(Boolean).join(' · ')}</p>
      <h1 className="fiche-titre">{fiche.titre}</h1>
      {fiche.sousTitre && <p className="fiche-sous-titre">{fiche.sousTitre}</p>}
      {fiche.auteurs.length > 0 && !projet && (
        <p className="fiche-auteurs">
          {fiche.auteurs.map((a, i) => (
            <span key={a}>
              {i > 0 && ', '}
              <button className="lien-texte" onClick={() => voirAuteur(a)}>{a}</button>
            </span>
          ))}
        </p>
      )}
      {!projet && (
        <div className="fiche-boutons">
          <button
            className="bascule-lu"
            aria-pressed={lu}
            onClick={() => enregistrer({ ...fiche, statut: lu ? 'a-lire' : 'lu' }, lu ? 'Marqué comme non lu.' : 'Marqué comme lu.')}
          >
            <span className="point-lu" /> {lu ? 'Lu' : 'Pas encore lu'}
          </button>
          {!livre && fiche.source && (
            <a className="lien-site" href={fiche.source} target="_blank" rel="noreferrer">Lire l’article <Icone nom="lien" taille={15} /></a>
          )}
        </div>
      )}
    </div>
  );

  // projet : architecte, lieu, année, sur toute la largeur sous la grande image
  const infosProjet = (projet || ressource) && (
    <dl className="infos-projet">
      {fiche.auteurs.length > 0 && (
        <div>
          <dt>{projet ? 'Architectes' : NOM_AUTEUR[fiche.type]}</dt>
          <dd>{fiche.auteurs.map((a, i) => <Fragment key={a}>{i > 0 && ', '}<button className="lien-texte nu souligne" onClick={() => voirAuteur(a)}>{a}</button></Fragment>)}</dd>
        </div>
      )}
      {fiche.editeur && <div><dt>{NOM_EDITEUR[fiche.type]}</dt><dd>{fiche.editeur}</dd></div>}
      {fiche.annee && <div><dt>Année</dt><dd>{fiche.annee}</dd></div>}
      {fiche.prix && <div><dt>Prix</dt><dd>{fiche.prix}</dd></div>}
      <div>
        <dt>{projet ? 'Site web' : 'Lien'}</dt>
        <dd>
          {fiche.source ? (
            <a href={fiche.source} target="_blank" rel="noreferrer">{domaine(fiche.source) || (projet ? 'Site du projet' : 'Ouvrir')} ↗</a>
          ) : (
            <a href={rechercheWeb(fiche)} target="_blank" rel="noreferrer">Chercher en ligne ↗</a>
          )}
        </dd>
      </div>
      {citePar.length > 0 && (
        <div>
          <dt>Présenté dans</dt>
          <dd>{citePar.map((f, i) => <Fragment key={f.id}>{i > 0 && ', '}<a href={`#/fiche/${encodeURIComponent(f.id)}`}>{f.titre}</a></Fragment>)}</dd>
        </div>
      )}
    </dl>
  );

  // la grande image (projets, articles) : on la touche pour l'agrandir, la changer, la légender
  // le site web d'un projet est avec ses informations ; pour un article, sous l'image
  const source = !livre && !projet && !ressource && fiche.source ? (
    <a className="source-image" href={fiche.source} target="_blank" rel="noreferrer">{domaine(fiche.source) || 'Source'} ↗</a>
  ) : null;
  const imagePrincipale = !livre && !(ressource && !fiche.images.length) && (fiche.images.length > 0 ? (
    <figure className="image-principale">
      <button className="grande" onClick={() => setVisionneuse(0)} aria-label="Agrandir ou modifier l’image">
        <img src={srcImage(fiche.images[0].id)} alt="" style={{ aspectRatio: `${fiche.images[0].w} / ${fiche.images[0].h}` }} />
      </button>
      <figcaption>
        <span className="credit-image">{credit(0)}</span>
        {source}
      </figcaption>
    </figure>
  ) : (
    <div className="image-principale">
      <AjoutImage fiche={fiche} enregistrer={enregistrer} className="image-a-ajouter">
        <Icone nom="photo" taille={24} />
        <span>Pas encore d’image. Touche ici pour ajouter une photo ou une capture.</span>
      </AjoutImage>
      {source && <div className="legende-image"><span />{source}</div>}
    </div>
  ));

  // plans, coupes, façades… : les images suivantes, sous le texte, qui défilent avec des flèches
  const blocDocuments = !livre && fiche.images.length > 0 && (
    <Carrousel fiche={fiche} enregistrer={enregistrer} ouvrir={(i) => setVisionneuse(i)} />
  );

  const texte = fiche.resume && (
    projet || ressource ? <p className="resume texte-projet">{fiche.resume}</p> : (
      <section className="bloc">
        <h2>Résumé</h2>
        <p className="resume">{fiche.resume}</p>
      </section>
    )
  );

  const suite = (
    <>
      <Liens fiche={fiche} />
      <Pdfs fiche={fiche} enregistrer={enregistrer} />

      {(fiche.retenu || !projet) && <MesNotes fiche={fiche} projets={projetsCites} ouvrir={(i) => setVisionneuse(i)} enregistrer={enregistrer} />}

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

      <Details fiche={fiche} enregistrer={enregistrer} demanderSuppression={() => setConfirmer(true)} />
    </>
  );

  return (
    <article className="fiche">
      <div className="fiche-haut">
        <button className="lien-retour" onClick={() => retour(rayon)}><Icone nom="retour" taille={17} /> Retour</button>
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
          <a className="bouton-icone" href={`#/modifier/${encodeURIComponent(id)}`} aria-label="Modifier la fiche" title="Modifier la fiche">
            <Icone nom="modifier" taille={19} />
          </a>
        </div>
      </div>

      {livre ? (
        <div className="fiche-livre-grille">
          <div className="fiche-couv">
            {fiche.images.length > 0 ? (
              <button onClick={() => setVisionneuse(0)} aria-label="Agrandir ou changer la couverture">
                <img src={srcImage(fiche.images[0].id)} alt={`Couverture : ${fiche.titre}`} style={{ aspectRatio: `${fiche.images[0].w} / ${fiche.images[0].h}` }} />
              </button>
            ) : (
              <AjoutImage fiche={fiche} enregistrer={enregistrer} className="couv-a-ajouter" pdf={false}>
                <Couverture fiche={fiche} />
                <span className="couv-ajout-texte"><Icone nom="photo" taille={16} /> Ajouter la couverture</span>
              </AjoutImage>
            )}
          </div>
          <div className="fiche-contenu">
            {titres}
            {texte}
            {suite}
          </div>
        </div>
      ) : (
        <div className="fiche-projet">
          <div className="fiche-contenu large">{titres}</div>
          {imagePrincipale}
          <div className={`projet-corps${projet || ressource ? '' : ' sans-infos'}`}>
            {infosProjet}
            {texte && <div className="projet-texte">{texte}</div>}
          </div>
          {blocDocuments}
          <div className="fiche-contenu">{suite}</div>
        </div>
      )}

      {visionneuse !== null && fiche.images.length > 0 && (
        <Visionneuse fiche={fiche} depart={Math.min(visionneuse, fiche.images.length - 1)} fermer={() => setVisionneuse(null)} enregistrer={enregistrer} />
      )}

      {confirmer && (
        <div className="dialogue-fond" onClick={() => setConfirmer(false)}>
          <div className="dialogue" role="alertdialog" aria-modal="true" aria-labelledby="titre-suppression" onClick={(e) => e.stopPropagation()}>
            <p id="titre-suppression">Es-tu sûre de vouloir supprimer « {fiche.titre} » ?</p>
            <span className="aide">La fiche, ses notes et ses images seront effacées définitivement.</span>
            <div className="dialogue-actions">
              <button className="bouton" onClick={() => setConfirmer(false)} autoFocus>Non, garder la fiche</button>
              <button className="bouton danger" onClick={supprimer}>Oui, supprimer</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/** Photos puis plans, coupes, façades : en quinconce, comme dans un magazine ; chaque image entière, avec sa légende. */
function Carrousel({ fiche, enregistrer, ouvrir }: { fiche: Fiche; enregistrer: (f: Fiche, m?: string) => void; ouvrir: (i: number) => void }) {
  // les photos d'abord, puis les plans, coupes et façades (reconnus tout seuls, ou indiqués)
  const [, setVu] = useState(0);
  useEffect(() => {
    let actif = true;
    detecter(fiche.images.slice(1), srcImage).then((c) => { if (c && actif) setVu((x) => x + 1); });
    return () => { actif = false; };
  }, [fiche.images]);
  const tous = fiche.images.slice(1).map((im, k) => ({ im, i: k + 1 }));
  const plan = (im: Image) => dessinConnu(im) ?? false;
  const documents = [...tous.filter((d) => !plan(d.im)), ...tous.filter((d) => plan(d.im))];
  const ajout = (
    <AjoutImage fiche={fiche} enregistrer={enregistrer} className="bouton-icone ajout-rond">
      <Icone nom="plus" taille={18} />
    </AjoutImage>
  );
  if (!documents.length) return <div className="ajout-documents" title="Ajouter une image, un plan ou un PDF">{ajout}</div>;
  return (
    <section className="documents" aria-label="Plans, coupes et documents">
      <div className="quinconce">
        {[0, 1].map((c) => (
          <ul key={c}>
            {documents.filter((_, k) => k % 2 === c).map(({ im, i }) => (
              <li key={im.id}>
                <figure>
                  <button onClick={() => ouvrir(i)} aria-label={`Agrandir : ${im.credit || `document ${i}`}`}>
                    <img src={srcImage(im.id)} alt="" loading="lazy" style={{ aspectRatio: `${im.w} / ${im.h}` }} />
                  </button>
                  {im.credit && <figcaption>{im.credit}</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <div className="ajout-documents" title="Ajouter une image, un plan ou un PDF">{ajout}</div>
    </section>
  );
}

/** Image en grand, avec sa légende ; on peut aussi la remplacer, la légender, la mettre en premier ou la retirer. */
function Visionneuse({ fiche, depart, fermer, enregistrer }: { fiche: Fiche; depart: number; fermer: () => void; enregistrer: (f: Fiche, m?: string) => void }) {
  const { notifier } = useBiblio();
  const [i, setI] = useState(depart);
  const [legende, setLegende] = useState<string | null>(null);
  const [retirer, setRetirer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const n = fiche.images.length;
  const im = fiche.images[Math.min(i, n - 1)];

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
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

  useEffect(() => { setLegende(null); setRetirer(false); }, [i]);

  const [x0, setX0] = useState<number | null>(null);
  if (!im) return null;
  const credit = im.credit || (i === 0 ? fiche.credit : '');
  const images = (liste: Fiche['images'], message: string) => enregistrer({ ...fiche, images: liste }, message);

  async function remplacer(fichiers: FileList | null) {
    const fichier = fichiers?.[0];
    if (!fichier) return;
    setEnvoi(true);
    try {
      const nouvelle = await api.envoyerImage(await compresser(fichier));
      images(fiche.images.map((x) => (x.id === im.id ? nouvelle : x)), 'Image remplacée.');
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Image non envoyée.');
    } finally {
      setEnvoi(false);
    }
  }

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
        <img src={srcImage(im.id)} alt="" onClick={(e) => e.stopPropagation()} />
        <figcaption onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          {legende === null ? (
            <span>{credit || <span className="discret-clair">Sans légende</span>}{n > 1 && <> · {i + 1} / {n}</>}</span>
          ) : (
            <span className="champ-ligne edition-legende">
              <input autoFocus value={legende} placeholder="Plan RDC, © photographe…" onChange={(e) => setLegende(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { images(fiche.images.map((x) => (x.id === im.id ? { ...x, credit: legende.trim() || undefined } : x)), 'Légende enregistrée.'); setLegende(null); }
                  if (e.key === 'Escape') setLegende(null);
                }} />
              <button className="bouton petit principal" onClick={() => { images(fiche.images.map((x) => (x.id === im.id ? { ...x, credit: legende.trim() || undefined } : x)), 'Légende enregistrée.'); setLegende(null); }}>OK</button>
            </span>
          )}
          {fiche.source && fiche.type !== 'livre' && legende === null && <a href={fiche.source} target="_blank" rel="noreferrer">Source : {domaine(fiche.source)}</a>}
          <span className="actions-visionneuse">
            {retirer ? (
              <>
                <span>Retirer cette image ?</span>
                <button onClick={() => { images(fiche.images.filter((x) => x.id !== im.id), 'Image retirée.'); if (n === 1) fermer(); else setI(Math.max(0, i - 1)); }}>Oui, retirer</button>
                <button onClick={() => setRetirer(false)}>Non</button>
              </>
            ) : (
              <>
                <label className={envoi ? 'occupe' : ''}>
                  {envoi ? 'Envoi…' : 'Remplacer'}
                  <input type="file" accept="image/*" hidden onChange={(e) => { remplacer(e.target.files); e.target.value = ''; }} />
                </label>
                <button onClick={() => setLegende(im.credit ?? '')}>Légende</button>
                {fiche.type !== 'livre' && (
                  <button onClick={() => images(fiche.images.map((x) => (x.id === im.id ? { ...x, dessin: !(dessinConnu(x) ?? false) } : x)), dessinConnu(im) ? 'Rangée avec les photos.' : 'Rangée avec les plans.')}>
                    {dessinConnu(im) ? 'C’est une photo' : 'C’est un plan'}
                  </button>
                )}
                {i > 0 && <button onClick={() => { images([im, ...fiche.images.filter((x) => x.id !== im.id)], 'Image mise en premier.'); setI(0); }}>Mettre en premier</button>}
                <button onClick={() => setRetirer(true)}>Retirer</button>
              </>
            )}
          </span>
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
