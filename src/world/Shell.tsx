import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { ROOM, PARTITION } from './room';
import {
  acousticWallMaterial,
  woodFloorMaterial,
  concreteFloorMaterial,
  woodSlatMaterial,
} from './materials';

const W = ROOM.width; // 52
const H = ROOM.height; // 6
const D = ROOM.depth; // 24
const HALF_W = W / 2;

const TILE_COLORS = ['#ff2d95', '#00e5ff', '#7a4dff', '#ffb300', '#22ff88'].map(
  (c) => new THREE.Color(c).multiplyScalar(1.4),
);

/** 10x8m emissive LED dance floor, one InstancedMesh, slow color cycling. */
function DanceFloor({ center = [12, 0.01, 0] }: { center?: [number, number, number] }) {
  const cols = 10;
  const rows = 8;
  const count = cols * rows;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const acc = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    let i = 0;
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        dummy.position.set(x - cols / 2 + 0.5, 0, z - rows / 2 + 0.5);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        m.setColorAt(i, TILE_COLORS[(x + z) % TILE_COLORS.length]);
        i++;
      }
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [dummy]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    acc.current += dt;
    if (acc.current < 0.6) return;
    acc.current = 0;
    const t = performance.now() / 1000;
    let i = 0;
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        m.setColorAt(i, TILE_COLORS[(x + z + Math.floor(t)) % TILE_COLORS.length]);
        i++;
      }
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      position={center}
    >
      <boxGeometry args={[0.96, 0.02, 0.96]} />
      {/* basic material + per-instance HDR-ish color so tiles glow/bloom */}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** Two horizontal emissive LED strips around the club walls (y=1, y=4). */
