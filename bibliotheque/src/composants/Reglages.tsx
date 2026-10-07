import { useEffect, useMemo, useState } from 'react';
import type { Famille, Fiche } from '../types';
import { useBiblio } from '../contexte';
import { api, srcImage } from '../lib/api';
import { lireFavoris, estVideo, type Favori } from '../lib/favoris';
import { normaliser } from '../lib/recherche';
import { creerZip } from '../lib/zip';
import { Icone } from './Icone';

export function Reglages() {
  return (
    <div className="reglages">
      <h1 className="titre-page">Réglages</h1>
      <MotsCles />
      <Synonymes />
      <ImportFavoris />
      <Completer />
      <Sauvegarde />
      <Installer />
      <section className="reglage">
        <h2 className="etiquette">Session</h2>
        <button className="bouton" onClick={async () => {
          await api.deconnexion().catch(() => {});
          // les données gardées hors ligne sont effacées de l'appareil
          if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k);
          location.href = '/';
        }}>Se déconnecter de cet appareil</button>
      </section>
    </div>
  );
}

function MotsCles() {
  const { biblio, remplacer, notifier } = useBiblio();
  const [choisi, setChoisi] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [ajouts, setAjouts] = useState<Record<string, string>>({});

  const compte = useMemo(() => {
    const c = new Map<string, number>();
    for (const f of biblio.fiches) for (const m of f.motsCles) c.set(m, (c.get(m) ?? 0) + 1);
    return c;
  }, [biblio.fiches]);
  const connus = new Set(biblio.familles.flatMap((f) => f.groupes.flatMap((g) => g.mots)));
  const orphelins = [...compte.keys()].filter((m) => !connus.has(m));

  async function envoyer(familles: Famille[], renommer?: { de: string; vers: string | null }, message?: string) {
    try {
      remplacer(await api.vocabulaire({ familles, renommer }));
      if (message) notifier(message);
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
    }
  }

  const copie = () => structuredClone(biblio.familles);

  function renommer(de: string) {
    const vers = nom.trim();
    if (!vers || vers === de) return;
    const fam = copie();
    const existe = connus.has(vers);
    for (const f of fam) for (const g of f.groupes) {
      g.mots = existe ? g.mots.filter((m) => m !== de) : g.mots.map((m) => (m === de ? vers : m));
    }
    setChoisi(null);
    envoyer(fam, { de, vers }, existe ? `« ${de} » fusionné avec « ${vers} ».` : 'Mot-clé renommé.');
  }

  function supprimer(de: string) {
    const n = compte.get(de) ?? 0;
    if (n && !confirm(`Retirer « ${de} » de ${n} fiche${n > 1 ? 's' : ''} ?`)) return;
    const fam = copie();
    for (const f of fam) for (const g of f.groupes) g.mots = g.mots.filter((m) => m !== de);
    setChoisi(null);
    envoyer(fam, { de, vers: null }, 'Mot-clé supprimé.');
  }

  function deplacer(mot: string, cible: string) {
    const [fid, gnom] = cible.split('|');
    const fam = copie();
    for (const f of fam) for (const g of f.groupes) g.mots = g.mots.filter((m) => m !== mot);
    fam.find((f) => f.id === fid)?.groupes.find((g) => g.nom === gnom)?.mots.push(mot);
    setChoisi(null);
    envoyer(fam, undefined, 'Mot-clé déplacé.');
  }

  function ajouter(fid: string, gnom: string) {
    const cle = `${fid}|${gnom}`;
    const mot = (ajouts[cle] ?? '').trim();
    if (!mot) return;
    if (connus.has(mot) || [...connus].some((m) => normaliser(m) === normaliser(mot))) {
      notifier(`« ${mot} » existe déjà.`);
      return;
    }
    const fam = copie();
    fam.find((f) => f.id === fid)?.groupes.find((g) => g.nom === gnom)?.mots.push(mot);
    setAjouts((a) => ({ ...a, [cle]: '' }));
    envoyer(fam);
  }

  function nouveauGroupe(fid: string) {
    const n = prompt('Nom du nouveau groupe :')?.trim();
    if (!n) return;
    const fam = copie();
    fam.find((f) => f.id === fid)?.groupes.push({ nom: n, mots: [] });
    envoyer(fam);
  }

  const editeur = (m: string) => (
    <div className="editeur-mot">
      <input value={nom} onChange={(e) => setNom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && renommer(m)} aria-label="Nouveau nom" autoFocus />
      <button className="bouton" onClick={() => renommer(m)}>Renommer</button>
      <select value="" onChange={(e) => e.target.value && deplacer(m, e.target.value)} aria-label="Déplacer vers">
        <option value="">Déplacer vers…</option>
        {biblio.familles.map((f) => (
          <optgroup key={f.id} label={f.nom}>
            {f.groupes.map((g) => <option key={g.nom} value={`${f.id}|${g.nom}`}>{g.nom}</option>)}
          </optgroup>
        ))}
      </select>
      <button className="bouton danger-doux" onClick={() => supprimer(m)}>Supprimer</button>
      <button className="bouton-icone" onClick={() => setChoisi(null)} aria-label="Fermer"><Icone nom="fermer" taille={16} /></button>
    </div>
  );

  const puce = (m: string) => (
    <span key={m} className="mot-reglage">
      <button className={`mot${choisi === m ? ' actif' : ''}`} onClick={() => { setChoisi(choisi === m ? null : m); setNom(m); }}>
        {m} {compte.get(m) ? <span className="compte">{compte.get(m)}</span> : null}
      </button>
    </span>
  );

  return (
    <section className="reglage">
      <h2 className="etiquette">Mots-clés</h2>
      <p className="aide">Toucher un mot-clé pour le renommer, le déplacer ou le supprimer. Renommer avec un nom existant fusionne les deux.</p>
      {biblio.familles.map((f) => (
        <div key={f.id} className="famille">
          <h3 className="famille-nom">{f.nom}</h3>
          {f.groupes.map((g) => {
            const cle = `${f.id}|${g.nom}`;
            return (
              <div key={g.nom} className="groupe">
                {f.groupes.length > 1 && <span className="groupe-nom">{g.nom}</span>}
                <div className="mots">
                  {g.mots.map(puce)}
                  <span className="ajout-mot">
                    <input
                      placeholder="+ ajouter"
                      value={ajouts[cle] ?? ''}
                      onChange={(e) => setAjouts((a) => ({ ...a, [cle]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && ajouter(f.id, g.nom)}
                      onBlur={() => ajouter(f.id, g.nom)}
                      aria-label={`Ajouter un mot-clé dans ${g.nom}`}
                    />
                  </span>
                </div>
                {choisi && g.mots.includes(choisi) && editeur(choisi)}
              </div>
            );
          })}
          <button className="lien-texte petit" onClick={() => nouveauGroupe(f.id)}>+ Nouveau groupe</button>
        </div>
      ))}
      {orphelins.length > 0 && (
        <div className="famille">
          <h3 className="famille-nom">Hors liste</h3>
          <p className="aide">Utilisés dans des fiches mais absents de la liste : à ranger ou à renommer.</p>
          <div className="mots">{orphelins.map(puce)}</div>
          {choisi && orphelins.includes(choisi) && editeur(choisi)}
        </div>
      )}
    </section>
  );
}

function Synonymes() {
  const { biblio, remplacer, notifier } = useBiblio();
  const initial = biblio.synonymes.map((l) => l.join(' = ')).join('\n');
  const [texte, setTexte] = useState(initial);
  useEffect(() => setTexte(initial), [initial]);
  async function enregistrer() {
    const synonymes = texte.split('\n').map((l) => l.split('=').map((x) => x.trim()).filter(Boolean)).filter((l) => l.length > 1);
    try {
      remplacer(await api.vocabulaire({ synonymes }));
      notifier('Synonymes enregistrés.');
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
    }
  }
  return (
    <section className="reglage">
      <h2 className="etiquette">Synonymes</h2>
      <p className="aide">Une ligne par groupe, termes séparés par « = ». Chercher l’un trouve aussi les autres.</p>
      <textarea className="mono synonymes" rows={Math.min(18, texte.split('\n').length + 2)} value={texte} onChange={(e) => setTexte(e.target.value)} spellCheck={false} />
      <button className="bouton principal" onClick={enregistrer} disabled={texte === initial}>Enregistrer les synonymes</button>
    </section>
  );
}

function ImportFavoris() {
  const { biblio, motsCles, remplacer, notifier } = useBiblio();
  const [favoris, setFavoris] = useState<Favori[] | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const deja = useMemo(() => new Set(biblio.fiches.map((f) => f.source).filter(Boolean)), [biblio.fiches]);
  const nouveaux = favoris?.filter((f) => !deja.has(f.url)) ?? [];
  const dossiers = useMemo(() => {
    const c = new Map<string, number>();
    for (const f of nouveaux) {
      const d = f.dossiers.join(' › ') || '(sans dossier)';
      c.set(d, (c.get(d) ?? 0) + 1);
    }
    return [...c.entries()];
  }, [nouveaux]);

  async function lire(fichier?: File) {
    if (!fichier) return;
    setFavoris(lireFavoris(await fichier.text()));
  }

  async function importer() {
    setEnvoi(true);
    const index = new Map(motsCles.map((m) => [normaliser(m.mot), m.mot]));
    const fiches: Partial<Fiche>[] = nouveaux.map((f) => ({
      type: estVideo(f.url) ? 'video' : 'site',
      titre: f.titre,
      source: f.url,
      statut: 'a-lire',
      emplacement: ['Favoris Edge', ...f.dossiers].join(' › '),
      // un dossier qui porte le nom d'un mot-clé existant devient ce mot-clé
      motsCles: [...new Set(f.dossiers.map((d) => index.get(normaliser(d))).filter((x): x is string => Boolean(x)))],
      consulte: f.ajoute?.slice(0, 10),
      creeLe: f.ajoute,
    }));
    try {
      await api.importer(fiches);
      remplacer(await api.bibliotheque());
      notifier(`${fiches.length} fiches importées.`);
      setFavoris(null);
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="reglage">
      <h2 className="etiquette">Importer des favoris</h2>
      <p className="aide">
        Dans Edge : <code>edge://favorites</code> → menu « … » → Exporter les favoris. Choisir ensuite le fichier .html ici.
        Chaque favori devient une fiche « à voir » ; le dossier d’origine est noté dans « Où la trouver ».
      </p>
      <label className="bouton">
        Choisir le fichier
        <input type="file" accept=".html,.htm,text/html" hidden onChange={(e) => lire(e.target.files?.[0])} />
      </label>
      {favoris && (
        <div className="apercu-import">
          <p>
            {favoris.length} favoris lus, dont <strong>{nouveaux.length}</strong> nouveaux
            {favoris.length - nouveaux.length > 0 && ` (${favoris.length - nouveaux.length} déjà dans la bibliothèque)`}.
          </p>
          <ul className="mono petit-texte">
            {dossiers.map(([d, n]) => <li key={d}>{d} — {n}</li>)}
          </ul>
          <div className="dialogue-actions">
            <button className="bouton" onClick={() => setFavoris(null)}>Annuler</button>
            <button className="bouton principal" onClick={importer} disabled={envoi || !nouveaux.length}>
              {envoi ? 'Import…' : `Importer ${nouveaux.length} fiches`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Va chercher les images manquantes : couverture des livres par ISBN, image des pages web par leur lien. */
function Completer() {
  const { biblio, majFiche, notifier } = useBiblio();
  const [progres, setProgres] = useState<{ fait: number; total: number } | null>(null);
  const livres = biblio.fiches.filter((f) => !f.images.length && f.type === 'livre' && f.isbn);
  const web = biblio.fiches.filter((f) => !f.images.length && f.source && f.type !== 'livre');
  const cibles = [...livres, ...web];

  async function lancer() {
    setProgres({ fait: 0, total: cibles.length });
    let trouvees = 0;
    for (const [i, f] of cibles.entries()) {
      try {
        let maj: Fiche | null = null;
        if (f.type === 'livre') {
          const n = await api.isbn(f.isbn!);
          if (n.image) maj = { ...f, images: [n.image], annee: f.annee || n.annee, editeur: f.editeur || n.editeur, pages: f.pages || n.pages };
        } else {
          const a = await api.apercu(f.source!);
          if (a.image) maj = { ...f, images: [a.image], annee: f.annee || a.annee, editeur: f.editeur || a.site };
        }
        if (maj) {
          const r = await api.enregistrer(maj);
          majFiche(r.fiche, r.rev);
          trouvees++;
        }
      } catch { /* notice ou page introuvable : on passe */ }
      setProgres({ fait: i + 1, total: cibles.length });
    }
    setProgres(null);
    notifier(`${trouvees} image${trouvees > 1 ? 's' : ''} récupérée${trouvees > 1 ? 's' : ''} sur ${cibles.length}.`);
  }

  if (!cibles.length && !progres) return null;
  const morceaux = [
    livres.length && `${livres.length} livre${livres.length > 1 ? 's' : ''} avec ISBN sans couverture`,
    web.length && `${web.length} fiche${web.length > 1 ? 's' : ''} web sans image`,
  ].filter(Boolean);
  return (
    <section className="reglage">
      <h2 className="etiquette">Compléter les images</h2>
      <p className="aide">{morceaux.join(', ')}. Le site va chercher les couvertures (Open Library, Google Books) et les images des pages, quelques secondes par fiche.</p>
      {progres ? (
        <p className="mono">{progres.fait} / {progres.total}…</p>
      ) : (
        <button className="bouton principal" onClick={lancer}>Récupérer les images</button>
      )}
    </section>
  );
}

function Sauvegarde() {
  const { notifier } = useBiblio();
  const [envoi, setEnvoi] = useState<string | null>(null);

  const telecharger = (blob: Blob, nom: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nom;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const jour = new Date().toISOString().slice(0, 10);

  async function exporter(avecImages: boolean) {
    try {
      const b = await api.bibliotheque();
      const json = new TextEncoder().encode(JSON.stringify(b, null, 1));
      if (!avecImages) {
        telecharger(new Blob([json], { type: 'application/json' }), `bibliotheque-${jour}.json`);
        return;
      }
      const ids = [...new Set(b.fiches.flatMap((f) => f.images.map((i) => i.id)))];
      const fichiers = [{ nom: 'bibliotheque.json', data: json }];
      for (const [k, id] of ids.entries()) {
        setEnvoi(`${k + 1} / ${ids.length} images`);
        const r = await fetch(srcImage(id));
        if (!r.ok) continue;
        const ext = (r.headers.get('content-type') ?? 'image/webp').split('/')[1].replace('jpeg', 'jpg');
        fichiers.push({ nom: `images/${id}.${ext}`, data: new Uint8Array(await r.arrayBuffer()) });
      }
      telecharger(creerZip(fichiers), `bibliotheque-${jour}.zip`);
    } catch (e) {
      notifier(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setEnvoi(null);
    }
  }

  return (
    <section className="reglage">
      <h2 className="etiquette">Sauvegarde</h2>
      <p className="aide">À faire de temps en temps sur l’ordinateur : tes fiches et tes images restent à toi, même sans ce site.</p>
      <div className="champ-ligne">
        <button className="bouton principal" onClick={() => exporter(true)} disabled={envoi !== null}>{envoi ?? 'Tout exporter (.zip)'}</button>
        <button className="bouton" onClick={() => exporter(false)} disabled={envoi !== null}>Fiches seules (.json)</button>
      </div>
    </section>
  );
}

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
}

function Installer() {
  const [evt, setEvt] = useState<EvenementInstallation | null>(null);
  useEffect(() => {
    const garder = (e: Event) => { e.preventDefault(); setEvt(e as EvenementInstallation); };
    addEventListener('beforeinstallprompt', garder);
    return () => removeEventListener('beforeinstallprompt', garder);
  }, []);
  const installee = matchMedia('(display-mode: standalone)').matches;
  return (
    <section className="reglage">
      <h2 className="etiquette">Appli sur le téléphone</h2>
      {installee ? (
        <p className="aide">La bibliothèque est installée sur cet appareil.</p>
      ) : (
        <>
          <p className="aide">
            iPhone : ouvrir le site dans Safari → bouton Partager → « Sur l’écran d’accueil ».<br />
            Android : menu de Chrome (⋮) → « Installer l’application ». Une fois installée, le menu « Partager » d’Android
            propose « Bibliothèque » : un lien partagé ouvre directement une nouvelle fiche.
          </p>
          {evt && <button className="bouton principal" onClick={() => evt.prompt()}>Installer sur cet appareil</button>}
        </>
      )}
    </section>
  );
}
