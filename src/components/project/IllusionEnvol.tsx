import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import Croquis from './Croquis';
import ModelScroll from './ModelScroll';
import PlanViewer from './PlanViewer';
import Reveal from './Reveal';
import { Hero, Next, Photos, Section, rasterPlan, tr } from './Shell';
import styles from './project.module.css';

const SLUG = 'illusion-d-envol';

export default function IllusionEnvol({ p, t, lang, next }: { p: Projet; t: Dict; lang: Lang; next: Projet }) {
  const img = (n: string) => p.images.find((i) => i.nom === n)!;
  const L = tr(lang, {
    fr: { titre: "L'ossature", texte: "Le pavillon arrive éclaté, comme dans l'axonométrie : plancher, poteaux, lames, poutres, chevrons. Il se rassemble, puis le soleil tourne et la lumière passe entre les lames.", steps: ['Éclaté', 'Assemblage', 'La lumière'], details: 'Les assemblages', detailsT: 'Ils portent la structure, filtrent la lumière et font l’ambiance.', croquis: 'Sous la toiture', plans: 'Les dessins', plan: 'Plan RDC', coupe: 'Coupe AA', facade: 'Façade sud', axo: 'Axonométrie éclatée' },
    en: { titre: 'The frame', texte: 'The pavilion arrives exploded, as in the axonometric: floor, posts, slats, beams, rafters. It comes together, then the sun turns and light passes between the slats.', steps: ['Exploded', 'Assembly', 'Light'], details: 'The joints', detailsT: 'They carry the structure, filter the light and set the atmosphere.', croquis: 'Under the roof', plans: 'The drawings', plan: 'Ground floor', coupe: 'Section AA', facade: 'South elevation', axo: 'Exploded axonometric' },
    it: { titre: "L'ossatura", texte: "Il padiglione arriva esploso, come nell'assonometria: piano, pilastri, listelli, travi, travetti. Si ricompone, poi il sole gira e la luce passa tra i listelli.", steps: ['Esploso', 'Montaggio', 'La luce'], details: 'Gli incastri', detailsT: "Portano la struttura, filtrano la luce e creano l'atmosfera.", croquis: 'Sotto la copertura', plans: 'I disegni', plan: 'Pianta piano terra', coupe: 'Sezione AA', facade: 'Prospetto sud', axo: 'Assonometria esplosa' },
  });
  const axo = img('axonometrie-eclatee'), cr = img('croquis-perspective');
  return (
    <article>
      <Hero p={p} t={t} img={img('maquette')} />
      <section className={`wrap ${styles.textBlock}`}>
        <p className="lead">{p.programme}.</p>
        <div className="prose"><p>{p.texte}</p></div>
      </section>
      <ModelScroll
        scene="envol" title={L.titre} text={L.texte} steps={L.steps} bounds={[0.15, 0.7]} note={t.projet.maquetteNote} height={340}
        fallback={<section className={`wrap ${styles.liteGrid}`}><Reveal src={axo.src} srcSmall={axo.srcSmall} alt={axo.legende} w={axo.w} h={axo.h} caption={axo.legende} /></section>}
      />
      <Section title={L.details} text={L.detailsT} first>
        <Photos imgs={['detail-assemblage-1', 'detail-assemblage-2', 'detail-assemblage-3', 'detail-assemblage-4'].map(img)} />
      </Section>
      <Section title={L.croquis}>
        <div className={styles.split}>
          <Croquis json={`/media/${SLUG}/croquis-perspective-traits.json`} src={cr.src} srcSmall={cr.srcSmall} w={cr.w} h={cr.h} alt={cr.legende} caption={cr.legende} />
          {p.poeme && <p className={styles.poeme}>{p.poeme}</p>}
        </div>
      </Section>
      <Section title={L.plans}>
        <PlanViewer labels={{ hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset }}
          plans={[rasterPlan(SLUG, img('coupe-aa'), L.coupe), rasterPlan(SLUG, img('plan-rdc'), L.plan), rasterPlan(SLUG, img('facade-sud'), L.facade), rasterPlan(SLUG, axo, L.axo)]} />
      </Section>
      <Next lang={lang} t={t} next={next} />
    </article>
  );
}
