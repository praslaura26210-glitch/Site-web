'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getState, live, useStore } from '@/lib/store';

type Poly = number[][];
type PlanData = { murs: Poly[]; demolis: Poly[]; zones: Poly[]; emprise: [number, number] };
type Maquette = {
  plans: Record<'rdc_existant' | 'etage_existant' | 'rdc_projet' | 'etage_projet', PlanData>;
  usages: { rdc: { usage: string; poly: Poly }[]; etage: { usage: string; poly: Poly }[] };
  niveaux: Record<string, number>;
  cour: { x0: number; x1: number };
};

const C = {
  mur: '#EEE7DC',
  poche: '#2B211C',
  demoli: '#A46B57',
  sol: '#EFE8DD',
  expo: '#B98F98',
  resto: '#E2CDD0',
  ocre: '#C08A3E',
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

export default function BuildingScene() {
  const [m, setM] = useState<Maquette | null>(null);
  useEffect(() => {
    fetch('/media/entre-deux-regards/maquette.json').then((r) => r.json()).then(setM).catch(() => {});
  }, []);
  if (!m) return null;
  return <Building m={m} />;
}

/** Murs extrudés (une seule géométrie par groupe), hauteur 1 : on règle la hauteur par l'échelle. */
function extrude(polys: Poly[]) {
  const geos: THREE.BufferGeometry[] = [];
  for (const p of polys) {
    if (p.length < 3) continue;
    const s = new THREE.Shape(p.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 4 });
    geos.push(g.index ? g.toNonIndexed() : g);
  }
  if (!geos.length) return new THREE.BufferGeometry();
  const merged = mergeGeometries(geos, false)!;
  merged.computeVertexNormals();
  return merged;
}

function flat(polys: Poly[]) {
  const geos = polys.filter((p) => p.length >= 3).map((p) => {
    const g = new THREE.ShapeGeometry(new THREE.Shape(p.map(([x, y]) => new THREE.Vector2(x, y))));
    return g.index ? g.toNonIndexed() : g;
  });
  return geos.length ? mergeGeometries(geos, false)! : new THREE.BufferGeometry();
}

