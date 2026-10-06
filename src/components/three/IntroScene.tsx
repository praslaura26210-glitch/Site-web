'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { live } from '@/lib/store';

type IntroData = { w: number; h: number; lines: number[][]; strokes: number[][] };

const S = 1 / 1000; // 1 px du dessin = 1 mm dans la scène
const INK = new THREE.Color('#2B211C');
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Intro : 1) les lignes de construction se tracent, 2) les hachures apparaissent,
 * 3) le vrai dessin au crayon prend le relais, 4) les traits prennent du relief
 * (la caméra tourne autour), 5) la caméra plonge vers le terrain de l'accueil.
 * La progression (live.intro, 0 -> 1) est pilotée par le composant DOM <Intro>.
 */
export default function IntroScene() {
  const [data, setData] = useState<IntroData | null>(null);
  useEffect(() => {
    fetch('/media/intro/intro.json').then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return null;
  return <Drawing data={data} />;
}

function Drawing({ data }: { data: IntroData }) {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null!);
  const beams = useRef<THREE.InstancedMesh>(null!);
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load('/media/site/dessin-couverture-2000.webp');
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  const ox = data.w / 2, oy = data.h / 2;
  const X = (x: number) => (x - ox) * S;
  const Y = (y: number) => -(y - oy) * S;

  // lignes de construction : une poutre par ligne (instanciée), qui s'allonge puis prend de l'épaisseur
  const beamInfo = useMemo(() => {
    const n = data.lines.length;
    return data.lines.map(([x0, y0, x1, y1], i) => {
      const a = new THREE.Vector3(X(x0), Y(y0), 0), b = new THREE.Vector3(X(x1), Y(y1), 0);
      const len = a.distanceTo(b);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const vertical = Math.abs(Math.abs(ang) - Math.PI / 2) < 0.25;
      // départ échelonné : les plus longues d'abord (elles sont triées ainsi)
      const start = (i / n) * 0.62;
      // profondeur du relief : poteaux plus épais, lignes de fuite plus fines ; pseudo-aléatoire stable
      const r = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const depth = (vertical ? 0.018 : 0.008) + Math.abs(r) * 0.014;
      return { a, len, ang, start, depth, w: vertical ? 0.0042 : 0.003 };
    });
  }, [data]);

  // hachures : segments de ligne, chaque sommet porte son instant d'apparition
  const hatch = useMemo(() => {
    const pos: number[] = [], tt: number[] = [];
    const n = data.strokes.length;
    data.strokes.forEach((s, i) => {
      const t0 = i / n;
      for (let k = 0; k + 3 < s.length; k += 2) {
        pos.push(X(s[k]), Y(s[k + 1]), 0.0005, X(s[k + 2]), Y(s[k + 3]), 0.0005);
        const f0 = t0 + (k / s.length) * (1 / n) * 6, f1 = t0 + ((k + 2) / s.length) * (1 / n) * 6;
        tt.push(f0, f1);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uP: { value: 0 }, uA: { value: 1 }, uC: { value: INK } },
      vertexShader: `attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform float uP; uniform float uA; uniform vec3 uC; varying float vT;
        void main(){ if (vT > uP) discard; gl_FragColor = vec4(uC, uA * 0.78); }`,
    });
    return { g, m };
  }, [data]);

  const paperMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { map: { value: tex }, opacity: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `uniform sampler2D map; uniform float opacity; varying vec2 vUv;
          void main(){ vec3 c = texture2D(map, vUv).rgb; float a = clamp((1. - dot(c, vec3(.299,.587,.114))) * 1.35, 0., 1.);
            gl_FragColor = vec4(vec3(.17,.13,.11), a * opacity); }`,
      }),
    [tex],
  );
  const beamMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3B2D25', roughness: 0.75, metalness: 0, transparent: true }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const camFrom = useMemo(() => new THREE.Vector3(0, 0, 2.45), []);
  const camEnd = useMemo(() => new THREE.Vector3(0, 1.55, 4.6), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    camera.position.copy(camFrom);
    camera.lookAt(0, 0, 0);
    const img = tex.image as HTMLImageElement | undefined;
    const ready = () => window.dispatchEvent(new Event('lp-intro-pret'));
    if (img && img.complete) ready();
    else (tex as any).onUpdate = ready;
    const t = setTimeout(ready, 400);
    return () => clearTimeout(t);
  }, [camera, camFrom, tex]);

  useFrame(() => {
    const t = live.intro;
    // 1. construction (0 -> 0.32)
    const pDraw = seg(t, 0, 0.32);
    // 4. relief (0.56 -> 0.8)
    const pRelief = easeInOut(seg(t, 0.56, 0.8));
    // 5. plongée (0.78 -> 1)
    const pDive = easeInOut(seg(t, 0.78, 1));
    beamInfo.forEach((b, i) => {
      const lp = ease(seg(pDraw, b.start, b.start + 0.38));
      dummy.position.set(b.a.x + Math.cos(b.ang) * b.len * lp * 0.5, b.a.y + Math.sin(b.ang) * b.len * lp * 0.5, (b.depth * pRelief) / 2);
      dummy.rotation.set(0, 0, b.ang);
      dummy.scale.set(Math.max(1e-4, b.len * lp), b.w, Math.max(1e-4, 0.0015 + b.depth * pRelief));
      dummy.updateMatrix();
      beams.current.setMatrixAt(i, dummy.matrix);
    });
    beams.current.instanceMatrix.needsUpdate = true;
    beamMat.opacity = (1 - 0.25 * seg(t, 0.46, 0.6)) * (1 - pDive);

    // 2. hachures (0.16 -> 0.52), s'effacent quand le crayon arrive
    hatch.m.uniforms.uP.value = ease(seg(t, 0.16, 0.52)) * 1.02;
    hatch.m.uniforms.uA.value = 1 - seg(t, 0.5, 0.64);
    // 3. le dessin au crayon (0.46 -> 0.6), puis s'estompe pendant le relief
    paperMat.uniforms.opacity.value = seg(t, 0.46, 0.6) * (1 - 0.75 * pRelief) * (1 - pDive);

    // caméra : face au dessin -> rotation (relief) -> plongée vers le terrain
    const orbit = pRelief * 0.42;
    const r = 2.45 - pRelief * 0.25;
    const relief = new THREE.Vector3(Math.sin(orbit) * r, 0.1 * pRelief, Math.cos(orbit) * r);
    camera.position.copy(relief).lerp(camEnd, pDive);
    look.set(0, 0, 0).lerp(new THREE.Vector3(0, -1.0, -0.6), pDive);
    camera.lookAt(look);
    group.current.position.y = -pDive * 0.4;
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2.5, 1.2, 2]} intensity={1.6} color="#ffe2c4" />
      <mesh material={paperMat} position={[0, 0, -0.001]}>
        <planeGeometry args={[data.w * S, data.h * S]} />
      </mesh>
      <lineSegments geometry={hatch.g} material={hatch.m} />
      <instancedMesh ref={beams} args={[undefined, beamMat, beamInfo.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}
