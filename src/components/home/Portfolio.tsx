import type { Dict } from '@/i18n';
import { PDF_HREF } from '@/components/chrome/liens';

/** Lien de téléchargement du portfolio complet (PDF). */
export default function Portfolio({ t, long = false }: { t: Dict; long?: boolean }) {
  return (
    <a className="lien lienPdf" href={PDF_HREF} download aria-label={t.nav.pdfLong}>
      {t.footer.pdfBtn}
      {long && <span className="lienPdfInfo"> · {t.footer.pdfSize}</span>}
      <svg viewBox="0 0 12 14" width="10" height="12" aria-hidden="true"><path d="M6 1v9M2 6.5 6 10.5l4-4M1 13h10" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
    </a>
  );
}
