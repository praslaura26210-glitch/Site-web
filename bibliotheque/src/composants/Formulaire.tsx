import { useEffect, useMemo, useRef, useState } from 'react';
import type { Citation, Famille, Fiche, LienWeb, TypeFiche } from '../types';
import { TYPES } from '../types';
import { classeTravail, useBiblio } from '../contexte';
import { api, srcImage } from '../lib/api';
import { compresser } from '../lib/images';
import { NOM_EDITEUR, NOM_TYPE } from '../lib/libelles';
import { DEMO } from '../lib/demo';
import { normaliser, suggerer } from '../lib/recherche';
import { estVideo } from '../lib/favoris';
import { Icone } from './Icone';
import { rechercheWeb } from './FicheVue';

export interface Preremplissage {
  source?: string;
  titre?: string;
  type?: TypeFiche;
  /** Projet ajouté depuis un livre : le livre qui le cite. */
  citeDans?: string[];
  categories?: string[];
}

interface NouveauMot {
  mot: string;
  famille: string;
  groupe: string;
}

/** Les intitulés du formulaire, dits simplement selon ce qu'on ajoute. */
const LIBELLES: Record<TypeFiche, { titre: string; auteurs: string; editeur: string; exempleEditeur: string; lien: string; images: string; aideImages: string; aideResume: string }> = {
  livre: {
    titre: 'Titre du livre', auteurs: 'Auteur(s)', editeur: 'Éditeur', exempleEditeur: 'Ex. : Terre vivante', lien: '',
    images: 'Couverture',
    aideImages: 'Une photo ou une capture d’écran de la couverture.',
    aideResume: 'De quoi parle le livre ? Quelques lignes.',
  },
  article: {
    titre: 'Titre de l’article', auteurs: 'Auteur(s)', editeur: 'Revue ou site', exempleEditeur: 'Ex. : d’architectures', lien: 'Lien vers l’article',
    images: 'Image', aideImages: 'Facultatif : une capture de l’article ou une illustration.', aideResume: 'De quoi parle l’article ?',
  },
  projet: {
    titre: 'Nom du projet', auteurs: 'Architecte(s) ou agence', editeur: 'Lieu', exempleEditeur: 'Ex. : Palma, Espagne', lien: 'Page du projet (ArchDaily, site de l’architecte…)',
    images: 'Images du projet',
    aideImages: 'La plus belle photo en premier : elle s’affiche en grand en haut de la fiche. Les suivantes (plans, coupes, façades, axonométries) s’affichent sous le texte, avec leur légende.',
    aideResume: 'Un petit texte qui explique le projet : programme, site, matériaux, ce qui le rend intéressant.',
  },
  site: {
    titre: 'Titre de la page', auteurs: 'Auteur(s)', editeur: 'Nom du site', exempleEditeur: '', lien: 'Adresse de la page',
    images: 'Image', aideImages: 'Facultatif : une capture de la page.', aideResume: 'Ce qu’on y trouve.',
  },
  video: {
    titre: 'Titre de la vidéo', auteurs: 'Réalisation ou intervenant', editeur: 'Chaîne ou plateforme', exempleEditeur: 'Ex. : YouTube, Arte', lien: 'Lien vers la vidéo',
    images: 'Image', aideImages: 'Facultatif : une capture de la vidéo.', aideResume: 'De quoi parle la vidéo ?',
  },
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);

function vierge(pre?: Preremplissage): Fiche {
  const maintenant = new Date().toISOString();
  const type: TypeFiche = pre?.type ?? (pre?.source ? (estVideo(pre.source) ? 'video' : 'site') : 'livre');
  return {
    id: crypto.randomUUID(), type, titre: pre?.titre ?? '', auteurs: [], images: [], motsCles: [], citations: [], voirAussi: [], categories: pre?.categories ?? [], citeDans: pre?.citeDans,
    statut: 'a-lire', source: pre?.source ?? '', consulte: pre?.source ? aujourdhui() : undefined, creeLe: maintenant, modifieLe: maintenant,
  };
}

const lireBrouillon = (cle: string) => {
  try { return JSON.parse(localStorage.getItem(cle) ?? 'null'); } catch { return null; }
};

