const TRACES = {
  plus: 'M12 5v14M5 12h14',
  reglages: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6',
  loupe: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20',
  fermer: 'M6 6l12 12M18 6 6 18',
  retour: 'M19 12H5M11 6l-6 6 6 6',
  etagere: 'M4 20h16M6 20V8h3v12M10 20V5h3v15M15 20l1.5-11 3 .5L18 20',
  liste: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  lien: 'M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4',
  photo: 'M4 8h3l2-3h6l2 3h3v11H4ZM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  gauche: 'M15 6l-6 6 6 6',
  droite: 'M9 6l6 6-6 6',
  filtre: 'M4 6h16M7 12h10M10 18h4',
} as const;

export type NomIcone = keyof typeof TRACES;

export function Icone({ nom, taille = 20 }: { nom: NomIcone; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TRACES[nom]} />
    </svg>
  );
}
