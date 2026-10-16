import { DEMO } from './demo';

/**
 * Enregistre un fichier sur l'appareil.
 * Sur claude.ai, il passe par la fenêtre d'enregistrement de Claude ; sur le site, par le navigateur
 * (sur iPhone, Safari propose « Télécharger » ou le partage).
 * Rend 'ok', 'refus' (la personne a dit non) ou 'erreur'.
 */
export async function telechargerFichier(blob: Blob, nom: string): Promise<'ok' | 'refus' | 'erreur'> {
  if (DEMO) {
    const dl = await (window as any).claude?.use?.('downloads').catch(() => null);
    if (!dl) return 'erreur';
    try {
      await dl.save({ filename: nom, data: blob });
      return 'ok';
    } catch (e: any) {
      return e?.code === 'declined' ? 'refus' : 'erreur';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  return 'ok';
}
