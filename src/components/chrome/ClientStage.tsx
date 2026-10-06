'use client';
import dynamic from 'next/dynamic';

// Le canvas 3D n'est chargé que dans le navigateur, après le premier affichage.
const Stage = dynamic(() => import('@/components/three/Stage'), { ssr: false });
export default function ClientStage() {
  return <Stage />;
}