function Building({ m }: { m: Maquette }) {
  const { camera, gl, size } = useThree();
  const calques = useStore((s) => s.calques);
  const [L, W] = m.plans.rdc_projet.emprise;
  const N = m.niveaux;
  const cour = m.cour;

  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1000), []);
  const mats = useMemo(() => {
    const planes = [clip];
    const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, clippingPlanes: planes, clipShadows: true, ...extra });
    return {
      mur: std(C.mur),
      // faces arrière vues à travers la coupe : le poché, comme sur une coupe dessinée
      poche: new THREE.MeshBasicMaterial({ color: C.poche, side: THREE.BackSide, clippingPlanes: planes }),
      demoli: std(C.demoli),
      dalle: std(C.mur),
      toit: std('#E7DDCE', { transparent: true, opacity: 1, side: THREE.DoubleSide }),
      expo: new THREE.MeshBasicMaterial({ color: C.expo, transparent: true, opacity: 0, depthWrite: false, clippingPlanes: planes }),
      resto: new THREE.MeshBasicMaterial({ color: C.resto, transparent: true, opacity: 0, depthWrite: false, clippingPlanes: planes }),
      arbre: std('#9C8F6E', { flatShading: true }),
      tronc: std('#6B5A4E'),
      rayon: new THREE.MeshBasicMaterial({ color: C.ocre, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    };
  }, [clip]);

  const geo = useMemo(() => {
    const P = m.plans;
    return {
      rdcEx: extrude(P.rdc_existant.murs),
      rdcDe: extrude(P.rdc_existant.demolis),
      etEx: extrude(P.etage_existant.murs),
      etDe: extrude(P.etage_existant.demolis),
      rdcPr: extrude(P.rdc_projet.murs),
      etPr: extrude(P.etage_projet.murs),
      expoRdc: flat(m.usages.rdc.filter((z) => z.usage === 'exposition').map((z) => z.poly)),
      restoRdc: flat(m.usages.rdc.filter((z) => z.usage === 'restauration').map((z) => z.poly)),
      expoEt: flat(m.usages.etage.map((z) => z.poly)),
    };
  }, [m]);

  // toiture à deux pans, ouverte au-dessus de la cour
  const roof = useMemo(() => {
    const lenRoof = cour.x0;
    const rise = N.faitage - N.egout;
    const slope = Math.hypot(W / 2, rise);
    const ang = Math.atan2(rise, W / 2);
    return { lenRoof, slope, ang, rise };
  }, [cour.x0, N, W]);

  const rdcEx = useRef<THREE.Group>(null!), etEx = useRef<THREE.Group>(null!);
  const rdcPr = useRef<THREE.Group>(null!), etPr = useRef<THREE.Group>(null!);
  const rdcDe = useRef<THREE.Group>(null!), etDe = useRef<THREE.Group>(null!);
  const dalle = useRef<THREE.Group>(null!), toit = useRef<THREE.Group>(null!);
  const rayon = useRef<THREE.Mesh>(null!), sun = useRef<THREE.DirectionalLight>(null!);
  const camPos = useMemo(() => new THREE.Vector3(0, 80, 0.01), []);
  const camLook = useMemo(() => new THREE.Vector3(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);
  const smooth = useRef({ rise: 0, etat: 0, cut: 1, usages: 0, light: 0, roof: 0, shift: 0 });
  const socle = useRef<THREE.Mesh>(null!);
  const rdcBand = useRef<THREE.Group>(null!), etBand = useRef<THREE.Group>(null!), arbres = useRef<THREE.Group>(null!);
  const inkC = useMemo(() => new THREE.Color(C.poche), []), murC = useMemo(() => new THREE.Color(C.mur), []);
  useEffect(() => () => camera instanceof THREE.PerspectiveCamera ? camera.clearViewOffset() : undefined, [camera]);

  useEffect(() => {
    camera.position.set(0, 80, 0.01);
    camera.lookAt(0, 0, 0);
    gl.shadowMap.type = THREE.PCFShadowMap;
  }, [camera, gl]);

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.0025, dt); // amortissement
    const s = smooth.current;
    const st = getState();
    s.rise += (live.rise - s.rise) * k;
    s.etat += (live.etat - s.etat) * k;
    s.cut += ((st.coupe ? live.cut : 1.02) - s.cut) * k;
    s.usages += ((st.calques.usages ? 1 : 0) - s.usages) * k;
    s.light += ((st.calques.lumiere ? 1 : 0) - s.light) * k;
    const wantRoof = live.shot === 'axo' && s.rise > 0.98 && !st.coupe && !st.calques.usages ? 1 : 0;
    s.roof += (wantRoof - s.roof) * k;

    // montée des murs : le RDC d'abord, l'étage ensuite ; un plan reste lisible à plat (0,03)
    const r1 = 0.03 + 0.97 * ease(s.rise * 2), r2 = 0.03 + 0.97 * ease(s.rise * 2 - 1);
    const hR = N.etage - N.rdc_ouest, hE = N.egout - N.etage;
    const showEx = s.etat < 0.5, showPr = !showEx;
    rdcEx.current.visible = showEx && st.calques.structure;
    etEx.current.visible = showEx && st.calques.structure && s.rise > 0.5;
    rdcPr.current.visible = showPr && st.calques.structure;
    etPr.current.visible = showPr && st.calques.structure && s.rise > 0.5;
    rdcEx.current.scale.set(1, 1, hR * r1);
    rdcPr.current.scale.set(1, 1, hR * r1);
    etEx.current.scale.set(1, 1, hE * r2);
    etPr.current.scale.set(1, 1, hE * r2);
    // démolitions : elles s'enfoncent quand on passe au projet
    const sink = 1 - clamp01(s.etat * 2);
    rdcDe.current.visible = st.calques.demolition && sink > 0.01;
    etDe.current.visible = st.calques.demolition && sink > 0.01 && s.rise > 0.5;
    rdcDe.current.scale.set(1, 1, Math.max(0.001, hR * r1 * sink));
    etDe.current.scale.set(1, 1, Math.max(0.001, hE * r2 * sink));
    // vue de dessus : les murs à plat se lisent en noir, comme un plan ; ils blanchissent en montant
    mats.mur.color.copy(inkC).lerp(murC, ease(s.rise * 4));
    const hs = Math.max(0.01, -N.rdc_ouest * ease((s.rise - 0.05) * 4));
    socle.current.scale.y = hs;
    socle.current.position.y = N.rdc_ouest + hs / 2 - 0.02;
    arbres.current.scale.setScalar(Math.max(0.001, ease(s.rise * 1.5)));
    rdcBand.current.visible = st.calques.structure;
    etBand.current.visible = st.calques.structure && s.rise > 0.5;
    rdcBand.current.scale.y = r1;
    etBand.current.scale.y = r2;
    dalle.current.visible = st.calques.structure && s.rise > 0.55;
    dalle.current.scale.y = clamp01((s.rise - 0.5) * 3) || 0.001;

    mats.expo.opacity = 0.85 * s.usages;
    mats.resto.opacity = 0.9 * s.usages;
    toit.current.visible = s.roof > 0.02;
    mats.toit.opacity = s.roof;
    mats.rayon.opacity = 0.22 * s.light;
    rayon.current.visible = s.light > 0.02;
    sun.current.intensity = 2.4 + 1.6 * s.light;

    // plan de coupe : garde tout ce qui est à l'ouest de x = cut
    clip.constant = -L / 2 + s.cut * L;

    // caméra
    const shot = live.shot;
    const orbit = live.orbit * 0.6;
    if (shot === 'plan') { tmpPos.set(0, 74, 0.01); tmpLook.set(0, 0, 0); }
    else if (shot === 'coupe') { tmpPos.set(-L / 2 + s.cut * L + 30, 17, 34); tmpLook.set(-L / 2 + s.cut * L - 8, 3.5, 0); }
    else if (shot === 'lumiere') { tmpPos.set(L / 2 + 10, 26, 24); tmpLook.set(L / 2 - 6, 3, 0); }
    else { tmpPos.set(46 * Math.cos(0.75 + orbit), 36, 46 * Math.sin(0.75 + orbit) + 4); tmpLook.set(0, 3, 0); }
    const kc = 1 - Math.pow(0.012, dt);
    camPos.lerp(tmpPos, kc);
    camLook.lerp(tmpLook, kc);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    const wantShift = st.coupe ? 0.17 : shot === 'plan' ? 0 : -0.1;
    s.shift += (wantShift - s.shift) * kc;
    if (camera instanceof THREE.PerspectiveCamera) camera.setViewOffset(size.width, size.height, s.shift * size.width, 0, size.width, size.height);
  });

  const toWorld = { position: [-L / 2, 0, W / 2] as [number, number, number] };
  const wallProps = (g: THREE.BufferGeometry) => (
    <>
      <mesh geometry={g} material={mats.mur} castShadow receiveShadow />
      <mesh geometry={g} material={mats.poche} />
    </>
  );
  const xC = (cour.x0 + cour.x1) / 2 - L / 2;

  return (
    <group>
      <hemisphereLight args={['#fff6ea', '#cdbba4', 0.9]} />
      <directionalLight
        ref={sun}
        position={[34, 24, 18]}
        intensity={2.4}
        color="#ffe0bd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={120}
      />
      {/* sol */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.03, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial color="#F2ECE2" toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.02, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <shadowMaterial opacity={0.16} color="#4a3426" />
      </mesh>
      <group {...toWorld}>
        {/* murs : repère du plan (x est, y nord) tourné pour que l'extrusion soit verticale */}
        <group rotation-x={-Math.PI / 2}>
          <group ref={rdcEx} position={[0, 0, N.rdc_ouest]}>{wallProps(geo.rdcEx)}</group>
          <group ref={rdcPr} position={[0, 0, N.rdc_ouest]}>{wallProps(geo.rdcPr)}</group>
          <group ref={etEx} position={[0, 0, N.etage]}>{wallProps(geo.etEx)}</group>
          <group ref={etPr} position={[0, 0, N.etage]}>{wallProps(geo.etPr)}</group>
          <group ref={rdcDe} position={[0, 0, N.rdc_ouest]}>
            <mesh geometry={geo.rdcDe} material={mats.demoli} castShadow />
          </group>
          <group ref={etDe} position={[0, 0, N.etage]}>
            <mesh geometry={geo.etDe} material={mats.demoli} castShadow />
          </group>
          {/* usages, posés sur les planchers */}
          <mesh geometry={geo.expoRdc} material={mats.expo} position={[0, 0, 0.04]} />
          <mesh geometry={geo.restoRdc} material={mats.resto} position={[0, 0, 0.04]} />
          <mesh geometry={geo.expoEt} material={mats.expo} position={[0, 0, N.etage + 0.2]} />
        </group>
        {/* allèges et linteaux en façade : maquette d'intention, hauteurs types */}
        <group ref={rdcBand} position={[0, N.rdc_ouest, 0]}>
          <Bandes L={L} W={W} e={0.55} ranges={[[0, 0.9 - N.rdc_ouest], [2.9 - N.rdc_ouest, N.etage - N.rdc_ouest]]} mats={mats} />
        </group>
        <group ref={etBand} position={[0, N.etage, 0]}>
          <Bandes L={L} W={W} e={0.55} ranges={[[0, 0.95], [3.0, N.egout - N.etage]]} mats={mats} />
        </group>
        {/* plancher de l'étage : vide au-dessus de la grande salle ouest et ouvert sur la cour */}
        <group ref={dalle} position={[0, N.etage, 0]}>
          <mesh position={[19.4 / 2, 0.08, -6.4 / 2]} material={mats.dalle} castShadow receiveShadow>
            <boxGeometry args={[19.4, 0.3, 6.4]} />
          </mesh>
          <mesh position={[(19.4 + cour.x0) / 2, 0.08, -W / 2]} material={mats.dalle} castShadow receiveShadow>
            <boxGeometry args={[cour.x0 - 19.4, 0.3, W]} />
          </mesh>
        </group>
        <mesh ref={socle} position={[L / 2, N.rdc_ouest, -W / 2]} material={mats.dalle} receiveShadow>
          <boxGeometry args={[L, 1, W]} />
        </mesh>
        {/* toiture */}
        <group ref={toit} position={[0, N.egout, 0]}>
          <mesh position={[roof.lenRoof / 2, roof.rise / 2, -W / 4]} rotation-x={roof.ang} material={mats.toit} castShadow>
            <boxGeometry args={[roof.lenRoof, 0.25, roof.slope]} />
          </mesh>
          <mesh position={[roof.lenRoof / 2, roof.rise / 2, (-3 * W) / 4]} rotation-x={-roof.ang} material={mats.toit} castShadow>
            <boxGeometry args={[roof.lenRoof, 0.25, roof.slope]} />
          </mesh>
        </group>
      </group>
      {/* la cour : deux arbres et la lumière qui descend par la toiture ouverte */}
      <group position={[xC, 0, 0]}>
        <group ref={arbres}>
        {[[-1.5, 2.2, 1.6], [1.6, -3.4, 1.3]].map(([x, z, s], i) => (
          <group key={i} position={[x, 0, z]} scale={s}>
            <mesh material={mats.tronc} position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.12, 0.18, 3.2, 6]} /></mesh>
            <mesh material={mats.arbre} position={[0, 3.9, 0]} castShadow><icosahedronGeometry args={[1.6, 0]} /></mesh>
          </group>
        ))}
        </group>
        <mesh ref={rayon} position={[0, 7, 0]} rotation-z={-0.45} material={mats.rayon}>
          <boxGeometry args={[cour.x1 - cour.x0 - 1, 16, W - 2]} />
        </mesh>
      </group>
    </group>
  );
}

/** Bandeaux sur les quatre façades (repère : x vers l'est, z vers le sud depuis l'angle nord-ouest). */
function Bandes({ L, W, e, ranges, mats }: { L: number; W: number; e: number; ranges: number[][]; mats: { mur: THREE.Material; poche: THREE.Material } }) {
  const sides: [number, number, number, number][] = [
    [L / 2, -e / 2, L, e], // façade sud (bord y = 0 du plan)
    [L / 2, -W + e / 2, L, e], // façade nord
    [e / 2, -W / 2, e, W], // ouest
    [L - e / 2, -W / 2, e, W], // est
  ];
  return (
    <>
      {ranges.map(([a, b], i) =>
        sides.map(([x, z, w, d], j) => (
          <group key={`${i}-${j}`} position={[x, (a + b) / 2, z]}>
            <mesh material={mats.mur} castShadow receiveShadow><boxGeometry args={[w, b - a, d]} /></mesh>
            <mesh material={mats.poche}><boxGeometry args={[w, b - a, d]} /></mesh>
          </group>
        )),
      )}
    </>
  );
}
