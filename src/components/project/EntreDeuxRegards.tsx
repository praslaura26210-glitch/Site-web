import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import Fiche from './Fiche';
import Volume from './Volume';
import Coupe from './Coupe';
import BeforeAfter from './BeforeAfter';
import PlanViewer from './PlanViewer';
import Reveal from './Reveal';
import Matiere from './Matiere';
import styles from './project.module.css';

const SLUG = 'entre-deux-regards';
const M = `/media/${SLUG}`;

export default function EntreDeuxRegards({ p, t, lang, next }: { p: Projet; t: Dict; lang: Lang; next: Projet }) {
  const img = (n: string) => p.images.find((i) => i.nom === n)!;
  const maq = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/projets', SLUG, 'maquette.json'), 'utf8'));
  const g = maq.plan_rdc_projet_svg;
  const usages = { fr: 'Exposition, restauration', en: 'Exhibition, dining', it: 'Esposizione, ristorazione' }[lang];
  const ext = img('perspective-exterieure'), cour = img('perspective-cour'), esc = img('perspective-escalier'), maquette = img('maquette');
  const cmp = (n: string) => `${M}/plans/comparaison/${n}.svg`;
  const pair = (id: string, label: string, e: string, pr: string) => ({ id, label, existant: cmp(e), projet: cmp(pr) });
  const L = {
    fr: { rdc: 'Plan RDC', etage: 'Plan étage', sud: 'Façade sud', nord: 'Façade nord', est: 'Façade est', ouest: 'Façade ouest', coupe: 'Coupe AA', pmE: 'Plan masse existant', pmP: 'Plan masse projet', avantTitre: 'Avant, après', avantTexte: "Les dessins de l'existant et du projet, superposés au même cadrage. Glisse le curseur pour passer de l'un à l'autre.", plansTitre: 'Lire les plans', plansTexte: 'Dessins vectoriels : ils restent nets à toutes les échelles.', rendusTitre: 'La cour et l\'escalier d\'origine' },
    en: { rdc: 'Ground floor', etage: 'First floor', sud: 'South elevation', nord: 'North elevation', est: 'East elevation', ouest: 'West elevation', coupe: 'Section AA', pmE: 'Existing site plan', pmP: 'Proposed site plan', avantTitre: 'Before, after', avantTexte: 'The drawings of the existing building and of the project, overlaid at the same framing. Drag the handle to move from one to the other.', plansTitre: 'Reading the drawings', plansTexte: 'Vector drawings: they stay sharp at every scale.', rendusTitre: 'The courtyard and the original staircase' },
    it: { rdc: 'Pianta piano terra', etage: 'Pianta piano primo', sud: 'Prospetto sud', nord: 'Prospetto nord', est: 'Prospetto est', ouest: 'Prospetto ovest', coupe: 'Sezione AA', pmE: 'Planimetria stato di fatto', pmP: 'Planimetria di progetto', avantTitre: 'Prima, dopo', avantTexte: 'I disegni dello stato di fatto e del progetto, sovrapposti con la stessa inquadratura. Trascina il cursore per passare dall\'uno all\'altro.', plansTitre: 'Leggere i disegni', plansTexte: 'Disegni vettoriali: restano nitidi a ogni scala.', rendusTitre: 'La corte e la scala originale' },
  }[lang];
  const liteFallback = (
    <section className={`wrap ${styles.liteGrid}`}>
      <p className={styles.cap} style={{ gridColumn: '1 / -1' }}>{t.projet.liteNote}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${M}/plans/plan-rdc-projet.svg`} alt={L.rdc} loading="lazy" style={{ background: '#fff', width: '100%' }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${M}/plans/coupe-aa-projet.svg`} alt={L.coupe} loading="lazy" style={{ background: '#fff', width: '100%' }} />
    </section>
  );
  return (
    <article>
      <header className={`wrap ${styles.hero}`}>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.num}>{String(p.ordre).padStart(2, '0')}</p>
            <h1 className={styles.title}>{p.titre}</h1>
            <Fiche p={p} t={t} extra={[{ label: t.projet.calqueUsages, value: usages }]} />
          </div>
          <Reveal src={ext.src} srcSmall={ext.srcSmall} alt={ext.legende} w={ext.w} h={ext.h} caption={ext.legende} className={styles.heroImg} />
        </div>
      </header>

      <section className={`wrap ${styles.textBlock}`}>
        <p className="lead">{p.programme}. {usages}.</p>
        <div className="prose"><p>{p.texte}</p></div>
      </section>

      <Volume
        fallback={liteFallback}
        labels={{
          title: t.projet.extrusionTitle,
          text: t.projet.extrusionText,
          steps: [t.projet.plans, t.projet.extrusionTitle, `${t.projet.existant} → ${t.projet.projet}`, t.projet.calqueUsages],
          existant: t.projet.existant,
          demolition: t.projet.demolition,
          exposition: t.projet.exposition,
          restauration: t.projet.restauration,
          note: t.projet.maquetteNote,
        }}
      />

      <Coupe
        fallback={null}
        planSrc={`${M}/plans/plan-rdc-projet.svg`}
        geo={{ vb: g.vb, x0: g.x0, x1: g.x1 }}
        labels={{
          title: t.projet.coupeTitle,
          text: t.projet.coupeText,
          position: t.projet.coupePosition,
          calques: t.projet.calques,
          names: { structure: t.projet.calqueStructure, demolition: t.projet.calqueDemolition, usages: t.projet.calqueUsages, lumiere: t.projet.calqueLumiere },
        }}
      />

      <section className={styles.paper}>
        <div className="wrap">
          <div className={styles.secHead}><h2>{L.avantTitre}</h2><p>{L.avantTexte}</p></div>
          <BeforeAfter
            labels={{ existant: t.projet.existant, projet: t.projet.projet, hint: t.projet.beforeAfter }}
            pairs={[
              pair('rdc', L.rdc, 'plan-rdc-existant', 'plan-rdc-projet'),
              pair('etage', L.etage, 'plan-etage-existant', 'plan-etage-projet'),
              pair('sud', L.sud, 'facade-sud-existant', 'facade-sud-projet'),
              pair('nord', L.nord, 'facade-nord-existant', 'facade-nord-projet'),
              pair('est', L.est, 'facade-est-existant', 'facade-est-projet'),
              pair('ouest', L.ouest, 'facade-ouest-existant', 'facade-ouest-projet'),
              pair('coupe', L.coupe, 'coupe-aa-existant', 'coupe-aa-projet'),
            ]}
          />
        </div>
      </section>

      <section className={styles.paper} style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className={styles.secHead}><h2>{L.plansTitre}</h2><p>{L.plansTexte}</p></div>
          <PlanViewer
            labels={{ hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset }}
            plans={[
              { id: 'pmp', label: L.pmP, svg: `${M}/plans/plan-masse-projet.svg`, preview: `${M}/images/plan-masse-projet-apercu-2400.webp`, ratio: 2400 / 1647, ko: 4437 },
              { id: 'pme', label: L.pmE, svg: `${M}/plans/plan-masse-existant.svg`, preview: `${M}/images/plan-masse-existant-apercu-2400.webp`, ratio: 2400 / 1691, ko: 4389 },
              ...p.plans.filter((x) => ['plan-rdc-projet', 'plan-etage-projet', 'coupe-aa-projet', 'facade-sud-projet'].includes(x.nom)).map((x) => ({
                id: x.nom, label: { 'plan-rdc-projet': L.rdc, 'plan-etage-projet': L.etage, 'coupe-aa-projet': L.coupe, 'facade-sud-projet': L.sud }[x.nom]!, svg: x.src, ratio: (x.w + 8) / (x.h + 8), ko: x.ko,
              })),
            ]}
          />
        </div>
      </section>

      <section className={styles.paper} style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className={styles.secHead}><h2>{L.rendusTitre}</h2><p /></div>
          <div className={styles.renders}>
            <Reveal className={styles.r1} src={cour.src} srcSmall={cour.srcSmall} alt={cour.legende} w={cour.w} h={cour.h} caption={cour.legende} />
            <Reveal className={styles.r2} src={esc.src} srcSmall={esc.srcSmall} alt={esc.legende} w={esc.w} h={esc.h} caption={esc.legende} />
          </div>
        </div>
      </section>

      <section className={styles.paper} style={{ paddingTop: 0 }}>
        <div className={`wrap ${styles.matiere}`}>
          <Matiere src={maquette.srcSmall} w={707} h={1000} alt={maquette.legende} />
          <div className={styles.recit}>
            <span className="eyebrow">{t.projet.matiereTitle} · {t.projet.matiereText}</span>
            {p.recit_titre && <h2>{p.recit_titre}</h2>}
            {p.recit && <p>« {p.recit} »</p>}
          </div>
        </div>
      </section>

      <div className="wrap">
        <Link className={styles.next} href={`/${lang}/projets/${next.slug}/`}>
          <span className="eyebrow">{t.projet.next}</span>
          <strong>{next.titre}</strong>
        </Link>
      </div>
    </article>
  );
}
