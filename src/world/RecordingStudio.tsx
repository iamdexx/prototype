import { useMemo } from 'react';
import * as THREE from 'three';
import { BOOTH } from './booth';
import { useWorldMaterials } from './materials';
import { ZONES } from './zones';

const AMBER = ZONES.studio.accent;

/** Mixing console: sloped desk + knobs, facing +z (user walks up to it). */
function MixingDesk() {
  const m = useWorldMaterials();
  const knobs = useMemo(() => {
    const arr: [number, number][] = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 10; c++) arr.push([-1.1 + c * 0.24, 0.12 + r * 0.14]);
    return arr;
  }, []);
  return (
    <group position={[0, 0, -5]}>
      <mesh position={[0, 0.45, 0]} castShadow material={m.black}>
        <boxGeometry args={[3, 0.9, 1.2]} />
      </mesh>
      <mesh position={[0, 0.98, 0.1]} rotation={[-0.35, 0, 0]} castShadow material={m.metal}>
        <boxGeometry args={[2.8, 0.08, 0.9]} />
      </mesh>
      {knobs.map(([x, z], i) => (
        <mesh key={i} position={[x, 1.06 + z * 0.35, z + 0.1]} rotation={[-0.35, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 12]} />
          <meshStandardMaterial color={i % 7 === 0 ? AMBER : '#c8ccd4'} />
        </mesh>
      ))}
      {/* VU strip */}
      <mesh position={[0, 1.25, -0.35]}>
        <boxGeometry args={[2.6, 0.4, 0.1]} />
        <meshStandardMaterial color="#14161c" emissive={AMBER} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function SpeakerMonitor({ position, rotation = [0, 0, 0] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const m = useWorldMaterials();
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow material={m.black}>
        <boxGeometry args={[0.4, 0.6, 0.35]} />
      </mesh>
      <mesh position={[0, 0.1, 0.18]} material={m.chrome}>
        <cylinderGeometry args={[0.09, 0.09, 0.02, 24]} />
      </mesh>
      <mesh position={[0, -0.15, 0.18]} material={m.chrome}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 24]} />
      </mesh>
    </group>
  );
}

/** Glass-walled vocal booth, door opening on the +x wall. */
function VocalBooth() {
  const m = useWorldMaterials();
  const [cx, , cz] = BOOTH.center;
  const [hx, hy, hz] = BOOTH.half;
  const glass = (
    <meshPhysicalMaterial
      color="#cfe4f4"
      transparent
      opacity={0.16}
      roughness={0.08}
      metalness={0.1}
      side={THREE.DoubleSide}
    />
  );
  const doorZ = BOOTH.doorWidth / 2 + (hz * 2 - BOOTH.doorWidth) / 4;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 0.02, 0]} material={m.black}>
        <boxGeometry args={[hx * 2, 0.04, hz * 2]} />
      </mesh>
      <mesh position={[0, hy * 2, 0]} material={m.chrome}>
        <boxGeometry args={[hx * 2 + 0.2, 0.1, hz * 2 + 0.2]} />
      </mesh>
      {/* -x wall (solid glass) */}
      <mesh position={[-hx, hy, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[hz * 2, hy * 2]} />
        {glass}
      </mesh>
      {/* +x wall with door opening */}
      <mesh position={[hx, hy, doorZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[(hz * 2 - BOOTH.doorWidth) / 2, hy * 2]} />
        {glass}
      </mesh>
      <mesh position={[hx, hy, -doorZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[(hz * 2 - BOOTH.doorWidth) / 2, hy * 2]} />
        {glass}
      </mesh>
      <mesh position={[hx, hy * 2 - 0.25, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[BOOTH.doorWidth, 0.5]} />
        {glass}
      </mesh>
      <mesh position={[0, hy, hz]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[hx * 2, hy * 2]} />
        {glass}
      </mesh>
      <mesh position={[0, hy, -hz]}>
        <planeGeometry args={[hx * 2, hy * 2]} />
        {glass}
      </mesh>
      {/* mic stand inside */}
      <group position={[-0.4, 0, 0]}>
        <mesh position={[0, 0.8, 0]} material={m.chrome}>
          <cylinderGeometry args={[0.015, 0.015, 1.6, 8]} />
        </mesh>
        <mesh position={[0, 1.62, 0]} material={m.black}>
          <sphereGeometry args={[0.06, 16, 12]} />
        </mesh>
      </group>
      <pointLight position={[0, hy * 2 - 0.4, 0]} intensity={5} distance={6} color={AMBER} />
    </group>
  );
}

/** Live room behind the -z glass wall: dark recess + a single lit mic. */
function LiveRoom() {
  return (
    <group>
      {/* glass pane in the wall opening */}
      <mesh position={[0, 2.5, -8.1]}>
        <planeGeometry args={[16, 3.4]} />
        <meshPhysicalMaterial color="#d8ecff" transparent opacity={0.14} roughness={0.05} metalness={0.15} />
      </mesh>
      {/* recess walls — wider than the glass so the sky can't leak in */}
      <mesh position={[0, 3, -10.2]}>
        <planeGeometry args={[26, 7]} />
        <meshStandardMaterial color="#0a0a10" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, -9.15]}>
        <planeGeometry args={[26, 2.4]} />
        <meshStandardMaterial color="#101018" roughness={0.9} />
      </mesh>
      {/* dim amber mic silhouette inside */}
      <mesh position={[0, 0.9, -9.4]}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
        <meshStandardMaterial color="#3a3a42" />
      </mesh>
      <mesh position={[0, 1.75, -9.4]}>
        <sphereGeometry args={[0.08, 12, 10]} />
        <meshStandardMaterial color="#1c1c22" emissive={AMBER} emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 2.6, -9.4]} intensity={6} distance={5} color={AMBER} />
    </group>
  );
}

