import { useMemo } from 'react';
import * as THREE from 'three';
import { Grid } from '@react-three/drei';
import { ROOM } from './room';
import { BOOTH } from './booth';

/** Procedural acoustic-panel material (alternating wedge stripes). */
function useAcousticMaterial() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const shade = 30 + ((x + y) % 2) * 22;
          ctx.fillStyle = `rgb(${shade},${shade},${shade + 6})`;
          ctx.fillRect(x * 32, y * 32, 32, 32);
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(x * 32, y * 32, 32, 4);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 3);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  }, []);
}

function Wall({ position, rotation, size }: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
}) {
  const mat = useAcousticMaterial();
  return (
    <mesh position={position} rotation={rotation} material={mat}>
      <planeGeometry args={size} />
    </mesh>
  );
}

/** Mixing console: sloped desk + knobs. */
function MixingDesk() {
  const knobs = useMemo(() => {
    const arr: [number, number][] = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 10; c++) arr.push([-1.1 + c * 0.24, 0.12 + r * 0.14]);
    return arr;
  }, []);
  return (
    <group position={[0, 0, -4]} rotation={[0, Math.PI, 0]}>
      {/* desk body */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[3, 0.9, 1.2]} />
        <meshStandardMaterial color="#2a2a33" roughness={0.7} />
      </mesh>
      {/* sloped console top */}
      <mesh position={[0, 0.98, 0.1]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[2.8, 0.08, 0.9]} />
        <meshStandardMaterial color="#3a3f4a" roughness={0.5} metalness={0.3} />
      </mesh>
      {knobs.map(([x, z], i) => (
        <mesh key={i} position={[x, 1.06 + z * 0.35, z + 0.1]} rotation={[-0.35, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 12]} />
          <meshStandardMaterial color={i % 7 === 0 ? '#ff5533' : '#c0c4cc'} />
        </mesh>
      ))}
      {/* meter bridge */}
      <mesh position={[0, 1.25, -0.35]}>
        <boxGeometry args={[2.6, 0.4, 0.1]} />
        <meshStandardMaterial color="#1c1f26" emissive="#223322" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function SpeakerMonitor({ position, rotation = [0, 0, 0] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.6, 0.35]} />
        <meshStandardMaterial color="#151518" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0.18]}>
        <cylinderGeometry args={[0.09, 0.09, 0.02, 24]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[0, -0.15, 0.18]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 24]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
}

/** Glass-walled vocal booth with a door opening on the -x wall. */
function VocalBooth() {
  const [cx, , cz] = BOOTH.center;
  const [hx, hy, hz] = BOOTH.half;
  const glass = (
    <meshPhysicalMaterial
      color="#aadcff"
      transparent
      opacity={0.18}
      roughness={0.1}
      side={THREE.DoubleSide}
    />
  );
  const frame = <meshStandardMaterial color="#30333c" roughness={0.5} />;
  return (
    <group position={[cx, 0, cz]}>
      {/* floor pad */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[hx * 2, 0.04, hz * 2]} />
        <meshStandardMaterial color="#22242c" roughness={0.9} />
      </mesh>
      {/* roof */}
      <mesh position={[0, hy * 2, 0]}>
        <boxGeometry args={[hx * 2 + 0.2, 0.1, hz * 2 + 0.2]} />
        {frame}
      </mesh>
      {/* +x wall (glass) */}
      <mesh position={[hx, hy, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[hz * 2, hy * 2]} />
        {glass}
      </mesh>
      {/* -x wall with door opening: two glass segments + lintel */}
      <mesh position={[-hx, hy, BOOTH.doorWidth / 2 + (hz * 2 - BOOTH.doorWidth) / 4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[(hz * 2 - BOOTH.doorWidth) / 2, hy * 2]} />
        {glass}
      </mesh>
      <mesh position={[-hx, hy, -(BOOTH.doorWidth / 2 + (hz * 2 - BOOTH.doorWidth) / 4)]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[(hz * 2 - BOOTH.doorWidth) / 2, hy * 2]} />
        {glass}
      </mesh>
      <mesh position={[-hx, hy * 2 - 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[BOOTH.doorWidth, 0.5]} />
        {glass}
      </mesh>
      {/* +z and -z walls */}
      <mesh position={[0, hy, hz]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[hx * 2, hy * 2]} />
        {glass}
      </mesh>
      <mesh position={[0, hy, -hz]}>
        <planeGeometry args={[hx * 2, hy * 2]} />
        {glass}
      </mesh>
      {/* mic stand inside */}
      <group position={[0.4, 0, 0]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.6, 8]} />
          <meshStandardMaterial color="#888" />
        </mesh>
        <mesh position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.06, 16, 12]} />
          <meshStandardMaterial color="#222" roughness={0.4} />
        </mesh>
      </group>
      <pointLight position={[0, hy * 2 - 0.4, 0]} intensity={4} distance={6} color="#bcd8ff" />
    </group>
  );
}

/** Raised stage / DJ platform at the far end of the room. */
function Stage() {
  return (
    <group position={[0, 0, -8]}>
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[10, 0.5, 4]} />
        <meshStandardMaterial color="#1e1b26" roughness={0.8} />
      </mesh>
      {/* edge glow strip */}
      <mesh position={[0, 0.52, 1.98]}>
        <boxGeometry args={[10, 0.04, 0.04]} />
        <meshStandardMaterial color="#7a4dff" emissive="#7a4dff" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 3, 0]} intensity={12} distance={12} color="#9d7bff" />
    </group>
  );
}

export function Studio() {
  const W = ROOM.width;
  const H = ROOM.height;
  const D = ROOM.depth;
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#181820" roughness={0.9} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[W, D]}
        cellSize={1}
        cellColor="#2c2c3c"
        sectionSize={5}
        sectionColor="#4a4a6a"
        fadeDistance={40}
        infiniteGrid={false}
      />
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#101014" roughness={1} />
      </mesh>
      {/* acoustic walls */}
      <Wall position={[0, H / 2, -D / 2]} rotation={[0, 0, 0]} size={[W, H]} />
      <Wall position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]} size={[W, H]} />
      <Wall position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[D, H]} />
      <Wall position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[D, H]} />

      <MixingDesk />
      <SpeakerMonitor position={[-1.4, 1.5, -4.9]} rotation={[0, 0.4, 0]} />
      <SpeakerMonitor position={[1.4, 1.5, -4.9]} rotation={[0, -0.4, 0]} />
      {/* wall-mounted mains */}
      <SpeakerMonitor position={[-6, 2.4, -9.4]} />
      <SpeakerMonitor position={[6, 2.4, -9.4]} />
      <Stage />
      <VocalBooth />

      {/* lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5.5, 4]} intensity={0.7} castShadow />
      <pointLight position={[0, 4.5, 0]} intensity={20} distance={25} color="#ffe8cc" />
      <pointLight position={[-8, 3, 5]} intensity={8} distance={15} color="#88aaff" />
    </group>
  );
}
