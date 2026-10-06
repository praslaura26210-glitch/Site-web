import type { Dict } from '@/i18n';
import type { Projet } from '@/lib/content';
import styles from './project.module.css';

export default function Fiche({ p, t, extra }: { p: Projet; t: Dict; extra?: { label: string; value: string }[] }) {
  const rows = [
    { label: t.projet.programme, value: p.programme },
    { label: t.projet.lieu, value: p.lieu },
    { label: t.projet.annee, value: p.annee ? String(p.annee) : null },
    { label: t.projet.cadre, value: p.cadre },
    { label: t.projet.surface, value: p.surface },
    { label: t.projet.enjeux, value: p.enjeux },
    ...(extra || []),
  ].filter((r) => r.value);
  return (
    <dl className={styles.fiche} aria-label={t.projet.fiche}>
      {rows.map((r) => (
        <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>
      ))}
    </dl>
  );
}
