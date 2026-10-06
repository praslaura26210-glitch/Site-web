'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { live } from '@/lib/store';
import { COUL, damp, ease, easeInOut, matte, seg } from './common';

// Maquette d'intention d'après la coupe AA, les plans et le plan de structure (scannés) : proportions approchées.
const PENTE = 0.28; // le terrain monte vers le nord (z négatif)
const LONG = 36, PROF = 10.5, R1 = -3.4;
const TOIT_AR = 3.6, TOIT_AV = 4.8;
const MODULE = LONG / 4;

function prism(profile: [number, number][], depth: number, x0: number) {
  // profil dans le plan (z, y), extrudé le long de x
  // rotation de +90° autour de y : z local (extrusion) -> +x ; x local -> -z, d'où le signe inversé du profil
  const shape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(-z, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.rotateY(Math.PI / 2);
  g.translate(x0, 0, 0);
  g.computeVertexNormals();
  return g;
}

export default function RucheScene() {
  const { camera } = useThree();
  const mats = useMemo(() => ({ mur: matte(COUL.mur), bois: matte(COUL.bois), pierre: matte(COUL.pierre), toit: matte('#E7DDCE', { transparent: true }), terrain: new THREE.MeshBasicMaterial({ color: '#F2ECE2', toneMapped: false }), ligne: new THREE.LineBasicMaterial({ color: '#B9A992' }) }), []);
  const geo = useMemo(() => {
    const avant = prism([[0, R1], [PROF, R1], [PROF, TOIT_AV - 0.3], [0, TOIT_AR - 0.3]], LONG, -LONG / 2);
    const arriere = prism([[-9, 0], [0, 0], [0, 3.1], [-9, 3.4]], LONG - 4, -LONG / 2);
    const aile = new THREE.BoxGeometry(5, 3.2, 12).translate(-LONG / 2 - 2.5, 3.2 / 2 + 1.2, -7);
    const est = new THREE.BoxGeometry(9, 3.4, 8).translate(4.5, 1.7, 0).rotateY(-0.26).translate(LONG / 2, 0.4, -2);
    const batis = mergeGeometries([avant, arriere, aile.toNonIndexed(), est.toNonIndexed()].map((g) => (g.index ? g.toNonIndexed() : g)), false)!;
    // charpente en diagonale : losange + carré intérieur par module, posée sur la pente du toit
    const poutres: THREE.BufferGeometry[] = [];
    const beam = (a: THREE.Vector2, b: THREE.Vector2, h = 0.32) => {
      const len = a.distanceTo(b);
      const g = new THREE.BoxGeometry(len, h, 0.16);
      g.rotateY(-Math.atan2(b.y - a.y, b.x - a.x));
      g.translate((a.x + b.x) / 2, 0, (a.y + b.y) / 2);
      poutres.push(g.toNonIndexed());
    };
    for (let i = 0; i < 4; i++) {
      const x0 = -LONG / 2 + i * MODULE, x1 = x0 + MODULE, xm = (x0 + x1) / 2, zm = PROF / 2;
      const P = (x: number, z: number) => new THREE.Vector2(x, z);
      beam(P(x0, 0), P(x1, 0)); beam(P(x0, PROF), P(x1, PROF)); beam(P(x0, 0), P(x0, PROF));
      beam(P(xm, 0), P(x1, zm)); beam(P(x1, zm), P(xm, PROF)); beam(P(xm, PROF), P(x0, zm)); beam(P(x0, zm), P(xm, 0));
      const q = MODULE * 0.27, r = PROF * 0.27;
      beam(P(xm - q, zm - r), P(xm + q, zm - r), 0.22); beam(P(xm + q, zm - r), P(xm + q, zm + r), 0.22);
      beam(P(xm + q, zm + r), P(xm - q, zm + r), 0.22); beam(P(xm - q, zm + r), P(xm - q, zm - r), 0.22);
    }
    beam(new THREE.Vector2(LONG / 2, 0), new THREE.Vector2(LONG / 2, PROF));
    const charpente = mergeGeometries(poutres, false)!;
    // courbes de niveau du terrain, tous les 0,5 m
    const pts: number[] = [];
    for (let y = -6; y <= 6; y += 0.5) { const z = -y / PENTE; pts.push(-60, y + 0.02, z, 60, y + 0.02, z); }
    const lignes = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return { batis, charpente, lignes };
  }, []);

  const bat = useRef<THREE.Mesh>(null!), toit = useRef<THREE.Mesh>(null!), volets = useRef<THREE.Group>(null!), charp = useRef<THREE.Mesh>(null!);
  const sm = useRef({ r: 0 });
  const pos = useMemo(() => new THREE.Vector3(40, 24, 50), []);
  useEffect(() => { camera.position.copy(pos); }, [camera, pos]);
  const roofAng = -Math.atan2(TOIT_AV - TOIT_AR, PROF);

  useFrame((_, dt) => {
    const s = sm.current;
    s.r += (live.rise - s.r) * damp(dt, 0.004);
    // 0 -> 0,3 : les volumes sortent de la pente ; 0,3 -> 0,55 : le toit se soulève, la charpente apparaît ;
    // 0,55 -> 0,85 : les volets pivotent ; ensuite la caméra finit son tour
    const up = ease(seg(s.r, 0, 0.3));
    bat.current.scale.y = Math.max(0.01, up);
    bat.current.position.y = R1 * (1 - up) * 0.2;
    charp.current.visible = up > 0.95;
    const lift = easeInOut(seg(s.r, 0.3, 0.55));
    toit.current.position.y = lift * 5;
    (toit.current.material as THREE.MeshStandardMaterial).opacity = 1 - lift * 0.9;
    toit.current.visible = up > 0.95;
    const rot = easeInOut(seg(s.r, 0.55, 0.85));
    volets.current.visible = up > 0.95;
    volets.current.children.forEach((v) => { v.rotation.y = rot * 1.3; });
    const a = 0.85 + live.orbit * 0.8;
    const want = new THREE.Vector3(Math.cos(a) * 52, 22 + live.orbit * 6, Math.sin(a) * 52 + 4);
    pos.lerp(want, damp(dt, 0.02));
    camera.position.copy(pos);
    camera.lookAt(0, 1, 2);
  });

  return (
    <group>
      <hemisphereLight args={['#fff6ea', '#cdbba4', 0.9]} />
      <directionalLight position={[25, 30, 30]} intensity={2.5} color="#ffe0bd" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={120} />
      {/* la pente */}
      <group rotation-x={Math.atan(PENTE)}>
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} material={mats.terrain}><planeGeometry args={[300, 300]} /></mesh>
        <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[300, 300]} /><shadowMaterial opacity={0.16} color="#4a3426" /></mesh>
      </group>
      <lineSegments geometry={geo.lignes} material={mats.ligne} />
      <mesh ref={bat} geometry={geo.batis} material={mats.mur} castShadow receiveShadow />
      <group position={[0, TOIT_AR - 0.3, 0]} rotation-x={roofAng}>
        <mesh ref={charp} geometry={geo.charpente} material={mats.bois} position={[0, 0.2, 0]} castShadow />
        <mesh ref={toit} material={mats.toit} position={[0, 0.5, PROF / 2]} castShadow>
          <boxGeometry args={[LONG + 0.6, 0.25, PROF + 0.8]} />
        </mesh>
      </group>
      {/* volets rotatifs de la façade sud */}
      <group ref={volets}>
        {Array.from({ length: 56 }, (_, i) => (
          <mesh key={i} material={mats.bois} position={[-LONG / 2 + 0.4 + i * (LONG - 0.8) / 55, 0.2, PROF + 0.55]} castShadow>
            <boxGeometry args={[0.55, 3.4, 0.05]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
