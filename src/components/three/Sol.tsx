'use client';

/** Sol couleur papier + ombres portées translucides : la maquette se pose sur la page. */
export default function Sol({ y = 0, opacity = 0.16 }: { y?: number; opacity?: number }) {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, y - 0.01, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial color="#F2ECE2" toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <shadowMaterial opacity={opacity} color="#4a3426" />
      </mesh>
    </>
  );
}