export function Formulaire({ id, preremplissage }: { id?: string; preremplissage?: Preremplissage }) {
  const { biblio, majFiche, remplacer, naviguer, notifier, retour } = useBiblio();
  const existante = id ? biblio.fiches.find((f) => f.id === id) : undefined;
  const cleBrouillon = `brouillon:${id ?? 'nouvelle'}`;

  // brouillon gardé sur l'appareil : sur téléphone, ouvrir l'appareil photo peut recharger la page
  const [restaure, setRestaure] = useState(false);
  const [etat, setEtat] = useState<{ f: Fiche; nouveaux: NouveauMot[] }>(() => {
    const b = lireBrouillon(cleBrouillon);
    if (b?.f && (!id || b.f.id === id) && !preremplissage) {
      setTimeout(() => setRestaure(true));
      return b;
    }
    const f = existante ? structuredClone(existante) : vierge(preremplissage);
    f.categories ??= [];
    return { f, nouveaux: [] };
  });
  const f = etat.f;
  const [envoi, setEnvoi] = useState(false);
  const [aide, setAide] = useState<string | null>(null);
  const [cherche, setCherche] = useState<'isbn' | 'lien' | null>(null);
  const [imagesEnCours, setImagesEnCours] = useState(0);
  const [adresseImage, setAdresseImage] = useState('');

  async function imageDepuisAdresse() {
    const url = adresseImage.trim();
    if (!url) return;
    setImagesEnCours((n) => n + 1);
    try {
      const image = await api.imageDistante(url);
      const site = url.match(/^https?:\/\/(?:www\.)?([^/]+)/)?.[1];
      setEtat((e) => ({ ...e, f: { ...e.f, images: [...e.f.images, { ...image, credit: site ? `Source : ${site}` : undefined }] } }));
      setAdresseImage('');
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Image non récupérée.');
    } finally {
      setImagesEnCours((n) => n - 1);
    }
  }

  useEffect(() => {
    try { localStorage.setItem(cleBrouillon, JSON.stringify(etat)); } catch { /* sans stockage */ }
  }, [etat, cleBrouillon]);

  const oublierBrouillon = () => {
    try { localStorage.removeItem(cleBrouillon); } catch { /* rien */ }
  };

  const maj = (p: Partial<Fiche>) => setEtat((e) => ({ ...e, f: { ...e.f, ...p } }));

  const valeurs = useMemo(() => {
    const editeurs = new Set<string>();
    const emplacements = new Set<string>();
    const auteurs = new Set<string>();
    for (const x of biblio.fiches) {
      if (x.type === f.type && x.editeur) editeurs.add(x.editeur);
      if (x.emplacement) emplacements.add(x.emplacement);
      x.auteurs.forEach((a) => auteurs.add(a));
    }
    return { editeurs: [...editeurs].sort(), emplacements: [...emplacements].sort(), auteurs: [...auteurs].sort() };
  }, [biblio.fiches, f.type]);

  async function remplirIsbn() {
    if (!f.isbn?.trim()) return;
    setCherche('isbn');
    setAide(null);
    try {
      const n = await api.isbn(f.isbn);
      const remplis: string[] = [];
      const p: Partial<Fiche> = {};
      if (n.titre && !f.titre.trim()) { p.titre = n.titre; remplis.push('titre'); }
      if (n.auteurs?.length && !f.auteurs.length) { p.auteurs = n.auteurs; remplis.push('auteur'); }
      if (n.annee && !f.annee) { p.annee = n.annee; remplis.push('année'); }
      if (n.editeur && !f.editeur) { p.editeur = n.editeur; remplis.push('éditeur'); }
      if (n.pages && !f.pages) { p.pages = n.pages; remplis.push('pages'); }
      if (n.image && !f.images.length) { p.images = [n.image]; remplis.push('couverture'); }
      if (n.lien && !f.source) { p.source = n.lien; remplis.push('lien en ligne'); }
      p.couvertureCherchee = true;
      maj(p);
      setAide(remplis.length ? `Rempli : ${remplis.join(', ')}.` : 'Notice trouvée, mais les champs étaient déjà remplis.');
      if (!n.image && !f.images.length) setAide((a) => `${a} Pas de couverture trouvée : tu peux la photographier.`);
    } catch (e) {
      setAide(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setCherche(null);
    }
  }

  async function remplirLien() {
    if (!f.source?.trim()) return;
    setCherche('lien');
    setAide(null);
    try {
      const a = await api.apercu(f.source.trim());
      const p: Partial<Fiche> = {};
      const remplis: string[] = [];
      if (a.titre && !f.titre.trim()) { p.titre = a.titre; remplis.push('titre'); }
      if (a.site && !f.editeur) { p.editeur = a.site; remplis.push(NOM_EDITEUR[f.type].toLowerCase()); }
      if (a.annee && !f.annee) { p.annee = a.annee; remplis.push('année'); }
      if (a.image && !f.images.length) { p.images = [a.image]; remplis.push('image'); }
      maj(p);
      setAide(remplis.length ? `Rempli : ${remplis.join(', ')}.` : 'Rien de plus à récupérer sur cette page.');
    } catch (e) {
      setAide(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setCherche(null);
    }
  }

  async function ajouterImages(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    const liste = [...fichiers];
    setImagesEnCours((n) => n + liste.length);
    for (const fichier of liste) {
      try {
        const blob = await compresser(fichier);
        const image = await api.envoyerImage(blob);
        setEtat((e) => ({ ...e, f: { ...e.f, images: [...e.f.images, image] } }));
      } catch (e) {
        notifier(e instanceof Error ? e.message : 'Image non envoyée.');
      } finally {
        setImagesEnCours((n) => n - 1);
      }
    }
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!f.titre.trim()) {
      setAide('Il manque le titre.');
      return;
    }
    setEnvoi(true);
    try {
      if (etat.nouveaux.length) {
        const familles: Famille[] = structuredClone(biblio.familles);
        for (const n of etat.nouveaux) {
          if (!f.motsCles.includes(n.mot)) continue;
          const g = familles.find((x) => x.id === n.famille)?.groupes.find((x) => x.nom === n.groupe);
          if (g && !g.mots.includes(n.mot)) g.mots.push(n.mot);
        }
        remplacer(await api.vocabulaire({ familles }));
      }
      const r = await api.enregistrer(f);
      majFiche(r.fiche, r.rev);
      oublierBrouillon();
      notifier(existante ? 'Fiche modifiée.' : 'Fiche ajoutée.');
      naviguer(`fiche/${encodeURIComponent(preremplissage?.citeDans?.[0] ?? r.fiche.id)}`);
    } catch (err) {
      notifier(err instanceof Error ? err.message : 'Erreur.');
      setEnvoi(false);
    }
  }

  function annuler() {
    oublierBrouillon();
    retour(existante ? `fiche/${encodeURIComponent(existante.id)}` : '');
  }

  const t = f.type;
  const lienRecuperable = !DEMO && t !== 'livre' && /^https?:\/\/\S+\.\S+/.test(f.source ?? '');
  const L = LIBELLES[t];
  const nbPlus = [f.isbn, f.pages, f.numero, f.emplacement, t === 'livre' ? f.source : '', ...(f.citeDans ?? [])].filter(Boolean).length + f.motsCles.length;

  return (
    <form className="formulaire" onSubmit={enregistrer}>
      <h1 className="titre-page">{existante ? 'Modifier la fiche' : 'Nouvelle fiche'}</h1>

      {restaure && (
        <p className="aide aide-forte">
          Brouillon retrouvé sur cet appareil.{' '}
          <button type="button" className="lien-texte" onClick={() => {
            setEtat({ f: existante ? structuredClone(existante) : vierge(), nouveaux: [] });
            setRestaure(false);
          }}>Repartir de zéro</button>
        </p>
      )}

      <fieldset className="champ">
        <legend className="etiquette">C’est…</legend>
        <div className="segments">
          {TYPES.map((x) => (
            <button type="button" key={x} className="pastille" aria-pressed={t === x} onClick={() => maj({ type: x, consulte: (x === 'site' || x === 'video') && !f.consulte ? aujourdhui() : f.consulte })}>
              {NOM_TYPE[x]}
            </button>
          ))}
        </div>
      </fieldset>

      {t === 'livre' && !DEMO && (
        <div className="encadre-isbn">
          <label className="etiquette" htmlFor="isbn">Remplir automatiquement</label>
          <p className="aide">Tape l’ISBN, le numéro à 13 chiffres au dos du livre (sous le code-barres, il commence par 978). Le titre, l’auteur, l’éditeur et la couverture se remplissent seuls.</p>
          <div className="champ-ligne">
            <input
              id="isbn"
              inputMode="numeric"
              autoComplete="off"
              placeholder="978…"
              value={f.isbn ?? ''}
              onChange={(e) => maj({ isbn: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); remplirIsbn(); } }}
            />
            <button type="button" className="bouton" onClick={remplirIsbn} disabled={!f.isbn?.trim() || cherche !== null}>
              {cherche === 'isbn' ? 'Recherche…' : 'Remplir'}
            </button>
          </div>
        </div>
      )}

      {aide && <p className="aide aide-forte" role="status">{aide}</p>}

      <section className="partie">
        <h2>L’essentiel</h2>
        <div className="champ">
          <label className="etiquette" htmlFor="titre">{L.titre}</label>
          <input id="titre" className="grand" value={f.titre} onChange={(e) => maj({ titre: e.target.value })} required />
        </div>

        <div className="champ">
          <label className="etiquette" htmlFor="sous-titre">Sous-titre (facultatif)</label>
          <input id="sous-titre" value={f.sousTitre ?? ''} placeholder={t === 'projet' ? 'Ex. : Centre artisanal de la communauté de Shalalá' : ''} onChange={(e) => maj({ sousTitre: e.target.value })} />
        </div>

        <div className="champ">
          <span className="etiquette">{L.auteurs}</span>
          <ChampPuces valeurs={f.auteurs} changer={(auteurs) => maj({ auteurs })} propositions={valeurs.auteurs} placeholder="Tape un nom, puis Entrée (un nom à la fois)" />
        </div>

        <div className="champs-ligne">
          <div className="champ">
            <label className="etiquette" htmlFor="annee">Année</label>
            <input id="annee" inputMode="numeric" value={f.annee ?? ''} onChange={(e) => maj({ annee: e.target.value })} />
          </div>
          <div className="champ large">
            <label className="etiquette" htmlFor="editeur">{L.editeur}</label>
            <input id="editeur" list="liste-editeurs" placeholder={L.exempleEditeur} value={f.editeur ?? ''} onChange={(e) => maj({ editeur: e.target.value })} />
            <datalist id="liste-editeurs">{valeurs.editeurs.map((v) => <option key={v} value={v} />)}</datalist>
          </div>
        </div>

        {t !== 'livre' && (
          <div className="champ">
            <label className="etiquette" htmlFor="source">{L.lien}</label>
            <div className="champ-ligne">
              <input id="source" type="url" inputMode="url" placeholder="https://" value={f.source ?? ''} onChange={(e) => maj({ source: e.target.value })} />
              {lienRecuperable && (
                <button type="button" className="bouton" onClick={remplirLien} disabled={cherche !== null}>
                  {cherche === 'lien' ? 'Lecture…' : 'Récupérer'}
                </button>
              )}
              {f.titre.trim() && (
                <a className="bouton" href={rechercheWeb(f)} target="_blank" rel="noreferrer">
                  <Icone nom="chercher" taille={16} /> Chercher
                </a>
              )}
            </div>
            <p className="aide">
              Colle l’adresse de la page (copiée dans la barre du navigateur).
              {lienRecuperable ? ' « Récupérer » remplit le titre, l’année et l’image depuis cette page.' : ''}
            </p>
          </div>
        )}

        {(t === 'site' || t === 'video') && (
          <div className="champ etroit">
            <label className="etiquette" htmlFor="consulte">Consulté le</label>
            <input id="consulte" type="date" value={f.consulte ?? ''} onChange={(e) => maj({ consulte: e.target.value })} />
          </div>
        )}
      </section>

      <section className="partie">
        <h2>{L.images}</h2>
        <p className="aide">{L.aideImages}</p>
        <div className="images-form">
          {f.images.map((im, i) => (
            <div key={im.id} className="image-form">
              <img src={srcImage(im.id)} alt="" />
              <div className="champ">
                <label className="image-une" htmlFor={`credit-${im.id}`}>{i === 0 ? (t === 'livre' ? 'Couverture' : 'Image principale (en grand sur la fiche)') : `Image ${i + 1}`}</label>
                <input
                  id={`credit-${im.id}`}
                  placeholder={t === 'livre' ? 'Crédit (facultatif)' : 'Légende et crédit : Plan RDC, © photographe…'}
                  value={im.credit ?? ''}
                  onChange={(e) => maj({ images: f.images.map((x) => (x.id === im.id ? { ...x, credit: e.target.value } : x)) })}
                />
              </div>
              <div className="image-actions">
                {i > 0 && (
                  <button type="button" className="bouton-icone" aria-label="Mettre avant" title="Mettre avant" onClick={() => {
                    const im2 = [...f.images];
                    [im2[i - 1], im2[i]] = [im2[i], im2[i - 1]];
                    maj({ images: im2 });
                  }}><Icone nom="gauche" taille={16} /></button>
                )}
                <button type="button" className="bouton-icone" aria-label="Retirer l’image" title="Retirer l’image" onClick={() => maj({ images: f.images.filter((x) => x.id !== im.id) })}>
                  <Icone nom="fermer" taille={16} />
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: imagesEnCours }, (_, i) => <div key={`e${i}`} className="image-form en-cours"><span>Envoi de l’image…</span></div>)}
          <label className="image-ajout">
            <Icone nom="photo" taille={22} />
            <span>{f.images.length ? 'Ajouter une image' : t === 'livre' ? 'Ajouter la couverture' : 'Ajouter une image'}</span>
            <input type="file" accept="image/*" multiple onChange={(e) => { ajouterImages(e.target.files); e.target.value = ''; }} />
          </label>
          {!DEMO && (
            <>
              <div className="champ-ligne">
                <input
                  id="adresse-image"
                  type="url"
                  inputMode="url"
                  placeholder="Ou coller l’adresse d’une image trouvée en ligne"
                  value={adresseImage}
                  onChange={(e) => setAdresseImage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); imageDepuisAdresse(); } }}
                />
                <button type="button" className="bouton" onClick={imageDepuisAdresse} disabled={!adresseImage.trim() || imagesEnCours > 0}>Ajouter</button>
              </div>
              <p className="aide">Sur une page (ArchDaily, site de l’architecte…), clic droit sur l’image → « Copier l’adresse de l’image », puis colle-la ici.</p>
            </>
          )}
        </div>
      </section>

      <section className="partie">
        <h2>Contenu</h2>
        <div className="champ">
          <label className="etiquette" htmlFor="resume">{t === 'projet' ? 'Texte sur le projet' : 'Résumé'}</label>
          <textarea id="resume" className="lecture" rows={4} value={f.resume ?? ''} onChange={(e) => maj({ resume: e.target.value })} placeholder={L.aideResume} />
        </div>

        <div className="champ">
          <label className="etiquette" htmlFor="retenu">Mes notes</label>
          <textarea id="retenu" className="lecture long" rows={10} value={f.retenu ?? ''} onChange={(e) => maj({ retenu: e.target.value })} placeholder="Ce que j’en retiens, en détail." />
          <p className="aide">Une ligne vide entre deux paragraphes. « ## » au début d’une ligne pour un intertitre, « - » pour une liste, « [?] » après un mot à vérifier.</p>
        </div>

        <div className="champ">
          <span className="etiquette">Citations</span>
          <ChampCitations citations={f.citations} changer={(citations) => maj({ citations })} />
        </div>

        <div className="champ">
          <span className="etiquette">Liens utiles</span>
          <p className="aide">Une vidéo, une conférence, les plans en PDF, un entretien, un article…</p>
          <ChampLiens liens={f.liens ?? []} changer={(liens) => maj({ liens })} />
        </div>
      </section>

      <section className="partie">
        <h2>Rangement</h2>
        <div className="champ">
          <span className="etiquette">Catégorie</span>
          <p className="aide">Le travail pour lequel tu gardes cette référence : mémoire, rapport d’études, un studio, un cours.</p>
          <ChampTravaux choisis={f.categories} changer={(categories) => maj({ categories })} />
        </div>

        <div className="cases">
          {t !== 'projet' && (
            <label className="case">
              <input type="checkbox" checked={f.statut === 'lu'} onChange={(e) => maj({ statut: e.target.checked ? 'lu' : 'a-lire' })} />
              <span className="point-lu" /> Lu
            </label>
          )}
          <label className="case">
            <input type="checkbox" checked={!!f.favori} onChange={(e) => maj({ favori: e.target.checked })} />
            <Icone nom="coeur" taille={18} /> Favori
          </label>
        </div>
      </section>

      <details className="avance">
        <summary>Plus d’informations {nbPlus > 0 && <span className="discret">({nbPlus})</span>}</summary>
        <div>
          {t === 'livre' && DEMO && (
            <div className="champ">
              <label className="etiquette" htmlFor="isbn">ISBN</label>
              <input id="isbn" inputMode="numeric" autoComplete="off" placeholder="978…" value={f.isbn ?? ''} onChange={(e) => maj({ isbn: e.target.value })} />
              <p className="aide">Le numéro à 13 chiffres au dos du livre, sous le code-barres. Facultatif : il sert à identifier l’édition exacte.</p>
            </div>
          )}

          {(t === 'livre' || t === 'article') && (
            <div className="champs-ligne">
              {t === 'article' && (
                <div className="champ">
                  <label className="etiquette" htmlFor="numero">Numéro de la revue</label>
                  <input id="numero" value={f.numero ?? ''} onChange={(e) => maj({ numero: e.target.value })} />
                </div>
              )}
              <div className="champ">
                <label className="etiquette" htmlFor="pages">{t === 'livre' ? 'Nombre de pages' : 'Pages'}</label>
                <input id="pages" value={f.pages ?? ''} onChange={(e) => maj({ pages: e.target.value })} placeholder={t === 'article' ? '12-27' : ''} />
              </div>
            </div>
          )}

          {t === 'livre' && (
            <div className="champ">
              <label className="etiquette" htmlFor="source">Page du livre en ligne (éditeur, librairie)</label>
              <div className="champ-ligne">
                <input id="source" type="url" inputMode="url" placeholder="https://" value={f.source ?? ''} onChange={(e) => maj({ source: e.target.value })} />
                {f.titre.trim() && (
                  <a className="bouton" href={rechercheWeb(f)} target="_blank" rel="noreferrer"><Icone nom="chercher" taille={16} /> Chercher</a>
                )}
              </div>
            </div>
          )}

          <div className="champ">
            <label className="etiquette" htmlFor="emplacement">Où la trouver</label>
            <input id="emplacement" list="liste-emplacements" value={f.emplacement ?? ''} onChange={(e) => maj({ emplacement: e.target.value })} placeholder="Chez moi, BU ENSAG, PDF…" />
            <datalist id="liste-emplacements">{valeurs.emplacements.map((v) => <option key={v} value={v} />)}</datalist>
          </div>

          {t === 'projet' && (
            <div className="champ">
              <span className="etiquette">Présenté dans (livre ou article)</span>
              <ChampCiteDans fiche={f} changer={(citeDans) => maj({ citeDans })} />
            </div>
          )}

          <div className="champ">
            <span className="etiquette">Mots-clés pour la recherche</span>
            <p className="aide">Discrets sur la fiche ; ils servent à retrouver la fiche par thème (terre crue, réhabilitation…).</p>
            <ChampMotsCles
              choisis={f.motsCles}
              changer={(motsCles) => maj({ motsCles })}
              nouveaux={etat.nouveaux}
              ajouterNouveau={(n) => setEtat((e) => ({ f: { ...e.f, motsCles: [...e.f.motsCles, n.mot] }, nouveaux: [...e.nouveaux, n] }))}
            />
          </div>
        </div>
      </details>

      <div className="formulaire-pied">
        <button type="button" className="bouton" onClick={annuler}>Annuler</button>
        <button className="bouton principal" disabled={envoi || imagesEnCours > 0}>
          {envoi ? 'Enregistrement…' : imagesEnCours > 0 ? 'Envoi des images…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

/** Liens ajoutés à la fiche : un titre et une adresse. */
export function ChampLiens({ liens, changer }: { liens: LienWeb[]; changer: (l: LienWeb[]) => void }) {
  const majL = (i: number, p: Partial<LienWeb>) => changer(liens.map((l, k) => (k === i ? { ...l, ...p } : l)));
  return (
    <div className="liens-form">
      {liens.map((l, i) => (
        <div key={i} className="champ-ligne lien-form">
          <input className="lien-titre" placeholder="Titre : Visite en vidéo, Plans…" value={l.titre} onChange={(e) => majL(i, { titre: e.target.value })} />
          <input type="url" inputMode="url" placeholder="https://" value={l.url} onChange={(e) => majL(i, { url: e.target.value })} />
          <button type="button" className="bouton-icone" aria-label="Retirer le lien" onClick={() => changer(liens.filter((_, k) => k !== i))}>
            <Icone nom="fermer" taille={16} />
          </button>
        </div>
      ))}
      <button type="button" className="bouton" onClick={() => changer([...liens, { titre: '', url: '' }])}>
        <Icone nom="plus" taille={16} /> Ajouter un lien
      </button>
    </div>
  );
}

/** Les travaux auxquels la fiche sert ; on peut en créer un nouveau sur place. */
function ChampTravaux({ choisis, changer }: { choisis: string[]; changer: (c: string[]) => void }) {
  const { biblio, remplacer, notifier } = useBiblio();
  const [nouveau, setNouveau] = useState<string | null>(null);
  async function creer() {
    const nom = nouveau?.trim();
    setNouveau(null);
    if (!nom) return;
    const id = normaliser(nom).replace(/\s+/g, '-') || crypto.randomUUID();
    if (!biblio.categories.some((c) => c.id === id)) {
      try {
        remplacer(await api.vocabulaire({ categories: [...biblio.categories, { id, nom }] }));
      } catch (e) {
        return notifier(e instanceof Error ? e.message : 'Erreur.');
      }
    }
    if (!choisis.includes(id)) changer([...choisis, id]);
  }
  return (
    <div className="travaux">
      {biblio.categories.map((c) => (
        <button
          type="button"
          key={c.id}
          className={`travail ${classeTravail(biblio, c.id)}`}
          aria-pressed={choisis.includes(c.id)}
          onClick={() => changer(choisis.includes(c.id) ? choisis.filter((x) => x !== c.id) : [...choisis, c.id])}
        >
          {c.nom}
        </button>
      ))}
      {nouveau === null ? (
        <button type="button" className="mot" onClick={() => setNouveau('')}><Icone nom="plus" taille={14} /> Nouvelle catégorie</button>
      ) : (
        <span className="champ-ligne">
          <input
            id="nouveau-travail-form"
            autoFocus
            style={{ minHeight: 34, width: 220 }}
            placeholder="Ex. : Studio, cours expérimentation"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); creer(); }
              if (e.key === 'Escape') setNouveau(null);
            }}
          />
          <button type="button" className="bouton petit principal" onClick={creer}>Créer</button>
        </span>
      )}
    </div>
  );
}

