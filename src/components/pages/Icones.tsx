/** Icônes au trait (e-mail, téléphone, LinkedIn, Instagram), dessinées pour le site. */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IcoEmail() {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P}><rect x="3" y="5.5" width="18" height="13" rx="1" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></svg>;
}
export function IcoTel() {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P}><path d="M6.5 3.5h3l1.5 4.5-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4.5 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" /></svg>;
}
export function IcoLinkedin() {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7.5 10.5v6M7.5 7.5v.01M11 16.5v-6M11 13a2.5 2.5 0 0 1 5 0v3.5" /></svg>;
}
export function IcoInstagram() {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17 7v.01" /></svg>;
}
