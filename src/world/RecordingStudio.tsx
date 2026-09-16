import { useMemo } from 'react';
import * as THREE from 'three';
import { BOOTH } from './booth';

/** Mixing console: sloped desk + knobs, facing +z (user walks up to it). */
function MixingDesk() {
  const knobs = useMemo(() => {
    const arr: [number, number][] = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 10; c++) arr.push([-1.1 + c * 0.24, 0.12 + r * 0.14]);
    return arr;
  }, []);
  return (
    <group position={[-12, 0, -6]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[3, 0.9, 1.2]} />
        <meshStandardMaterial color="#2a2a33" roughness={0.7} />
      </mesh>
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

/** Glass-walled vocal booth, door opening on the +x wall. */
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
  const doorZ = BOOTH.doorWidth / 2 + (hz * 2 - BOOTH.doorWidth) / 4;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[hx * 2, 0.04, hz * 2]} />
        <meshStandardMaterial color="#22242c" roughness={0.9} />
      </mesh>
      <mesh position={[0, hy * 2, 0]}>
        <boxGeometry args={[hx * 2 + 0.2, 0.1, hz * 2 + 0.2]} />
        {frame}
      </mesh>
      {/* -x wall (solid glass) */}
      <mesh position={[-hx, hy, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[hz * 2, hy * 2]} />
        {glass}
      </mesh>
      {/* +x wall with door opening: two glass segments + lintel */}
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
      <group position={[-0.4, 0, 0]}>
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

/** Fake-depth "live room" window on the back wall behind the desk. */
function LiveRoomWindow() {
  return (
    <group position={[-12, 2.2, -11.9]}>
      {/* dark recess glow behind glass */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[8, 2.5]} />
        <meshStandardMaterial color="#0c0a12" emissive="#2a1e3d" emissiveIntensity={0.5} />
      </mesh>
      {/* a dim mic silhouette inside */}
      <mesh position={[0, -0.9, -0.04]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, -0.15, -0.04]}>
        <sphereGeometry args={[0.08, 12, 10]} />
        <meshStandardMaterial color="#222" emissive="#883333" emissiveIntensity={0.4} />
      </mesh>
      {/* glass pane */}
      <mesh>
        <planeGeometry args={[8, 2.5]} />
        <meshPhysicalMaterial color="#bfe0ff" transparent opacity={0.15} roughness={0.05} />
      </mesh>
      {/* frame */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[8.2, 0.12, 0.1]} />
        <meshStandardMaterial color="#1c1c22" />
      </mesh>
      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[8.2, 0.12, 0.1]} />
        <meshStandardMaterial color="#1c1c22" />
      </mesh>
    </group>
  );
}

function Couch({ position }: { position: [number, number, number] }) {
  const mat = <meshStandardMaterial color="#3a2f4a" roughness={0.85} />;
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      {[-0.7, 0, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]}>
          <boxGeometry args={[0.68, 0.3, 0.8]} />
          {mat}
        </mesh>
      ))}
      <mesh position={[0, 0.65, -0.35]}>
        <boxGeometry args={[2.1, 0.7, 0.15]} />
        {mat}
      </mesh>
      <mesh position={[-1.05, 0.5, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.8]} />
        {mat}
      </mesh>
      <mesh position={[1.05, 0.5, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.8]} />
        {mat}
      </mesh>
    </group>
  );
}

function CoffeeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.1, 0.05, 0.55]} />
        <meshStandardMaterial color="#4a3826" roughness={0.4} />
      </mesh>
      {[[-0.45, -0.2], [0.45, -0.2], [-0.45, 0.2], [0.45, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.17, z]}>
          <cylinderGeometry args={[0.02, 0.02, 0.34, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
}

function RackUnit({ position, seed }: { position: [number, number, number]; seed: number }) {
  const leds = useMemo(() => {
    const arr: { pos: [number, number, number]; color: string }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 4; c++) {
        if ((r * 4 + c + seed) % 3 === 0) continue;
        arr.push({
          pos: [-0.21 + c * 0.14, 0.2 + r * 0.19, 0.16],
          color: (r + c + seed) % 5 === 0 ? '#ff5533' : '#33ff77',
        });
      }
    }
    return arr;
  }, [seed]);
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.55, 1.8, 0.4]} />
        <meshStandardMaterial color="#1a1a20" roughness={0.5} metalness={0.4} />
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

function SynthKeyboard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      {/* X stand */}
      <mesh position={[-0.3, 0.35, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.04, 0.8, 0.04]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.3, 0.35, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.04, 0.8, 0.04]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.3, 0.35, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.04, 0.8, 0.04]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.3, 0.35, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.04, 0.8, 0.04]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* keyboard body */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.1, 0.08, 0.32]} />
        <meshStandardMaterial color="#16161c" roughness={0.4} />
      </mesh>
      {/* keys hint strip */}
      <mesh position={[0, 0.765, 0.08]}>
        <boxGeometry args={[1.0, 0.01, 0.14]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
    </group>
  );
}