function ClubWallStrips() {
  const cLen = HALF_W; // club half-width
  const stripMat = (color: string) => (
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} />
  );
  return (
    <group>
      {[1, 4].map((y) => (
        <group key={y}>
          {/* back wall (-z) club half */}
          <mesh position={[HALF_W / 2, y, -D / 2 + 0.03]}>
            <boxGeometry args={[cLen, 0.08, 0.05]} />
            {stripMat(y === 1 ? '#ff2d95' : '#00e5ff')}
          </mesh>
          {/* front wall (+z) club half */}
          <mesh position={[HALF_W / 2, y, D / 2 - 0.03]}>
            <boxGeometry args={[cLen, 0.08, 0.05]} />
            {stripMat(y === 1 ? '#00e5ff' : '#ff2d95')}
          </mesh>
          {/* +x wall */}
          <mesh position={[HALF_W - 0.03, y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[D, 0.08, 0.05]} />
            {stripMat(y === 1 ? '#ff2d95' : '#00e5ff')}
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Partition at x=0 with a 5m doorway, glow frame and zone labels. */
function Partition() {
  const t = PARTITION.thickness;
  const dh = PARTITION.doorHalf;
  const sideLen = D / 2 - dh;
  const sideCenter = dh + sideLen / 2;
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#26262e', roughness: 0.85 }),
    [],
  );
  return (
    <group>
      {/* wall segments either side of the doorway */}
      <mesh position={[PARTITION.x, H / 2, -sideCenter]} material={wallMat}>
        <boxGeometry args={[t, H, sideLen]} />
      </mesh>
      <mesh position={[PARTITION.x, H / 2, sideCenter]} material={wallMat}>
        <boxGeometry args={[t, H, sideLen]} />
      </mesh>
      {/* lintel above the doorway */}
      <mesh position={[PARTITION.x, (H + 3) / 2, 0]} material={wallMat}>
        <boxGeometry args={[t, H - 3, dh * 2]} />
      </mesh>
      {/* doorway glow frame */}
      <mesh position={[PARTITION.x, 3.02, 0]}>
        <boxGeometry args={[t + 0.08, 0.06, dh * 2 + 0.1]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.5} />
      </mesh>
      {[-dh, dh].map((z) => (
        <mesh key={z} position={[PARTITION.x, 1.5, z + (z < 0 ? -0.04 : 0.04)]}>
          <boxGeometry args={[t + 0.08, 3, 0.06]} />
          <meshStandardMaterial color="#ff2d95" emissive="#ff2d95" emissiveIntensity={2.5} />
        </mesh>
      ))}
      {/* labels above the doorway, one facing each zone */}
      <Text
        position={[-t / 2 - 0.02, 3.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.4}
        color="#ffd9a8"
        anchorX="center"
      >
        RECORDING STUDIO
      </Text>
      <Text
        position={[t / 2 + 0.02, 3.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.4}
        color="#00e5ff"
        anchorX="center"
      >
        DJ CLUB
      </Text>
    </group>
  );
}

const SPOT_COLORS = ['#ff2d95', '#00e5ff', '#7a4dff', '#ffb300', '#22ff88', '#ff5544'];

/** Lighting truss with 6 color-cycling spotlights over the dance floor. */
function Truss() {
  const spots = useRef<(THREE.SpotLight | null)[]>([]);
  const targets = useRef<(THREE.Object3D | null)[]>([]);
  const hue = useRef(0);

  useFrame((_, dt) => {
    hue.current = (hue.current + dt * 0.05) % 1;
    const col = new THREE.Color();
    for (let i = 0; i < spots.current.length; i++) {
      const s = spots.current[i];
      if (!s) continue;
      col.setHSL((hue.current + i / 6) % 1, 0.9, 0.55);
      s.color.copy(col);
    }
  });

  return (
    <group position={[12, 0, 0]}>
      {/* truss frame */}
      <mesh position={[0, 5.4, 0]}>
        <boxGeometry args={[11, 0.15, 0.15]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.4, -4]}>
        <boxGeometry args={[11, 0.15, 0.15]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, 5.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 4, 8]} />
          <meshStandardMaterial color="#2a2a30" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const x = -4.5 + i * 1.8;
        const z = i % 2 === 0 ? 0 : -4;
        return (
          <group key={i}>
            <spotLight
              ref={(el) => {
                spots.current[i] = el;
              }}
              position={[x, 5.3, z]}
              angle={0.5}
              penumbra={0.6}
              intensity={30}
              distance={20}
              color={SPOT_COLORS[i]}
            />
            <object3D
              ref={(el) => {
                targets.current[i] = el;
                if (el && spots.current[i]) spots.current[i]!.target = el;
              }}
              position={[x * 0.6, 0, z * 0.6]}
            />
          </group>
        );
      })}
    </group>
  );
}

export function Shell() {
  const acoustic = useMemo(acousticWallMaterial, []);
  const woodFloor = useMemo(woodFloorMaterial, []);
  const concrete = useMemo(concreteFloorMaterial, []);
  const slat = useMemo(woodSlatMaterial, []);
  const darkWall = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0e0e14', roughness: 0.9 }),
    [],
  );
  const ceilingMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#101014', roughness: 1 }),
    [],
  );

  const studioWallSegments: { pos: [number, number, number]; rotY: number; size: [number, number] }[] = [
    { pos: [-HALF_W / 2, H / 2, -D / 2], rotY: 0, size: [HALF_W, H] }, // -z studio half
    { pos: [-HALF_W / 2, H / 2, D / 2], rotY: Math.PI, size: [HALF_W, H] }, // +z studio half
    { pos: [-HALF_W, H / 2, 0], rotY: Math.PI / 2, size: [D, H] }, // -x wall
  ];
  const clubWallSegments: { pos: [number, number, number]; rotY: number; size: [number, number] }[] = [
    { pos: [HALF_W / 2, H / 2, -D / 2], rotY: 0, size: [HALF_W, H] },
    { pos: [HALF_W / 2, H / 2, D / 2], rotY: Math.PI, size: [HALF_W, H] },
    { pos: [HALF_W, H / 2, 0], rotY: -Math.PI / 2, size: [D, H] },
  ];

  return (
    <group>
      {/* floors */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-HALF_W / 2, 0, 0]} material={woodFloor} receiveShadow>
        <planeGeometry args={[HALF_W, D]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[HALF_W / 2, 0, 0]} material={concrete} receiveShadow>
        <planeGeometry args={[HALF_W, D]} />
      </mesh>
      <DanceFloor />

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]} material={ceilingMat}>
        <planeGeometry args={[W, D]} />
      </mesh>

      {/* studio walls: acoustic foam + wood slat band at y~1.4 */}
      {studioWallSegments.map((w, i) => (
        <group key={i}>
          <mesh position={w.pos} rotation={[0, w.rotY, 0]} material={acoustic}>
            <planeGeometry args={w.size} />
          </mesh>
          {/* slat accent band, inset slightly into the room */}
          <mesh
            position={[
              w.pos[0] + (w.rotY === Math.PI / 2 ? 0.02 : 0),
              1.4,
              w.pos[2] + (w.rotY === 0 ? 0.02 : w.rotY === Math.PI ? -0.02 : 0),
            ]}
            rotation={[0, w.rotY, 0]}
            material={slat}
          >
            <planeGeometry args={[w.size[0], 0.9]} />
          </mesh>
        </group>
      ))}

      {/* club walls: dark matte + LED strips */}
      {clubWallSegments.map((w, i) => (
        <mesh key={i} position={w.pos} rotation={[0, w.rotY, 0]} material={darkWall}>
          <planeGeometry args={w.size} />
        </mesh>
      ))}
      <ClubWallStrips />
      <Partition />
      <Truss />
    </group>
  );
}