/** Liste de valeurs en pastilles (auteurs), avec propositions. */
function ChampPuces({ valeurs, changer, propositions, placeholder }: { valeurs: string[]; changer: (v: string[]) => void; propositions: string[]; placeholder?: string }) {
  const [saisie, setSaisie] = useState('');
  const s = normaliser(saisie);
  const props = s ? propositions.filter((p) => !valeurs.includes(p) && normaliser(p).includes(s)).slice(0, 6) : [];
  const ajouter = (v: string) => {
    const x = v.trim().replace(/,$/, '');
    if (x && !valeurs.includes(x)) changer([...valeurs, x]);
    setSaisie('');
  };
  return (
    <div className="puces">
      <div className="puces-boite">
        {valeurs.map((v) => (
          <span key={v} className="mot actif">
            {v}
            <button type="button" aria-label={`Retirer ${v}`} onClick={() => changer(valeurs.filter((x) => x !== v))}><Icone nom="fermer" taille={12} /></button>
          </span>
        ))}
        <input
          value={saisie}
          placeholder={valeurs.length ? '' : placeholder}
          onChange={(e) => (e.target.value.endsWith(',') ? ajouter(e.target.value) : setSaisie(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); ajouter(props[0] && normaliser(props[0]).startsWith(s) ? props[0] : saisie); }
            if (e.key === 'Backspace' && !saisie && valeurs.length) changer(valeurs.slice(0, -1));
          }}
          onBlur={() => saisie.trim() && ajouter(saisie)}
        />
      </div>
      {props.length > 0 && (
        <div className="suggestions">
          {props.map((p) => <button type="button" key={p} onMouseDown={(e) => e.preventDefault()} onClick={() => ajouter(p)}>{p}</button>)}
        </div>
      )}
    </div>
  );
}

