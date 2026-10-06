'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { live } from '@/lib/store';
import { COUL, damp } from './common';
import { terrainY } from './relief';

type B = [number, number, number, number, number, number, number?, string?]; // sx sy sz px py pz rotY couleur
const BLANC = COUL.mur;

/** Petites maquettes (en mètres « maquette », ~1 m de côté) posées sur le terrain de l'index. */
const MAQUETTES: Record<string, { x: number; z: number; parts: B[] }> = {
  'entre-deux-regards': { x: -1.95, z: 0.05, parts: [
    [1.2, 0.42, 0.42, 0, 0.21, 0], [0.36, 0.42, 0.44, 0.47, 0.21, 0, 0, COUL.cuite],
    [1.0, 0.04, 0.32, -0.1, 0.52, 0.1, 0], [1.0, 0.04, 0.32, -0.1, 0.52, -0.1, 0],
  ] },
  'le-passage-des-artistes': { x: -1.15, z: -0.75, parts: [
    [0.22, 0.75, 0.3, -0.36, 0.375, 0, 0, COUL.pierre], [0.22, 0.75, 0.3, 0.36, 0.375, 0, 0, COUL.pierre],
    [0.94, 0.28, 0.3, 0, 0.89, 0, 0, COUL.pierre], [0.94, 0.12, 0.34, 0, 0.06, 0, 0, '#CFC4B2'],
  ] },
  'pilates-room': { x: -0.25, z: 0.25, parts: [
    [0.5, 0.8, 0.06, -0.15, 0.4, 0, 0.3, '#E0B7A5'], [0.36, 0.6, 0.06, 0.25, 0.3, 0.12, -0.4, '#E6C6B7'],
    [0.9, 0.05, 0.7, 0, 0.025, 0, 0, '#CBC1B7'],
  ] },
  'escalier-suspendu': { x: 0.6, z: -0.65, parts: [] },
  'la-ruche': { x: 1.35, z: 0.15, parts: [
    [1.1, 0.5, 0.36, 0, 0.25, 0.12], [0.9, 0.3, 0.3, -0.1, 0.15, -0.26, 0, COUL.bois], [1.16, 0.04, 0.42, 0, 0.53, 0.12, 0, COUL.bois],
  ] },
  'illusion-d-envol': { x: 2.05, z: -0.7, parts: [] },
};

function buildParts(slug: string) {
  const m = MAQUETTES[slug];
  const groups: Record<string, THREE.BufferGeometry[]> = {};
  const add = (b: B) => {
    const [sx, sy, sz, px, py, pz, ry = 0, col = BLANC] = b;
    const g = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed();
    g.rotateY(ry);
    g.translate(px, py, pz);
    (groups[col] ||= []).push(g);
  };
  m.parts.forEach(add);
  if (slug === 'escalier-suspendu') {
    for (let i = 0; i < 9; i++) add([0.16, 0.025, 0.4, -0.6 + i * 0.13, 0.08 + i * 0.09, 0, 0, COUL.chene]);
    add([1.25, 0.05, 0.04, -0.02, 0.42, 0, 0, COUL.acier]);
    add([0.4, 0.04, 0.5, 0.75, 0.83, 0, 0, '#E4DCCF']);
  }
  if (slug === 'illusion-d-envol') {
    for (const x of [-0.5, -0.17, 0.17, 0.5]) for (const z of [-0.32, 0.32]) add([0.035, 0.5, 0.035, x, 0.25, z, 0, COUL.bois]);
    add([1.15, 0.035, 0.36, 0, 0.53, 0.17, 0, COUL.bois]);
    add([1.15, 0.035, 0.36, 0, 0.53, -0.17, 0, COUL.bois]);
    add([1.15, 0.04, 0.75, 0, 0.06, 0, 0, '#CDB794']);
  }
  return Object.entries(groups).map(([col, gs]) => ({ col, geo: mergeGeometries(gs, false)! }));
}

export const INDEX_SLUGS = Object.keys(MAQUETTES);

