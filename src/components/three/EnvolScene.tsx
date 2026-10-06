'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { live } from '@/lib/store';
import { COUL, damp, easeInOut, matte, seg } from './common';
import Sol from './Sol';

// Dimensions relevées sur le plan RDC et la coupe AA scannés (approximatives, ±0,5 m)
const L = 17.2, W = 11.3;
const COLS = [-8.6, -5.16, -1.72, 1.72, 5.16, 8.6];
const IN_Z = 4.1, OUT_Z = 5.65, IN_X = 5.3;
const DECK = 0.8, EDGE = 5.2, VALLEY = 4.4, INNER = 4.5;

type Box = { s: [number, number, number]; p: [number, number, number]; r?: [number, number, number] };
function merge(list: Box[]) {
  const geos = list.map(({ s, p, r }) => {
    const g = new THREE.BoxGeometry(...s);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(r || [0, 0, 0]))), new THREE.Vector3(1, 1, 1));
    return g.applyMatrix4(m).toNonIndexed();
  });
  return mergeGeometries(geos, false)!;
}

/** Pavillon : posé éclaté comme l'axonométrie de Laura, il se rassemble au scroll ; puis le soleil tourne. */
export default function EnvolScene() {
  const { camera } = useThree();
  const layers = useMemo(() => {
    const roofAng = Math.atan2(EDGE - VALLEY, OUT_Z);
    const roofLen = Math.hypot(OUT_Z, EDGE - VALLEY);
    const deck: Box[] = [{ s: [L + 0.4, 0.2, W + 0.4], p: [0, DECK - 0.1, 0] }];
    for (let i = 0; i < 5; i++) deck.push({ s: [0.3, 0.16, 2.4], p: [L / 2 + 0.35 + i * 0.3, (DECK * (5 - i)) / 5 - 0.08, 0] });
    const poteaux: Box[] = [];
    COLS.forEach((x) => [-OUT_Z, OUT_Z].forEach((z) => poteaux.push({ s: [0.2, EDGE, 0.2], p: [x, EDGE / 2, z] })));
    COLS.slice(1, 5).forEach((x) => [-IN_Z, IN_Z].forEach((z) => poteaux.push({ s: [0.16, INNER, 0.16], p: [x, INNER / 2, z] })));
    const poutres: Box[] = [];
    [-OUT_Z, OUT_Z].forEach((z) => poutres.push({ s: [L + 0.6, 0.3, 0.18], p: [0, EDGE, z] }));
    poutres.push({ s: [L + 0.6, 0.3, 0.22], p: [0, VALLEY, 0] });
    COLS.forEach((x) => [-1, 1].forEach((sd) => poutres.push({ s: [0.16, 0.26, roofLen], p: [x, (EDGE + VALLEY) / 2, (sd * OUT_Z) / 2], r: [-sd * roofAng, 0, 0] })));
    const chevrons: Box[] = [];
    for (let x = -L / 2; x <= L / 2 + 1e-6; x += 0.29) [-1, 1].forEach((sd) => chevrons.push({ s: [0.06, 0.12, roofLen + 0.6], p: [x, (EDGE + VALLEY) / 2 + 0.2, (sd * OUT_Z) / 2], r: [-sd * roofAng, 0, 0] }));
    // la toiture « en dedans » : un second plafond de solives, plus dense, au-dessus du cœur
    const solives: Box[] = [];
    for (let x = -IN_X; x <= IN_X + 1e-6; x += 0.22) solives.push({ s: [0.05, 0.14, IN_Z * 2], p: [x, 3.35, 0] });
    const lames: Box[] = [];
    for (let y = DECK + 0.4; y < 3.3; y += 0.24) [-IN_Z, IN_Z].forEach((z) => lames.push({ s: [IN_X * 2, 0.11, 0.05], p: [0, y, z] }));
    const cables: Box[] = [];
    [[-8.6, -5.16], [5.16, 8.6]].forEach(([a, b]) => [-OUT_Z, OUT_Z].forEach((z) => {
      const dx = b - a, dy = EDGE - DECK, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      cables.push({ s: [len, 0.025, 0.025], p: [(a + b) / 2, (EDGE + DECK) / 2, z], r: [0, 0, ang] });
      cables.push({ s: [len, 0.025, 0.025], p: [(a + b) / 2, (EDGE + DECK) / 2, z], r: [0, 0, -ang] });
    }));
    return [
      { geo: merge(deck), k: 0, mat: matte('#CDB794') },
      { geo: merge(poteaux), k: 1, mat: matte(COUL.bois) },
      { geo: merge(cables), k: 1.2, mat: matte(COUL.acier, { metalness: 0.5, roughness: 0.5 }) },
      { geo: merge(lames), k: 1.6, mat: matte('#E2CFAE') },
      { geo: merge(poutres), k: 2.4, mat: matte(COUL.bois) },
      { geo: merge(solives), k: 2.0, mat: matte('#E2CFAE') },
      { geo: merge(chevrons), k: 3.2, mat: matte(COUL.bois) },
    ];
  }, []);

  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const sun = useRef<THREE.DirectionalLight>(null!);
  const sm = useRef({ r: 0 });
  const pos = useMemo(() => new THREE.Vector3(26, 18, 22), []);
  useEffect(() => { camera.position.copy(pos); }, [camera, pos]);

  useFrame((_, dt) => {
    const s = sm.current;
    s.r += (live.rise - s.r) * damp(dt, 0.004);
    // 0 -> 0,15 : éclaté ; 0,15 -> 0,7 : assemblage ; 0,7 -> 1 : le soleil tourne
    const a = easeInOut(seg(s.r, 0.15, 0.7));
    refs.current.forEach((m, i) => {
      if (!m) return;
      const k = layers[i].k;
      m.position.y = k * 3.2 * (1 - a);
    });
    const sunT = seg(s.r, 0.7, 1);
    const az = -0.6 + sunT * 2.2;
    sun.current.position.set(Math.cos(az) * 22, 13 - sunT * 4, Math.sin(az) * 22);
    const ang = 0.7 + live.orbit * 0.9;
    const want = new THREE.Vector3(Math.cos(ang) * 27, 15 + (1 - a) * 6, Math.sin(ang) * 27);
    pos.lerp(want, damp(dt, 0.02));
    camera.position.copy(pos);
    camera.lookAt(0, 2.8 + (1 - a) * 3, 0);
  });

  return (
    <group>
      <hemisphereLight args={['#fff6ea', '#cdbba4', 0.85]} />
      <directionalLight ref={sun} position={[18, 13, 10]} intensity={2.8} color="#ffdcb4" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} />
      <Sol y={0} />
      {layers.map((l, i) => (
        <mesh key={i} ref={(m) => { refs.current[i] = m; }} geometry={l.geo} material={l.mat} castShadow receiveShadow />
      ))}
    </group>
  );
}