function ChampMotsCles({ choisis, changer, nouveaux, ajouterNouveau }: {
  choisis: string[];
  changer: (m: string[]) => void;
  nouveaux: NouveauMot[];
  ajouterNouveau: (n: NouveauMot) => void;
}) {
  const { biblio, motsCles } = useBiblio();
  const [saisie, setSaisie] = useState('');
  const [rang, setRang] = useState(0);
  const [creation, setCreation] = useState<string | null>(null);
  const [ou, setOu] = useState(() => `${biblio.familles[1]?.id ?? biblio.familles[0]?.id}|${biblio.familles[1]?.groupes[0]?.nom ?? ''}`);
  const [parcourir, setParcourir] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  const tous = useMemo(() => [...motsCles, ...nouveaux.map((n) => ({ mot: n.mot, famille: 'nouveau', groupe: '' }))], [motsCles, nouveaux]);
  const props = suggerer(saisie, tous, choisis);
  const exact = tous.find((x) => normaliser(x.mot) === normaliser(saisie));
  const options = [...props.map((p) => ({ type: 'mot' as const, ...p })), ...(saisie.trim() && !exact ? [{ type: 'creer' as const, mot: saisie.trim(), famille: '' }] : [])];

  const choisir = (o: (typeof options)[number]) => {
    if (o.type === 'creer') {
      setCreation(o.mot);
    } else {
      changer([...choisis, o.mot]);
      setSaisie('');
      setRang(0);
      champ.current?.focus();
    }
  };

  return (
    <div className="puces">
      <div className="puces-boite">
        {choisis.map((m) => (
          <span key={m} className="mot actif">
            {m}
            <button type="button" aria-label={`Retirer ${m}`} onClick={() => changer(choisis.filter((x) => x !== m))}><Icone nom="fermer" taille={12} /></button>
          </span>
        ))}
        <input
          ref={champ}
          value={saisie}
          placeholder={choisis.length ? '' : 'Taper un mot-clé…'}
          onChange={(e) => { setSaisie(e.target.value); setRang(0); setCreation(null); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setRang((r) => Math.min(r + 1, options.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setRang((r) => Math.max(r - 1, 0)); }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (exact && !choisis.includes(exact.mot)) choisir({ type: 'mot', ...exact });
              else if (options[rang]) choisir(options[rang]);
            }
            if (e.key === 'Backspace' && !saisie && choisis.length) changer(choisis.slice(0, -1));
          }}
        />
      </div>
      {options.length > 0 && !creation && (
        <div className="suggestions" role="listbox">
          {options.map((o, i) => (
            <button type="button" key={`${o.type}${o.mot}`} role="option" aria-selected={i === rang} onMouseDown={(e) => e.preventDefault()} onClick={() => choisir(o)}>
              {o.type === 'creer' ? <>Nouveau mot-clé : « {o.mot} »</> : <>{o.mot} <span className="discret">{o.famille === 'nouveau' ? 'nouveau' : o.famille}</span></>}
            </button>
          ))}
        </div>
      )}
      {creation && (
        <div className="creation-mot">
          <p className="aide">Ranger « {creation} » dans :</p>
          <div className="champ-ligne">
            <select value={ou} onChange={(e) => setOu(e.target.value)}>
              {biblio.familles.map((fam) => (
                <optgroup key={fam.id} label={fam.nom}>
                  {fam.groupes.map((g) => <option key={g.nom} value={`${fam.id}|${g.nom}`}>{fam.groupes.length > 1 ? g.nom : fam.nom}</option>)}
                </optgroup>
              ))}
            </select>
            <button type="button" className="bouton principal" onClick={() => {
              const [famille, groupe] = ou.split('|');
              ajouterNouveau({ mot: creation, famille, groupe });
              setCreation(null);
              setSaisie('');
            }}>Créer</button>
            <button type="button" className="bouton" onClick={() => setCreation(null)}>Annuler</button>
          </div>
        </div>
      )}
      <button type="button" className="lien-texte petit" onClick={() => setParcourir((p) => !p)}>
        {parcourir ? 'Fermer la liste' : 'Parcourir la liste des mots-clés'}
      </button>
      {parcourir && (
        <div className="panneau-mots dans-form">
          {biblio.familles.map((fam) => (
            <section key={fam.id} className="famille">
              <h3 className="etiquette">{fam.nom}</h3>
              {fam.groupes.map((g) => (
                <div key={g.nom} className="groupe">
                  {fam.groupes.length > 1 && <span className="groupe-nom">{g.nom}</span>}
                  <div className="mots">
                    {g.mots.map((m) => (
                      <button type="button" key={m} className={`mot${choisis.includes(m) ? ' actif' : ''}`} onClick={() => changer(choisis.includes(m) ? choisis.filter((x) => x !== m) : [...choisis, m])}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ChampCitations({ citations, changer }: { citations: Citation[]; changer: (c: Citation[]) => void }) {
  const majC = (i: number, p: Partial<Citation>) => changer(citations.map((c, k) => (k === i ? { ...c, ...p } : c)));
  return (
    <div className="citations-form">
      {citations.map((c, i) => (
        <div key={i} className="citation-form">
          <textarea rows={3} placeholder="Texte de la citation" value={c.texte} onChange={(e) => majC(i, { texte: e.target.value })} />
          <div className="champ-ligne">
            <input className="num-page" placeholder="Page" inputMode="numeric" value={c.page ?? ''} onChange={(e) => majC(i, { page: e.target.value })} />
            <input placeholder="Commentaire (facultatif)" value={c.note ?? ''} onChange={(e) => majC(i, { note: e.target.value })} />
            <button type="button" className="bouton-icone" aria-label="Retirer la citation" onClick={() => changer(citations.filter((_, k) => k !== i))}>
              <Icone nom="fermer" taille={16} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="bouton" onClick={() => changer([...citations, { texte: '' }])}>
        <Icone nom="plus" taille={16} /> Ajouter une citation
      </button>
    </div>
  );
}

/** Livres et articles qui citent ce projet. */
function ChampCiteDans({ fiche, changer }: { fiche: Fiche; changer: (ids: string[]) => void }) {
  const { biblio } = useBiblio();
  const [saisie, setSaisie] = useState('');
  const choisis = fiche.citeDans ?? [];
  const sources = biblio.fiches.filter((x) => x.type !== 'projet' && x.id !== fiche.id);
  const s = normaliser(saisie);
  const props = s ? sources.filter((x) => !choisis.includes(x.id) && normaliser(`${x.titre} ${x.auteurs.join(' ')}`).includes(s)).slice(0, 6) : [];
  return (
    <div className="puces">
      <div className="puces-boite">
        {choisis.map((id) => {
          const x = biblio.fiches.find((y) => y.id === id);
          return x ? (
            <span key={id} className="mot actif">
              {x.titre}
              <button type="button" aria-label={`Retirer ${x.titre}`} onClick={() => changer(choisis.filter((y) => y !== id))}><Icone nom="fermer" taille={12} /></button>
            </span>
          ) : null;
        })}
        <input placeholder={choisis.length ? '' : 'Chercher un livre…'} value={saisie} onChange={(e) => setSaisie(e.target.value)} />
      </div>
      {props.length > 0 && (
        <div className="suggestions">
          {props.map((x) => (
            <button type="button" key={x.id} onClick={() => { changer([...choisis, x.id]); setSaisie(''); }}>
              {x.titre} <span className="discret">{NOM_TYPE[x.type]}{x.auteurs[0] ? ` · ${x.auteurs[0]}` : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
