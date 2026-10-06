'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/lib/store';
import { COUL, damp, ease, matte, seg, steel } from './common';
import Sol from './Sol';

// Cotes relevées sur les plans techniques de Laura (mm -> m)
const N = 16; // contremarches de 183 mm pour 2 930 mm
const H = 2.93;
const h = H / N;
const g = 0.25; // giron
const LARG = 0.8;
const RUN = (N - 1) * g;
const GC = 0.968; // hauteur du garde-corps

/**
 * Escalier suspendu : la dalle, le limon, puis les marches une à une, les barreaux et la main courante.
 * live.rise (0 -> 1) est piloté par le scroll ; live.orbit fait tourner la caméra.
 */
export default function EscalierScene() {
  const { camera } = useThree();
  const mats = useMemo(() => ({ acier: steel(), chene: matte(COUL.chene, { roughness: 0.7 }), dalle: matte('#E4DCCF') }), []);
  const limon = useRef<THREE.Mesh>(null!);
  const marches = useRef<THREE.Group>(null!);
  const barreaux = useRef<THREE.Group>(null!);
  const main = useRef<THREE.Mesh>(null!);
  const palier = useRef<THREE.Group>(null!);
  const dalles = useRef<THREE.Group>(null!);
  const sm = useRef({ r: 0 });
  const pos = useMemo(() => new THREE.Vector3(8, 4, 6), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);

  // géométrie du limon : tube 100 x 200 sous le nez des marches
  const slope = Math.atan2(H - h, RUN);
  const limonLen = Math.hypot(RUN, H - h) + 0.5;
  const handLen = Math.hypot(RUN, H - h);

  // géométries dont l'origine est à une extrémité (elles grandissent depuis leur pied)
  const geoLimon = useMemo(() => new THREE.BoxGeometry(limonLen, 0.2, 0.1).translate(limonLen / 2, -0.17, 0), [limonLen]);
  const geoMain = useMemo(() => new THREE.BoxGeometry(handLen, 0.04, 0.04).translate(handLen / 2, 0, 0), [handLen]);

  useEffect(() => { camera.position.copy(pos); }, [camera, pos]);

  useFrame((_, dt) => {
    const s = sm.current;
    s.r += (live.rise - s.r) * damp(dt, 0.004);
    const r = s.r;
    dalles.current.scale.y = Math.max(0.01, ease(seg(r, 0, 0.12)));
    const pl = ease(seg(r, 0.12, 0.34));
    limon.current.scale.set(Math.max(0.001, pl), 1, 1);
    marches.current.children.forEach((m, i) => {
      const t = ease(seg(r, 0.34 + (i / N) * 0.4, 0.34 + (i / N) * 0.4 + 0.06));
      m.visible = t > 0.001;
      m.position.y = (i + 1) * h + (1 - t) * 0.7;
      m.scale.setScalar(0.6 + 0.4 * t);
    });
    barreaux.current.children.forEach((b, i, all) => {
      const t = ease(seg(r, 0.74 + (i / all.length) * 0.14, 0.74 + (i / all.length) * 0.14 + 0.05));
      b.visible = t > 0.001;
      b.scale.y = Math.max(0.001, t);
    });
    const mh = ease(seg(r, 0.9, 1));
    main.current.visible = mh > 0.001;
    main.current.scale.x = Math.max(0.001, mh);
    palier.current.visible = mh > 0.001;
    palier.current.scale.y = Math.max(0.001, mh);

    // caméra : tour lent autour de l'escalier
    const a = 0.65 + live.orbit * 1.3;
    tgt.set(RUN / 2 + 0.4, 1.35, 0);
    const want = new THREE.Vector3(tgt.x + Math.cos(a) * 8.4, 2.8 + live.orbit * 1.4, Math.sin(a) * 8.4);
    pos.lerp(want, damp(dt, 0.02));
    camera.position.copy(pos);
    camera.lookAt(tgt);
  });

  const pasNez = (i: number) => [i * g, (i + 1) * h] as const;

  return (
    <group>
      <hemisphereLight args={['#fff6ea', '#cdbba4', 0.95]} />
      <directionalLight position={[6, 9, 5]} intensity={2.6} color="#ffe0bd" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <Sol y={0} />
      {/* dalles basse et haute */}
      <group ref={dalles}>
        <mesh material={mats.dalle} position={[RUN + g / 2 + 0.9, H - 0.14, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.28, 2.2]} />
        </mesh>
        <mesh material={mats.dalle} position={[RUN / 2, -0.06, 0]} receiveShadow>
          <boxGeometry args={[RUN + 3, 0.12, 2.2]} />
        </mesh>
      </group>
      {/* limon : départ au pied de l'escalier, pivot à son origine */}
      <group position={[-0.25, 0.05, 0]} rotation-z={slope}>
        <mesh ref={limon} material={mats.acier} geometry={geoLimon} castShadow />
      </group>
      {/* marches : plateau de chêne sur tôle pliée */}
      <group ref={marches}>
        {Array.from({ length: N - 1 }, (_, i) => {
          const [x] = pasNez(i);
          return (
            <group key={i} position={[x + g / 2, (i + 1) * h, 0]}>
              <mesh material={mats.chene} position={[0, -0.02, 0]} castShadow receiveShadow><boxGeometry args={[g + 0.03, 0.04, LARG]} /></mesh>
              <mesh material={mats.acier} position={[-(g + 0.03) / 2, -0.06, 0]} castShadow><boxGeometry args={[0.008, 0.08, LARG]} /></mesh>
            </group>
          );
        })}
      </group>
      {/* barreaux côté vide */}
      <group ref={barreaux}>
        {Array.from({ length: N - 1 }, (_, i) => {
          const [x, y] = pasNez(i);
          const top = y + GC + 0.08;
          return (
            <group key={i} position={[x + g / 2, y, LARG / 2 - 0.03]}>
              <mesh material={mats.acier} position={[0, (top - y) / 2, 0]} castShadow><cylinderGeometry args={[0.009, 0.009, top - y, 8]} /></mesh>
            </group>
          );
        })}
      </group>
      {/* main courante */}
      <group position={[g / 2, h + GC + 0.08, LARG / 2 - 0.03]} rotation-z={slope}>
        <mesh ref={main} material={mats.acier} geometry={geoMain} castShadow />
      </group>
      {/* garde-corps du palier (1 230 mm) */}
      <group ref={palier} position={[RUN + g, H, LARG / 2 - 0.03]}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} material={mats.acier} position={[0.05 + i * 0.105, GC / 2, 0]} castShadow><cylinderGeometry args={[0.009, 0.009, GC, 8]} /></mesh>
        ))}
        <mesh material={mats.acier} position={[0.62, GC, 0]}><boxGeometry args={[1.23, 0.04, 0.04]} /></mesh>
      </group>
    </group>
  );
}
