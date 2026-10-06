import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import ModelScroll from './ModelScroll';
import PlanViewer from './PlanViewer';
import { Hero, Next, Section, tr, vectorPlan } from './Shell';
import styles from './project.module.css';

export default function EscalierSuspendu({ p, t, lang, next }: { p: Projet; t: Dict; lang: Lang; next: Projet }) {
  const img = (n: string) => p.images.find((i) => i.nom === n)!;
  const pl = (n: string) => p.plans.find((x) => x.nom === n)!;
  const L = tr(lang, {
    fr: { titre: 'Marche par marche', texte: "L'escalier se monte comme en atelier : la dalle, le limon, les marches pliées, puis le garde-corps.", steps: ['Les dalles', 'Le limon', 'Les marches, une à une', 'Barreaux et main courante'], plans: 'Plans de fabrication', plansT: 'Les plans techniques dessinés pour la fabrication : nets à toutes les échelles.', cotes: 'Cotes principales', c: ['Hauteur à franchir', 'Contremarches', 'Giron', 'Longueur du limon', 'Garde-corps du palier'], axo: 'Axonométrie', face: 'Vue de face', plan: 'Vue en plan', limon: 'Limon et marches', gc: 'Garde-corps' },
    en: { titre: 'Step by step', texte: 'The staircase is assembled as in the workshop: the slab, the stringer, the folded treads, then the balustrade.', steps: ['The slabs', 'The stringer', 'The treads, one by one', 'Balusters and handrail'], plans: 'Fabrication drawings', plansT: 'The technical drawings made for fabrication: sharp at every scale.', cotes: 'Main dimensions', c: ['Height to climb', 'Risers', 'Going', 'Stringer length', 'Landing balustrade'], axo: 'Axonometric', face: 'Front view', plan: 'Plan view', limon: 'Stringer and treads', gc: 'Balustrade' },
    it: { titre: 'Gradino dopo gradino', texte: "La scala si monta come in officina: il solaio, il cosciale, i gradini piegati, poi il parapetto.", steps: ['I solai', 'Il cosciale', 'I gradini, uno alla volta', 'Montanti e corrimano'], plans: 'Disegni di fabbricazione', plansT: 'I disegni tecnici realizzati per la fabbricazione: nitidi a ogni scala.', cotes: 'Quote principali', c: ['Dislivello', 'Alzate', 'Pedata', 'Lunghezza del cosciale', 'Parapetto del pianerottolo'], axo: 'Assonometria', face: 'Vista frontale', plan: 'Vista in pianta', limon: 'Cosciale e gradini', gc: 'Parapetto' },
  });
  const cotes = ['2 930 mm', '16 × 183 mm', '250 mm', '4 704 mm', '968 mm'];
  const axo = pl('axonometrie');
  return (
    <article>
      <Hero p={p} t={t} img={img('rendu')} />
      <section className={`wrap ${styles.textBlock}`}>
        <div>
          <p className="lead">{p.programme}.</p>
          <dl className={styles.fiche} style={{ marginTop: 24 }} aria-label={L.cotes}>
            {L.c.map((c, i) => <div key={c}><dt>{c}</dt><dd>{cotes[i]}</dd></div>)}
          </dl>
        </div>
        <div className="prose"><p>{p.texte}</p></div>
      </section>
      <ModelScroll
        scene="escalier" title={L.titre} text={L.texte} steps={L.steps} bounds={[0.12, 0.34, 0.74]} note={t.projet.maquetteNote} height={360}
        fallback={<section className={`wrap ${styles.liteGrid}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={axo.src} alt={axo.legende} loading="lazy" style={{ background: '#fff', width: '100%' }} /></section>}
      />
      <Section title={L.plans} text={L.plansT} first>
        <PlanViewer labels={{ hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset }}
          plans={[vectorPlan(pl('vue-de-face'), L.face), vectorPlan(axo, L.axo), vectorPlan(pl('vue-en-plan'), L.plan), vectorPlan(pl('planche-limon-marches'), L.limon), vectorPlan(pl('planche-garde-corps'), L.gc)]} />
      </Section>
      <Next lang={lang} t={t} next={next} />
    </article>
  );
}
