import { IcoEmail, IcoInstagram, IcoLinkedin } from './Icones';

type Cv = { email: string; linkedin?: string; instagram?: string };

/**
 * Icônes : e-mail (ouvre la messagerie), LinkedIn, Instagram.
 * Tant que les adresses LinkedIn / Instagram ne sont pas renseignées (content/site/cv.json),
 * leurs icônes sont affichées sans lien.
 */
export default function Reseaux({ cv, className, ecrire, email = true }: { cv: Cv; className?: string; ecrire: string; email?: boolean }) {
  const ok = (u?: string) => !!u && !u.startsWith('[');
  const lien = (label: string, url: string | undefined, ico: React.ReactNode) =>
    ok(url) ? <a href={url} target="_blank" rel="me noopener" aria-label={label} title={label}>{ico}</a> : <span aria-label={label} title={label} data-attente="">{ico}</span>;
  return (
    <ul className={className}>
      {email && <li><a href={`mailto:${cv.email}`} aria-label={`${ecrire} : ${cv.email}`} title={cv.email}><IcoEmail /></a></li>}
      <li>{lien('LinkedIn', cv.linkedin, <IcoLinkedin />)}</li>
      <li>{lien('Instagram', cv.instagram, <IcoInstagram />)}</li>
    </ul>
  );
}
