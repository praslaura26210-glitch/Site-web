import { IcoEmail, IcoInstagram, IcoLinkedin } from './Icones';

/** Icônes cliquables : e-mail, puis LinkedIn et Instagram quand leurs adresses sont renseignées (content/site/cv.json). */
export default function Reseaux({ cv, className, ecrire }: { cv: { email: string; linkedin?: string; instagram?: string }; className?: string; ecrire: string }) {
  const ok = (u?: string) => u && !u.startsWith('[');
  return (
    <ul className={className}>
      <li><a href={`mailto:${cv.email}`} aria-label={`${ecrire} : ${cv.email}`} title={cv.email}><IcoEmail /></a></li>
      {ok(cv.linkedin) && <li><a href={cv.linkedin} target="_blank" rel="me noopener" aria-label="LinkedIn" title="LinkedIn"><IcoLinkedin /></a></li>}
      {ok(cv.instagram) && <li><a href={cv.instagram} target="_blank" rel="me noopener" aria-label="Instagram" title="Instagram"><IcoInstagram /></a></li>}
    </ul>
  );
}
