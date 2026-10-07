import { useState } from 'react';
import { api } from '../lib/api';

export function Connexion({ configure, apres }: { configure: boolean; apres: () => void }) {
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function entrer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      await api.connexion(mdp);
      apres();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur.');
      setEnvoi(false);
    }
  }

  return (
    <div className="ecran-centre connexion">
      <form className="connexion-carte" onSubmit={entrer}>
        <p className="marque">Bibliothèque</p>
        <p className="connexion-sous">Livres, articles et références</p>
        {configure ? (
          <>
            <label className="champ">
              <span className="etiquette">Mot de passe</span>
              <input type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.target.value)} autoFocus />
            </label>
            {erreur && <p className="erreur">{erreur}</p>}
            <button className="bouton principal" disabled={envoi || !mdp}>{envoi ? 'Ouverture…' : 'Entrer'}</button>
          </>
        ) : (
          <p className="erreur">
            Le mot de passe n’est pas encore réglé. Dans Netlify : Site configuration → Environment variables → ajouter
            <code> MOT_DE_PASSE</code>, puis redéployer le site.
          </p>
        )}
      </form>
    </div>
  );
}
