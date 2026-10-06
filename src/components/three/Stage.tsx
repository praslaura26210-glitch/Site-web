'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { live, useStore } from '@/lib/store';
import { useQuality } from '@/lib/quality';
import IntroScene from './IntroScene';
import TerrainScene from './TerrainScene';
import BuildingScene from './BuildingScene';
import EscalierScene from './EscalierScene';
import EnvolScene from './EnvolScene';
import RucheScene from './RucheScene';
import IndexObjects from './IndexObjects';

/**
 * L'unique canvas WebGL du site, fixe derrière le contenu.
 * Il ne calcule des images que lorsqu'une zone 3D est visible (frameloop « never » sinon).
 */
export default function Stage() {
  const q = useQuality();
  const scene = useStore((s) => s.scene);
  const visible = useStore((s) => s.stageVisible);
  if (!q.ready || q.lite) return null;
  const active = visible && scene !== 'none';
  return (
    <div className="stage" aria-hidden="true" style={{ opacity: active ? 1 : 0, transition: 'opacity .6s' }}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ fov: 35, near: 0.05, far: 200, position: [0, 0, 2.45] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        shadows={scene !== 'intro' && scene !== 'terrain' && scene !== 'index'}
        onCreated={({ gl, invalidate }) => {
          gl.setClearColor(0xf2ece2, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.localClippingEnabled = true;
          live.invalidate = invalidate;
        }}
      >
        <Suspense fallback={null}>
          {(scene === 'intro' || scene === 'terrain' || scene === 'index') && <TerrainScene intro={scene === 'intro'} index={scene === 'index'} />}
          {scene === 'index' && <IndexObjects />}
          {scene === 'escalier' && <EscalierScene />}
          {scene === 'envol' && <EnvolScene />}
          {scene === 'ruche' && <RucheScene />}
          {scene === 'intro' && <IntroScene />}
          {scene === 'building' && <BuildingScene />}
        </Suspense>
      </Canvas>
    </div>
  );
}
