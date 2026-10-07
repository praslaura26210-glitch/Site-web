const TRACES = {
  plus: 'M12 5v14M5 12h14',
  reglages: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6',
  loupe: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20',
  fermer: 'M6 6l12 12M18 6 6 18',
  retour: 'M19 12H5M11 6l-6 6 6 6',
  lien: 'M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4',
  photo: 'M4 8h3l2-3h6l2 3h3v11H4ZM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  gauche: 'M15 6l-6 6 6 6',
  droite: 'M9 6l6 6-6 6',
  bas: 'M6 9l6 6 6-6',
  coeur: 'M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z',
  accueil: 'M4 11 12 4l8 7M6 9.5V20h12V9.5',
  livre: 'M5 4.5h9.5A2.5 2.5 0 0 1 17 7v13H7.5A2.5 2.5 0 0 1 5 17.5ZM5 17.5A2.5 2.5 0 0 1 7.5 15H17',
  article: 'M6 3.5h8l4 4V20.5H6ZM14 3.5V8h4M9 12h6M9 15.5h6',
  projet: 'M3.5 20h17M5.5 20V10l6.5-5 6.5 5v10M10 20v-5h4v5',
  modifier: 'M4 20h4L19 9l-4-4L4 16ZM13.5 6.5l4 4',
  chercher: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20M8 10.5h5',
} as const;

export type NomIcone = keyof typeof TRACES;

export function Icone({ nom, taille = 20 }: { nom: NomIcone; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TRACES[nom]} />
    </svg>
  );
}
