import fs from 'node:fs';
import path from 'node:path';
import type { Dict, Lang } from '@/i18n';
import type { Projet } from '@/lib/content';
import Calques from './Calques';
import Matiere from './Matiere';
import PlanViewer from './PlanViewer';
import { Hero, Next, Photos, Section, tr, vectorPlan } from './Shell';
import styles from './project.module.css';

const SLUG = 'pilates-room';

export default function PilatesRoom({ p, t, lang, next }: { p: Projet; t: Dict; lang: Lang; next: Projet }) {
  const img = (n: string) => p.images.find((i) => i.nom === n)!;
  const pl = (n: string) => p.plans.find((x) => x.nom === n)!;
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/projets', SLUG, 'data.json'), 'utf8'));
  const palette: Record<string, string> = data.palette || {};
  const L = tr(lang, {
    fr: { role: 'Mon rôle', roleV: 'Espaces, mobilier, matériaux, dossiers artisans, permis, visuels 3D', calques: 'Le plan, en calques', calquesT: "Le plan d'aménagement et le plan électricité / éclairage, superposés : allume ou éteins chaque calque.", amen: 'Aménagement', elec: 'Électricité et éclairage', coupes: 'Coupes', coupesT: 'Les coupes techniques destinées aux artisans.', rendus: 'Les visuels 3D', matiere: 'La matière', matiereT: 'Terrazzo rose, bois clair, béton ciré : la planche de matériaux, éclairée par une lumière rasante qui suit la souris.', aa: 'Coupe AA', bb: 'Coupe BB', cc: 'Coupe CC' },
    en: { role: 'My role', roleV: 'Spaces, furniture, materials, contractor documents, permit, 3D visuals', calques: 'The plan, in layers', calquesT: 'The layout plan and the electrical / lighting plan, overlaid: switch each layer on or off.', amen: 'Layout', elec: 'Electrical and lighting', coupes: 'Sections', coupesT: 'Technical sections for the contractors.', rendus: '3D visuals', matiere: 'Material', matiereT: 'Pink terrazzo, light wood, polished concrete: the material board, under raking light that follows the mouse.', aa: 'Section AA', bb: 'Section BB', cc: 'Section CC' },
    it: { role: 'Il mio ruolo', roleV: 'Spazi, arredi, materiali, documenti per gli artigiani, pratica edilizia, render 3D', calques: 'La pianta, a livelli', calquesT: "La pianta degli arredi e la pianta dell'impianto elettrico e dell'illuminazione, sovrapposte: accendi o spegni ogni livello.", amen: 'Arredi', elec: 'Impianto elettrico e illuminazione', coupes: 'Sezioni', coupesT: 'Le sezioni tecniche per gli artigiani.', rendus: 'I render 3D', matiere: 'La materia', matiereT: 'Terrazzo rosa, legno chiaro, cemento spatolato: la tavola dei materiali, sotto una luce radente che segue il mouse.', aa: 'Sezione AA', bb: 'Sezione BB', cc: 'Sezione CC' },
  });
  const cmp = `/media/${SLUG}/plans/comparaison`;
  const planche = img('planche-materiaux');
  return (
    <article>
      <Hero p={p} t={t} img={img('rendu-accueil')} extra={[{ label: L.role, value: L.roleV }]} />
      <section className={`wrap ${styles.textBlock}`}>
        <p className="lead">{p.programme}.</p>
        <div className="prose"><p>{p.texte}</p></div>
      </section>
      <Section title={L.calques} text={L.calquesT}>
        <Calques title={L.calques} layers={[{ id: 'a', label: L.amen, src: `${cmp}/plan-amenagement.svg` }, { id: 'e', label: L.elec, src: `${cmp}/plan-electricite.svg` }]} />
      </Section>
      <Section title={L.coupes} text={L.coupesT}>
        <PlanViewer labels={{ hint: t.projet.zoomHint, zoomIn: t.projet.zoomIn, zoomOut: t.projet.zoomOut, reset: t.projet.zoomReset }}
          plans={[vectorPlan(pl('coupe-cc'), L.cc), vectorPlan(pl('coupe-aa'), L.aa), vectorPlan(pl('coupe-bb'), L.bb)]} />
      </Section>
      <Section title={L.rendus}>
        <Photos imgs={[img('rendu-salle'), img('rendu-coiffeuse'), img('rendu-vestiaire')]} />
      </Section>
      <Section title={L.matiere} text={L.matiereT}>
        <div className={styles.matiere}>
          <Matiere src={planche.srcSmall} w={Math.round((1000 * planche.w) / planche.h)} h={1000} alt={planche.legende} />
          <div className={styles.palette}>
            {Object.entries(palette).map(([nom, hex]) => (
              <div key={nom}><i style={{ background: hex }} /><span>{nom}</span><small>{hex}</small></div>
            ))}
          </div>
        </div>
      </Section>
      <Next lang={lang} t={t} next={next} />
    </article>
  );
}
