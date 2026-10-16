/**
 * À propos : un appareil photo instantané d'autrefois, dessiné (façade crème et gainage brun, objectif
 * chromé, déclencheur rouge) ; par la fente sous l'objectif sortent des tirages, toujours le même portrait,
 * qui descendent doucement, sans fin (pages.module.css, .cam…).
 */
import styles from './pages.module.css';

const TIRAGES = 8;

export default function Appareil({ photo }: { photo: string }) {
  return (
    <div className={styles.cam} aria-hidden="true">
      <svg className={styles.camCorps} viewBox="0 0 340 236">
        <defs>
          <linearGradient id="cam-chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F7F7F4" /><stop offset=".45" stopColor="#B9B8B2" /><stop offset=".55" stopColor="#E4E3DE" /><stop offset="1" stopColor="#8F8E88" />
          </linearGradient>
          <radialGradient id="cam-bague" cx=".4" cy=".35" r=".7">
            <stop offset="0" stopColor="#FAFAF7" /><stop offset=".6" stopColor="#B4B3AD" /><stop offset="1" stopColor="#77766F" />
          </radialGradient>
          <radialGradient id="cam-verre" cx=".38" cy=".32" r=".75">
            <stop offset="0" stopColor="#5A6B78" /><stop offset=".35" stopColor="#25303A" /><stop offset="1" stopColor="#07090C" />
          </radialGradient>
          <pattern id="cam-cuir" width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="#4A3427" /><circle cx="1.4" cy="1.6" r=".8" fill="#3A281E" /><circle cx="3.8" cy="3.9" r=".7" fill="#56402F" />
          </pattern>
          <linearGradient id="cam-creme" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F6EFE1" /><stop offset="1" stopColor="#E4D9C3" />
          </linearGradient>
        </defs>
        {/* le dessus : le viseur et le déclencheur */}
        <rect x="226" y="4" width="66" height="26" rx="6" fill="url(#cam-chrome)" />
        <rect x="236" y="11" width="46" height="12" rx="3" fill="#1C1917" />
        <circle cx="74" cy="22" r="13" fill="url(#cam-chrome)" />
        <circle cx="74" cy="20" r="9" fill="#A8372C" />
        <ellipse cx="71" cy="17" rx="3.5" ry="2" fill="#E0857A" opacity=".7" />
        {/* le boîtier : gainage brun, bandeau crème, liseré chromé */}
        <rect x="6" y="26" width="328" height="196" rx="24" fill="url(#cam-cuir)" />
        <path d="M6 52 Q6 26 30 26 H310 Q334 26 334 52 V96 H6 Z" fill="url(#cam-creme)" />
        <rect x="6" y="95" width="328" height="3" fill="url(#cam-chrome)" />
        <rect x="6" y="26" width="328" height="196" rx="24" fill="none" stroke="#2A1C14" strokeOpacity=".35" />
        {/* la fenêtre du viseur, la cellule, le nom gravé */}
        <rect x="238" y="42" width="62" height="36" rx="7" fill="url(#cam-chrome)" />
        <rect x="243" y="47" width="52" height="26" rx="5" fill="#16181B" />
        <path d="M247 50 L262 50 L250 70 L246 70 Z" fill="#fff" opacity=".12" />
        <circle cx="62" cy="60" r="15" fill="url(#cam-chrome)" />
        <circle cx="62" cy="60" r="11" fill="#2B2A28" />
        <path d="M54 57 h16 M54 61 h16 M54 65 h16" stroke="#6B6A66" strokeWidth="1.2" />
        <text x="170" y="66" textAnchor="middle" fontFamily="Montserrat, Arial, sans-serif" fontSize="9" letterSpacing="4.5" fill="#6E5A47">LAURA PRAS</text>
        {/* l'objectif */}
        <circle cx="170" cy="138" r="70" fill="url(#cam-bague)" />
        <circle cx="170" cy="138" r="70" fill="none" stroke="#5E5D57" strokeOpacity=".5" />
        <circle cx="170" cy="138" r="60" fill="#1B1918" />
        <circle cx="170" cy="138" r="52" fill="none" stroke="url(#cam-chrome)" strokeWidth="3" />
        <circle cx="170" cy="138" r="46" fill="#0F0E0E" />
        <circle cx="170" cy="138" r="38" fill="url(#cam-verre)" />
        <circle cx="170" cy="138" r="22" fill="none" stroke="#6E8193" strokeOpacity=".25" />
        <ellipse cx="156" cy="122" rx="13" ry="8" fill="#fff" opacity=".22" transform="rotate(-30 156 122)" />
        <circle cx="186" cy="152" r="3" fill="#fff" opacity=".15" />
        {/* la fente d'où sortent les tirages */}
        <rect x="88" y="214" width="164" height="9" rx="4.5" fill="#0B0908" />
      </svg>
      <div className={styles.camSortie}>
        {/* deux fois les mêmes tirages, pour que la boucle ne se voie pas */}
        <div className={styles.camBande}>
          {Array.from({ length: TIRAGES * 2 }, (_, i) => (
            <span key={i} className={styles.camTirage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
