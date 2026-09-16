import type * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { ZoneId } from './zones';
import { ZONES, HALLWAY } from './zones';
import { useWorldMaterials } from './materials';
import type { Vec3 } from '../state/playerStore';

type Seg = { pos: Vec3; size: Vec3 };
const seg = (cx: number, cy: number, cz: number, w: number, h: number, d: number): Seg => ({
  pos: [cx, cy, cz],
  size: [w, h, d],
});

function WallSegs({ segs, material }: { segs: Seg[]; material: THREE.Material }) {
  return (
    <>
      {segs.map((s, i) => (
        <mesh key={i} position={s.pos} material={material}>
          <boxGeometry args={s.size} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Per-zone architectural shell: floor, walls (with hallway doorway + window
 * openings), black ceiling, accent light cove, wall typography.
 * Zones are centered on the world origin; only one renders at a time.
 */
export function Shell({ zone }: { zone: ZoneId }) {
  const m = useWorldMaterials();
  const def = ZONES[zone];
  const hw = def.bounds.width / 2;
  const hd = def.bounds.depth / 2;
  const h = def.bounds.height;
  const t = 0.3; // wall thickness
  const doorHalf = HALLWAY.width / 2 + 0.15; // doorway opening half width
  const doorH = HALLWAY.height + 0.3;

  const floorMat = zone === 'studio' ? m.woodFloor : m.concrete;
  const wallMat = zone === 'studio' ? m.fabricWall : m.plaster;

  // Wall segments ---------------------------------------------------------
  // +x wall (studio) / -x wall (club) gets the hallway doorway.
  const hallSide = zone === 'studio' ? 1 : -1;
  const hallX = hallSide * (hw + t / 2);
  const doorWall: Seg[] = [
    // segment z in [-hd, -doorHalf]
    seg(hallX, h / 2, -(hd + doorHalf) / 2, t, h, hd - doorHalf),
    // segment z in [doorHalf, hd]
    seg(hallX, h / 2, (hd + doorHalf) / 2, t, h, hd - doorHalf),
    // lintel above doorway
    seg(hallX, (doorH + h) / 2, 0, t, h - doorH, doorHalf * 2),
  ];

  const farX = -hallSide * (hw + t / 2);
  const farWall: Seg[] = [seg(farX, h / 2, 0, t, h, hd * 2)];

  let backWall: Seg[]; // -z
  let frontWall: Seg[]; // +z
  if (zone === 'studio') {
    // -z: glass wall into the live room (opening x -8..8, y 0.8..4.2)
    backWall = [
      seg(-10, h / 2, -(hd + t / 2), 4, h, t),
      seg(10, h / 2, -(hd + t / 2), 4, h, t),
      seg(0, 0.4, -(hd + t / 2), 16, 0.8, t),
      seg(0, 5.1, -(hd + t / 2), 16, h - 4.2, t),
    ];
    // +z: window to the ocean (opening x -6..6, y 1.1..4.6)
    frontWall = [
      seg(-9, h / 2, hd + t / 2, 6, h, t),
      seg(9, h / 2, hd + t / 2, 6, h, t),
      seg(0, 0.55, hd + t / 2, 12, 1.1, t),
      seg(0, 5.3, hd + t / 2, 12, h - 4.6, t),
    ];
  } else {
    // -z: wide opening behind the stage framing night sky (x -5..5, y 0.4..5.6)
    backWall = [
      seg(-9, h / 2, -(hd + t / 2), 8, h, t),
      seg(9, h / 2, -(hd + t / 2), 8, h, t),
      seg(0, 0.2, -(hd + t / 2), 10, 0.4, t),
      seg(0, 6.3, -(hd + t / 2), 10, h - 5.6, t),
    ];
    frontWall = [seg(0, h / 2, hd + t / 2, hw * 2 + t * 2, h, t)];
  }

  return (
    <group>
      {/* floor + ceiling */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} material={floorMat}>
        <planeGeometry args={[hw * 2, hd * 2]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, h, 0]} material={m.ceiling}>
        <planeGeometry args={[hw * 2 + t * 2, hd * 2 + t * 2]} />
      </mesh>

      <WallSegs segs={backWall} material={wallMat} />
      <WallSegs segs={frontWall} material={wallMat} />
      <WallSegs segs={doorWall} material={wallMat} />
      <WallSegs segs={farWall} material={wallMat} />

      {/* accent light cove along the ceiling */}
      <mesh position={[0, h - 0.06, 0]}>
        <boxGeometry args={[hw * 1.5, 0.08, 0.3]} />
        <meshStandardMaterial color={def.accent} emissive={def.accent} emissiveIntensity={3} />
      </mesh>

      {/* door frame glow */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[hallSide * hw, doorH / 2, s * (doorHalf + 0.04)]}>
          <boxGeometry args={[0.06, doorH, 0.08]} />
          <meshStandardMaterial color={def.accent} emissive={def.accent} emissiveIntensity={1.6} />
        </mesh>
      ))}
      <mesh position={[hallSide * hw, doorH + 0.04, 0]}>
        <boxGeometry args={[0.06, 0.08, doorHalf * 2 + 0.15]} />
        <meshStandardMaterial color={def.accent} emissive={def.accent} emissiveIntensity={1.6} />
      </mesh>

      {/* wall typography */}
      {zone === 'studio' ? (
        <Text position={[0, 5.15, hd - 0.05]} rotation-y={Math.PI} fontSize={0.8} color="#f0f0f2" anchorX="center" letterSpacing={0.08}>
          APE STUDIO
        </Text>
      ) : (
        <Text position={[hw - 0.1, 4.4, 0]} rotation-y={-Math.PI / 2} fontSize={0.8} color="#cfd8ff" anchorX="center" letterSpacing={0.08}>
          APE CLUB
        </Text>
      )}
    </group>
  );
}
