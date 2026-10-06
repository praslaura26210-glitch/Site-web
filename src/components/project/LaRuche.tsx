import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import ModelScroll from './ModelScroll';
import PlanViewer from './PlanViewer';
import Reveal from './Reveal';
import { Hero, Next, Photos, Section, rasterPlan, tr } from './Shell';
import styles from './project.module.css';

const SLUG = 'la-ruche';

export default function LaRuche({ p, t, lang, next }: { p: Projet; t: Dict; lang: Lang; next: Projet }) {
  const img = (n: string) => p.images.find((i) => i.nom === n)!;
  const L = tr(lang, {
    fr: { titre: 'Sur la pente', texte: "Deux niveaux, chacun ouvert sur sa cour. Le toit se soulève pour montrer la charpente en diagonale, puis les volets pivotent pour régler la lumière.", steps: ['Sur la pente', 'La charpente en diagonale', 'Les volets rotatifs', "Vue d'ensemble"], axo: 'Axonométrie éclatée', plans: 'Les dessins', plansT: 'Plans, structure, façade et coupe scannés : la pleine définition se charge au zoom.', maquette: 'La maquette', masse: 'Plan masse', rdc: 'Plan RDC', r1: 'Plan R-1', str: 'Plan de structure', fo: 'Façade ouest', coupe: 'Coupe AA' },
    en: { titre: 'On the slope', texte: 'Two levels, each opening onto its own playground. The roof lifts to show the diagonal structure, then the shutters pivot to tune the light.', steps: ['On the slope', 'The diagonal roof structure', 'The pivoting shutters', 'Overall view'], axo: 'Exploded axonometric', plans: 'The drawings', plansT: 'Scanned plans, structure, elevation and section: full resolution loads as you zoom.', maquette: 'The model', masse: 'Site plan', rdc: 'Ground floor', r1: 'Lower floor', str: 'Structural plan', fo: 'West elevation', coupe: 'Section AA' },
    it: { titre: 'Sul pendio', texte: "Due livelli, ciascuno aperto sul proprio cortile. La copertura si solleva per mostrare l'orditura in diagonale, poi i frangisole ruotano per regolare la luce.", steps: ['Sul pendio', "L'orditura in diagonale", 'I frangisole girevoli', "Vista d'insieme"], axo: 'Assonometria esplosa', plans: 'I disegni', plansT: "Piante, struttura, prospetto e sezione scansionati: l'alta definizione si carica con lo zoom.", maquette: 'Il plastico', masse: 'Planimetria', rdc: 'Pianta piano terra', r1: 'Pianta piano -1', str: 'Pianta strutturale', fo: 'Prospetto ovest', coupe: 'Sezione AA' },
  });
  const axo = img('axonometrie-eclatee');
  return (
    <article>
      <Hero p={p} t={t} img={img('maquette-1')} />
      <section className={`wrap ${styles.textBlock}`}>
        <p className="lead">{p.programme}.</p>
        <div className="prose"><p>{p.texte}</p></div>
      </section>
      <ModelScroll
        scene="ruche" title={L.titre} text={L.texte} steps={L.steps} bounds={[0.3, 0.55, 0.85]} note={t.projet.maquetteNote} height={360}
        fallback={<section className={`wrap ${styles.liteGrid}`}><Reveal src={axo.src} srcSmall={axo.srcSmall} alt={axo.legende} w={axo.w} h={axo.h} caption={axo.legende} /></section>}
      />
      <Section title={L.axo} first>
        <div className={styles.split}>
          <Reveal src={axo.src} srcSmall={axo.srcSmall} alt={axo.legende} w={axo.w} h={axo.h} caption={axo.legende} />
          {p.poeme && <p className={styles.poeme}>{p.poeme}</p>}
        </div>
      </Section>
      <Section title={L.plans} text={L.plansT}>
        <PlanViewer labels={{ hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset }}
          plans={[rasterPlan(SLUG, img('coupe-aa'), L.coupe), rasterPlan(SLUG, img('plan-rdc'), L.rdc), rasterPlan(SLUG, img('plan-r-1'), L.r1), rasterPlan(SLUG, img('plan-structure'), L.str), rasterPlan(SLUG, img('facade-ouest'), L.fo), rasterPlan(SLUG, img('plan-masse'), L.masse)]} />
      </Section>
      <Section title={L.maquette}>
        <Photos imgs={['maquette-2', 'maquette-3', 'maquette-4', 'maquette-5'].map(img)} />
      </Section>
      <Next lang={lang} t={t} next={next} />
    </article>
  );
}