export default function IndexObjects() {
  const { camera, size } = useThree();
  const items = useMemo(() => INDEX_SLUGS.map((slug) => {
    const { x, z } = MAQUETTES[slug];
    const parts = buildParts(slug).map((p) => ({ ...p, mat: new THREE.MeshStandardMaterial({ color: p.col, roughness: 0.85, emissive: new THREE.Color(COUL.ocre), emissiveIntensity: 0 }) }));
    // la maquette s'appuie sur le point le plus bas de son emprise pour ne pas flotter
    const y = Math.min(terrainY(x - 0.3, z - 0.2), terrainY(x + 0.3, z + 0.2), terrainY(x, z));
    return { slug, x, y, z, parts };
  }), []);
  // halo doux (dégradé radial) dessiné par-dessus le relief, sans être coupé par lui
  const haloTex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!; const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const halos = useRef<(THREE.Mesh | null)[]>([]);
  const lift = useRef<number[]>(items.map(() => 0));
  const pos = useMemo(() => new THREE.Vector3(0, 2.3, 4.3), []);
  const look = useMemo(() => new THREE.Vector3(0, -1, -0.5), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const S = 0.32; // échelle des maquettes

  useEffect(() => { camera.position.copy(pos); camera.lookAt(look); }, [camera, pos, look]);

  useFrame((_, dt) => {
    // caméra : repos légèrement guidé par la souris, ou envol vers le projet choisi
    const f = items.find((i) => i.slug === live.focus);
    const wantPos = f ? new THREE.Vector3(f.x + 0.25, f.y + 0.55, f.z + 0.9) : new THREE.Vector3(live.pointer.x * 0.35, 2.3 + live.pointer.y * 0.12, 4.3);
    const wantLook = f ? new THREE.Vector3(f.x, f.y + 0.12, f.z) : new THREE.Vector3(0, -1, -0.5);
    const k = damp(dt, f ? 0.004 : 0.06);
    pos.lerp(wantPos, k);
    look.lerp(wantLook, k);
    camera.position.copy(pos);
    camera.lookAt(look);
    items.forEach((it, i) => {
      const on = live.hover === it.slug || live.focus === it.slug ? 1 : 0;
      lift.current[i] += (on - lift.current[i]) * damp(dt, 0.002);
      const l = lift.current[i];
      const g = groups.current[i];
      if (g) g.position.y = it.y + l * 0.04;
      it.parts.forEach((p) => (p.mat.emissiveIntensity = l * 0.35));
      const h = halos.current[i];
      if (h) { (h.material as THREE.MeshBasicMaterial).opacity = l * 0.55; h.scale.setScalar(0.8 + l * 0.4); }
      // étiquette DOM au-dessus de la maquette
      const el = live.labels[it.slug];
      if (el) {
        v.set(it.x, it.y + 0.3, it.z).project(camera);
        // le canvas couvre l'écran ; l'étiquette est placée dans sa section : on retire le décalage
        const pr = (el.offsetParent as HTMLElement | null)?.getBoundingClientRect();
        const x = (v.x * 0.5 + 0.5) * size.width - (pr?.left || 0), y = (-v.y * 0.5 + 0.5) * size.height - (pr?.top || 0);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        el.style.opacity = v.z < 1 ? '1' : '0';
      }
    });
  });

  return (
    <group>
      <hemisphereLight args={['#fff6ea', '#cdbba4', 1.0]} />
      <directionalLight position={[3, 4, 2]} intensity={2.2} color="#ffe0bd" />
      {items.map((it, i) => (
        <group key={it.slug}>
          <mesh ref={(m) => { halos.current[i] = m; }} rotation-x={-Math.PI / 2} position={[it.x, it.y + 0.03, it.z]} renderOrder={2}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshBasicMaterial color={COUL.ocre} alphaMap={haloTex} transparent opacity={0} depthWrite={false} depthTest={false} toneMapped={false} />
          </mesh>
          <group ref={(g) => { groups.current[i] = g; }} position={[it.x, it.y, it.z]} scale={S}>
            {it.parts.map((p, j) => <mesh key={j} geometry={p.geo} material={p.mat} />)}
          </group>
        </group>
      ))}
    </group>
  );
}
