import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import Croquis from './Croquis';
import Matiere from './Matiere';
import PlanViewer from './PlanViewer';
import Reveal from './Reveal';
import { Hero, Next, Photos, Section, rasterPlan, tr } from './Shell';
import styles from './project.module.css';

const SLUG = 'le-passage-des-artistes';

export default function PassageArtistes({ p, t, lang, next }: { p: Projet; t: Dict; lang: Lang; next: Projet }) {
  const img = (n: string) => p.images.find((i) => i.nom === n)!;
  const L = tr(lang, {
    fr: { croquis: 'La cour, au crayon', croquisT: "Le croquis se trace comme sur la feuille : d'abord la structure, puis la matière.", plans: 'Les dessins', plansT: 'Plans, façades et coupes scannés : zoome pour lire le détail, la version pleine définition se charge au zoom.', pierre: 'La pierre, à la main', pierreT: "Expérimentation à l'échelle 1 : l'appui de fenêtre en arc inversé taillé à la scie, au marteau et au burin. La lumière rasante suit la souris.", maquette: 'La maquette', masse: 'Plan masse 1/250', rdc: 'Plan RDC', etages: 'Plan des étages', sud: 'Façade sud', nord: 'Façade nord', coupe: 'Coupe', axo: 'Détail en axonométrie 1/20', cp: 'Coupe perspective 1/50', usages: 'Café-peinture, logements' },
    en: { croquis: 'The courtyard, in pencil', croquisT: 'The sketch draws itself as on paper: first the structure, then the material.', plans: 'The drawings', plansT: 'Scanned plans, elevations and sections: zoom in to read the detail, the full-resolution version loads as you zoom.', pierre: 'Stone, by hand', pierreT: 'Full-scale experiment: the inverted-arch window sill carved with saw, hammer and chisel. Raking light follows the mouse.', maquette: 'The model', masse: 'Site plan 1:250', rdc: 'Ground floor', etages: 'Upper floors', sud: 'South elevation', nord: 'North elevation', coupe: 'Section', axo: 'Axonometric detail 1:20', cp: 'Perspective section 1:50', usages: 'Painting café, housing' },
    it: { croquis: 'La corte, a matita', croquisT: 'Lo schizzo si disegna come sul foglio: prima la struttura, poi la materia.', plans: 'I disegni', plansT: 'Piante, prospetti e sezioni scansionati: ingrandisci per leggere il dettaglio, la versione ad alta definizione si carica con lo zoom.', pierre: 'La pietra, a mano', pierreT: 'Sperimentazione in scala 1:1: il davanzale ad arco rovescio scolpito con sega, martello e scalpello. La luce radente segue il mouse.', maquette: 'Il plastico', masse: 'Planimetria 1:250', rdc: 'Pianta piano terra', etages: 'Pianta piani tipo', sud: 'Prospetto sud', nord: 'Prospetto nord', coupe: 'Sezione', axo: 'Dettaglio assonometrico 1:20', cp: 'Sezione prospettica 1:50', usages: 'Caffè-pittura, alloggi' },
  });
  const cr = img('croquis-cour'), e2 = img('experimentation-2');
  return (
    <article>
      <Hero p={p} t={t} img={img('maquette-1')} extra={[{ label: t.projet.calqueUsages, value: L.usages }]} />
      <section className={`wrap ${styles.textBlock}`}>
        <p className="lead">{p.programme}.</p>
        <div className="prose"><p>{p.texte}</p></div>
      </section>
      <Section title={L.croquis} text={L.croquisT}>
        <div className={styles.split}>
          <Croquis json={`/media/${SLUG}/croquis-cour-traits.json`} src={cr.src} srcSmall={cr.srcSmall} w={cr.w} h={cr.h} alt={cr.legende} caption={cr.legende} />
          <Reveal src={img('maquette-2').src} srcSmall={img('maquette-2').srcSmall} alt={img('maquette-2').legende} w={img('maquette-2').w} h={img('maquette-2').h} caption={img('maquette-2').legende} />
        </div>
      </Section>
      <Section title={L.plans} text={L.plansT}>
        <PlanViewer
          labels={{ hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset }}
          plans={[
            { ...rasterPlan(SLUG, img('coupe-perspective'), L.cp) },
            rasterPlan(SLUG, img('plan-masse'), L.masse),
            rasterPlan(SLUG, img('plan-rdc'), L.rdc),
            rasterPlan(SLUG, img('plan-etages'), L.etages),
            rasterPlan(SLUG, img('facade-sud'), L.sud),
            rasterPlan(SLUG, img('facade-nord'), L.nord),
            rasterPlan(SLUG, img('coupe'), L.coupe),
            rasterPlan(SLUG, img('detail-axonometrie'), L.axo),
          ]}
        />
      </Section>
      <Section title={L.pierre} text={L.pierreT}>
        <div className={styles.matiere}>
          <Matiere src={e2.srcSmall} w={1000} h={Math.round((1000 * e2.h) / e2.w)} alt={e2.legende} />
          <div className="prose"><p>{p.experimentation}</p></div>
        </div>
        <div style={{ marginTop: 32 }}><Photos imgs={[img('experimentation-1'), img('experimentation-3')]} /></div>
      </Section>
      <Next lang={lang} t={t} next={next} />
    </article>
  );
}