function DrumKit({ position }: { position: [number, number, number] }) {
  const shell = <meshStandardMaterial color="#7a3040" roughness={0.5} />;
  const metal = <meshStandardMaterial color="#b08d3f" metalness={0.7} roughness={0.3} />;
  return (
    <group position={position}>
      {/* kick */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.35, 20]} />
        {shell}
      </mesh>
      {/* toms */}
      <mesh position={[-0.15, 0.72, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.25, 16]} />
        {shell}
      </mesh>
      <mesh position={[0.15, 0.72, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 16]} />
        {shell}
      </mesh>
      {/* snare */}
      <mesh position={[-0.5, 0.55, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.14, 16]} />
        <meshStandardMaterial color="#c8c8d0" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* cymbals */}
      <mesh position={[0.55, 0.95, 0.1]}>
        <cylinderGeometry args={[0.25, 0.27, 0.015, 20]} />
        {metal}
      </mesh>
      <mesh position={[0.55, 0.5, 0.1]}>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[-0.65, 1.05, -0.15]}>
        <cylinderGeometry args={[0.22, 0.24, 0.015, 20]} />
        {metal}
      </mesh>
      <mesh position={[-0.65, 0.55, -0.15]}>
        <cylinderGeometry args={[0.012, 0.012, 1.0, 6]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
}

function GuitarOnWall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* body */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.32, 0.45, 0.06]} />
        <meshStandardMaterial color="#c24a2a" roughness={0.3} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.45, 0.05]}>
        <boxGeometry args={[0.05, 0.55, 0.03]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.5} />
      </mesh>
      {/* hanger */}
      <mesh position={[0, 0.72, 0.02]}>
        <boxGeometry args={[0.1, 0.05, 0.08]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.4, 12]} />
        <meshStandardMaterial color="#5a4030" roughness={0.8} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 2.1) * 0.12, 0.55 + i * 0.18, Math.cos(i * 2.1) * 0.12]}
          scale={[1, 1.6, 1]}
        >
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color="#3d7a3d" roughness={0.9} />
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
        <meshStandardMaterial color="#2a1f10" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.01, 24]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.22, 0.02]}>
        <boxGeometry args={[0.3, 0.08, 0.01]} />
        <meshStandardMaterial color="#c8c0a8" />
      </mesh>
    </group>
  );
}

function WallClock({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 24]} />
        <meshStandardMaterial color="#e8e4da" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.06, 0.03]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.015, 0.16, 0.01]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.04, 0, 0.03]} rotation={[0, 0, -1.4]}>
        <boxGeometry args={[0.015, 0.12, 0.01]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

export function RecordingStudio() {
  const rug = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4a3550', roughness: 0.95 }),
    [],
  );
  return (
    <group>
      <MixingDesk />
      {/* nearfields on the desk */}
      <SpeakerMonitor position={[-13.4, 1.5, -6.4]} rotation={[0, 0.5, 0]} />
      <SpeakerMonitor position={[-10.6, 1.5, -6.4]} rotation={[0, -0.5, 0]} />
      {/* wall-mounted mains on the -z wall */}
      <SpeakerMonitor position={[-17, 2.4, -11.5]} />
      <SpeakerMonitor position={[-7, 2.4, -11.5]} />
      <VocalBooth />
      <LiveRoomWindow />

      {/* lounge area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, 0.02, 5]} material={rug}>
        <planeGeometry args={[4.5, 3]} />
      </mesh>
      <Couch position={[-9, 0, 6.5]} />
      <CoffeeTable position={[-9, 0, 4.6]} />
      <Plant position={[-14.5, 0, 5.5]} />
      <Plant position={[-4, 0, 10.5]} />

      {/* gear */}
      <RackUnit position={[-15.5, 0, -6]} seed={1} />
      <RackUnit position={[-15.5, 0, -5.3]} seed={4} />
      <SynthKeyboard position={[-6.5, 0, -3]} />
      <DrumKit position={[-5, 0, 9]} />

      {/* wall decor on -x wall */}
      <GuitarOnWall position={[-25.85, 1.4, 4]} />
      <GuitarOnWall position={[-25.85, 1.4, 6]} />
      <GoldPlaque position={[-25.85, 2.4, -2]} />
      <GoldPlaque position={[-25.85, 2.4, -3.2]} />
      <GoldPlaque position={[-25.85, 2.4, -4.4]} />
      {/* clock on +z wall (studio side) */}
      <group position={[-12, 3.4, 11.9]} rotation={[0, Math.PI, 0]}>
        <WallClock position={[0, 0, 0]} />
      </group>

      {/* warm lighting */}
      <ambientLight intensity={0.18} />
      <pointLight position={[-18, 5, -5]} intensity={12} distance={14} color="#ffd9a8" />
      <pointLight position={[-10, 5, 2]} intensity={12} distance={14} color="#ffd9a8" />
      <pointLight position={[-6, 5, 8]} intensity={10} distance={14} color="#ffcf98" />
      <directionalLight
        position={[-8, 5.5, 6]}
        intensity={0.5}
        color="#ffeedd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
    </group>
  );
}
