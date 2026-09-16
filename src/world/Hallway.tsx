import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { ZONES, HALLWAY, type ZoneId } from './zones';
import { useWorldMaterials } from './materials';

/** Animated swirling disc texture in the target zone's accent color. */
function useSwirlTexture(accent: string) {
  const tex = useMemo((): { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture } => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex: t };
  }, []);
  const last = useRef(0);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (t - last.current < 1 / 15) return;
    last.current = t;
    const ctx = tex.canvas.getContext('2d');
    if (!ctx) return;
    const cx = 64;
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + t * 0.9 + i * 0.25;
      const r = 8 + ((i * 37 + t * 22) % 56);
      const g = ctx.createRadialGradient(cx + Math.cos(a) * r, cx + Math.sin(a) * r, 0, cx + Math.cos(a) * r, cx + Math.sin(a) * r, 16);
      g.addColorStop(0, accent);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cx + Math.sin(a) * r, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    tex.tex.needsUpdate = true;
  });
  return tex.tex;
}

/** Black corridor with accent LED lines ending in the zone-switch portal. */
export function Hallway({ zone }: { zone: ZoneId }) {
  const m = useWorldMaterials();
  const def = ZONES[zone];
  const target = ZONES[def.portal.target];
  const swirl = useSwirlTexture(target.accent);
  const side = def.portal.position[0] > 0 ? 1 : -1;
  const hw = def.bounds.width / 2;
  const cx = side * (hw + HALLWAY.length / 2); // hallway center x
  const hwW = HALLWAY.width / 2;
  const hH = HALLWAY.height;

  return (
    <group>
      {/* floor / ceiling / walls */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0, 0]} material={m.black}>
        <planeGeometry args={[HALLWAY.length + 1, HALLWAY.width]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[cx, hH, 0]} material={m.black}>
        <planeGeometry args={[HALLWAY.length + 1, HALLWAY.width]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[cx, hH / 2, s * hwW]} rotation-y={s > 0 ? Math.PI : 0} material={m.black}>
          <planeGeometry args={[HALLWAY.length + 1, hH]} />
        </mesh>
      ))}
      {/* end cap behind the portal */}
      <mesh position={[side * (hw + HALLWAY.length + 0.2), hH / 2, 0]} rotation-y={side > 0 ? -Math.PI / 2 : Math.PI / 2} material={m.black}>
        <planeGeometry args={[HALLWAY.width + 0.6, hH + 0.6]} />
      </mesh>

      {/* accent LED line on each wall leading to the portal */}
      {[-1, 1].map((s) => (
        <mesh key={`led${s}`} position={[cx, 1.2, s * (hwW - 0.02)]}>
          <boxGeometry args={[HALLWAY.length, 0.04, 0.02]} />
          <meshStandardMaterial color={target.accent} emissive={target.accent} emissiveIntensity={2.5} />
        </mesh>
      ))}

      {/* portal: chrome torus + swirling disc + label */}
      <group position={def.portal.position} rotation-y={def.portal.yaw}>
        <mesh material={m.chrome}>
          <torusGeometry args={[1.2, 0.07, 16, 48]} />
        </mesh>
        <mesh>
          <circleGeometry args={[1.14, 40]} />
          <meshBasicMaterial map={swirl} transparent opacity={0.95} />
        </mesh>
        <pointLight color={target.accent} intensity={8} distance={5} position={[0, 0, side * 0.5]} />
        <Text position={[0, 1.75, 0]} fontSize={0.32} color="#e8e8ec" anchorX="center" letterSpacing={0.1}>
          {`→ ${target.label}`}
        </Text>
      </group>
    </group>
  );
}