function Couch({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const m = useWorldMaterials();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-0.7, 0, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]} material={m.leather}>
          <boxGeometry args={[0.68, 0.3, 0.8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.65, -0.35]} material={m.leather}>
        <boxGeometry args={[2.1, 0.7, 0.15]} />
      </mesh>
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} material={m.leather}>
          <boxGeometry args={[0.15, 0.5, 0.8]} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable({ position }: { position: [number, number, number] }) {
  const m = useWorldMaterials();
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} material={m.chrome}>
        <boxGeometry args={[1.1, 0.05, 0.55]} />
      </mesh>
      {[[-0.45, -0.2], [0.45, -0.2], [-0.45, 0.2], [0.45, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.17, z]} material={m.black}>
          <cylinderGeometry args={[0.02, 0.02, 0.34, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function RackUnit({ position, rotation = 0, seed }: { position: [number, number, number]; rotation?: number; seed: number }) {
  const m = useWorldMaterials();
  const leds = useMemo(() => {
    const arr: { pos: [number, number, number]; color: string }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 4; c++) {
        if ((r * 4 + c + seed) % 3 === 0) continue;
        arr.push({
          pos: [-0.21 + c * 0.14, 0.2 + r * 0.19, 0.21],
          color: (r + c + seed) % 5 === 0 ? '#ffffff' : AMBER,
        });
      }
    }
    return arr;
  }, [seed]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.9, 0]} castShadow material={m.black}>
        <boxGeometry args={[0.55, 1.8, 0.4]} />
      </mesh>
      {leds.map((l, i) => (
        <mesh key={i} position={l.pos}>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshStandardMaterial color={l.color} emissive={l.color} emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

function SynthKeyboard({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const m = useWorldMaterials();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[[-0.3, 0.5], [-0.3, -0.5], [0.3, 0.5], [0.3, -0.5]].map(([x, r], i) => (
        <mesh key={i} position={[x, 0.35, 0]} rotation={[0, 0, r]} material={m.chrome}>
          <boxGeometry args={[0.04, 0.8, 0.04]} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0]} material={m.black}>
        <boxGeometry args={[1.1, 0.08, 0.32]} />
      </mesh>
      <mesh position={[0, 0.765, 0.08]}>
        <boxGeometry args={[1.0, 0.01, 0.14]} />
        <meshStandardMaterial color="#e8e8ec" />
      </mesh>
    </group>
  );
}

function DrumKit({ position }: { position: [number, number, number] }) {
  const m = useWorldMaterials();
  const shell = <meshStandardMaterial color="#16161c" roughness={0.4} metalness={0.2} />;
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.35, 20]} />
        {shell}
      </mesh>
      <mesh position={[-0.15, 0.72, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.25, 16]} />
        {shell}
      </mesh>
      <mesh position={[0.15, 0.72, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 16]} />
        {shell}
      </mesh>
      <mesh position={[-0.5, 0.55, 0.25]} rotation={[Math.PI / 2, 0, 0]} material={m.chrome}>
        <cylinderGeometry args={[0.18, 0.18, 0.14, 16]} />
      </mesh>
      <mesh position={[0.55, 0.95, 0.1]} material={m.metal}>
        <cylinderGeometry args={[0.25, 0.27, 0.015, 20]} />
      </mesh>
      <mesh position={[0.55, 0.5, 0.1]} material={m.chrome}>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
      </mesh>
      <mesh position={[-0.65, 1.05, -0.15]} material={m.metal}>
        <cylinderGeometry args={[0.22, 0.24, 0.015, 20]} />
      </mesh>
      <mesh position={[-0.65, 0.55, -0.15]} material={m.chrome}>
        <cylinderGeometry args={[0.012, 0.012, 1.0, 6]} />
      </mesh>
    </group>
  );
}

/** Sculptural chrome object on a black plinth. */
function Sculpture({ position }: { position: [number, number, number] }) {
  const m = useWorldMaterials();
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} material={m.black}>
        <boxGeometry args={[0.5, 1, 0.5]} />
      </mesh>
      <mesh position={[0, 1.45, 0]} material={m.chrome}>
        <torusKnotGeometry args={[0.28, 0.08, 80, 12]} />
      </mesh>
      <pointLight position={[0, 0.6, 0]} intensity={3} distance={2.5} color={AMBER} />
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  const m = useWorldMaterials();
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} material={m.black}>
        <cylinderGeometry args={[0.18, 0.14, 0.4, 12]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 2.1) * 0.12, 0.55 + i * 0.18, Math.cos(i * 2.1) * 0.12]}
          scale={[1, 1.6, 1]}
        >
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color="#2c4a2c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function GoldPlaque({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.5, 0.65, 0.03]} />
        <meshStandardMaterial color="#14100c" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.01, 24]} />
        <meshStandardMaterial color={AMBER} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.22, 0.02]}>
        <boxGeometry args={[0.3, 0.08, 0.01]} />
        <meshStandardMaterial color="#c8c0a8" />
      </mesh>
    </group>
  );
}

