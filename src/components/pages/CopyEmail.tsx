'use client';
import { useState } from 'react';
import styles from './pages.module.css';

export default function CopyEmail({ email, labels }: { email: string; labels: { copy: string; copied: string } }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setOk(true); setTimeout(() => setOk(false), 2200); } catch {}
  };
  return (
    <div className={styles.mailRow}>
      <a className={styles.mail} href={`mailto:${email}`}>{email}</a>
      <button type="button" className={styles.copy} onClick={copy} aria-live="polite">{ok ? labels.copied : labels.copy}</button>
    </div>
  );
}
