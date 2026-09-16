import { useMemo } from 'react';
import * as THREE from 'three';
import { Sky } from '@react-three/drei';
import type { ZoneId } from './zones';

/**
 * Sky + ocean horizon visible only through window/stage openings.
 * Studio: low warm sun via drei Sky. Club: a dark-blue night gradient
 * backdrop — the physical sky model renders muddy brown with a sub-horizon
 * sun, so the night view is a procedural gradient instead.
 */
export function Outside({ zone }: { zone: ZoneId }) {
  const night = zone === 'club';
  const nightSky = useMemo(() => {
    if (!night) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#030614');
      g.addColorStop(0.55, '#0a1638');
      g.addColorStop(0.8, '#122452');
      g.addColorStop(1, '#050a18');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 4, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [night]);

  return (
    <group>
      {night ? (
        nightSky && (
          <mesh position={[0, 18, -60]}>
            <planeGeometry args={[220, 60]} />
            <meshBasicMaterial map={nightSky} fog={false} />
          </mesh>
        )
      ) : (
        <Sky
          distance={4500}
          sunPosition={[50, 9, -60]}
          turbidity={6}
          rayleigh={1.2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      )}
      <mesh rotation-x={-Math.PI / 2} position={[0, -2, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          color={night ? '#050a18' : '#0b2038'}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}