export function RecordingStudio() {
  const rug = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#181820', roughness: 0.95 }),
    [],
  );
  return (
    <group>
      <MixingDesk />
      <SpeakerMonitor position={[-1.4, 1.5, -5.4]} rotation={[0, 0.5, 0]} />
      <SpeakerMonitor position={[1.4, 1.5, -5.4]} rotation={[0, -0.5, 0]} />
      {/* wall mains flanking the live-room glass */}
      <SpeakerMonitor position={[-9.6, 2.3, -7.55]} />
      <SpeakerMonitor position={[9.6, 2.3, -7.55]} />
      <VocalBooth />
      <LiveRoom />

      {/* lounge near the +z window, facing the desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.02, 4.6]} material={rug}>
        <planeGeometry args={[4.5, 3]} />
      </mesh>
      <Couch position={[2, 0, 5.3]} rotation={Math.PI} />
      <CoffeeTable position={[2, 0, 3.9]} />
      <Plant position={[-7.5, 0, 6.5]} />
      <Sculpture position={[7.8, 0, 5.8]} />

      {/* gear */}
      <RackUnit position={[11.3, 0, -4.2]} rotation={-Math.PI / 2} seed={1} />
      <RackUnit position={[11.3, 0, -3.3]} rotation={-Math.PI / 2} seed={4} />
      <SynthKeyboard position={[5.5, 0, -1.5]} rotation={-0.6} />
      <DrumKit position={[-6, 0, 0.5]} />

      {/* wall decor on -x wall */}
      <GoldPlaque position={[-11.7, 2.4, -1]} />
      <GoldPlaque position={[-11.7, 2.4, -2.2]} />
      <GoldPlaque position={[-11.7, 2.4, -3.4]} />

      {/* warm amber lighting only */}
      <ambientLight intensity={0.22} color="#f2ead9" />
      <pointLight position={[-7, 5, -4]} intensity={50} distance={18} color="#ffd9a8" />
      <pointLight position={[6, 5, -2]} intensity={50} distance={18} color="#ffd9a8" />
      <pointLight position={[0, 5, 5.5]} intensity={45} distance={18} color={AMBER} />
      <pointLight position={[0, 4, -6.5]} intensity={30} distance={10} color={AMBER} />
      <directionalLight
        position={[4, 5.5, 6]}
        intensity={0.4}
        color="#ffeedd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
    </group>
  );
}
