/** Rejoué à chaque changement de page : le contenu arrive en montant doucement (voir experience.css). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="xp-entree">{children}</div>;
}
