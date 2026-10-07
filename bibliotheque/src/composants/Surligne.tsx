import { decouper } from '../lib/recherche';

/** Met en évidence les mots cherchés (accents et majuscules ignorés). */
export function Surligne({ texte, termes }: { texte: string; termes: string[] }) {
  return (
    <>
      {decouper(texte, termes).map((p, i) => (p.m ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>))}
    </>
  );
}
