import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { DJ_STAGE } from './layout';

/** Raised DJ stage with emissive edge strips (uses shared DJ_STAGE layout). */
function Stage() {
  const [cx, , cz] = DJ_STAGE.center;
  const [w, h, d] = DJ_STAGE.size;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, h / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#1e1b26" roughness={0.8} />
      </mesh>
      {/* edge glow strip along the front + sides */}
      <mesh position={[0, h + 0.02, d / 2 - 0.02]}>
        <boxGeometry args={[w, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff2d95" emissive="#ff2d95" emissiveIntensity={2} />
      </mesh>
      {[-w / 2 + 0.02, w / 2 - 0.02].map((x) => (
        <mesh key={x} position={[x, h + 0.02, 0]}>
          <boxGeometry args={[0.05, 0.05, d]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2} />
        </mesh>
      ))}
      <pointLight position={[0, 3, 0]} intensity={12} distance={12} color="#9d7bff" />
    </group>
  );
}

/** 10x4m LED video wall behind the stage — animated equalizer bars. */
function LEDWall({ position = [14, 2.2, -11.9] }: { position?: [number, number, number] }) {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, tex };
  }, []);
  const acc = useRef(0);
  const bars = useMemo(() => Array.from({ length: 32 }, () => Math.random()), []);

  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 1 / 15) return;
    acc.current = 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const t = performance.now() / 1000;
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 32; i++) {
      const target = 0.15 + 0.8 * Math.abs(Math.sin(t * (1.2 + (i % 5) * 0.35) + i));
      bars[i] += (target - bars[i]) * 0.4;
      const h = bars[i] * 110;
      const hue = (i / 32 + t * 0.05) % 1;
      ctx.fillStyle = `hsl(${hue * 360}, 95%, 55%)`;
      ctx.fillRect(i * 8 + 1, 128 - h, 6, h);
    }
    tex.needsUpdate = true;
  });

  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[10, 4]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* frame */}
      <mesh position={[0, 2.05, -0.02]}>
        <boxGeometry args={[10.3, 0.15, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, -2.05, -0.02]}>
        <boxGeometry args={[10.3, 0.15, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

function PAStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.45 + i * 0.95, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.9, 0.7]} />
            <meshStandardMaterial color="#0c0c10" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.3 - i * 0.04, 0.15, 20, 1, true]} />
            <meshStandardMaterial color="#1e1e26" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Bar along the +x wall with glowing bottles and stools. */
function Bar({ position = [23.5, 0, 4] }: { position?: [number, number, number] }) {
  const bottleColors = useMemo(
    () => ['#ff5533', '#33ddff', '#aaff33', '#ffcc00', '#ff2d95', '#8844ff', '#22ff88', '#ff8844'],
    [],
  );
  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      {/* counter */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[6, 1.1, 0.7]} />
        <meshStandardMaterial color="#1f1a2a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[6.2, 0.05, 0.85]} />
        <meshStandardMaterial color="#332a44" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* under-shelf accent light so the counter/stools read */}
      <pointLight position={[0, 1.7, -0.8]} intensity={30} distance={8} color="#ff2d95" />
      {/* back-bar shelves + bottles (against the wall behind the counter) */}
      {[2.0, 2.7].map((y) => (
        <mesh key={y} position={[0, y, -1.6]}>
          <boxGeometry args={[6, 0.05, 0.4]} />
          <meshStandardMaterial color="#241d33" roughness={0.5} />
        </mesh>
      ))}
      {bottleColors.map((c, i) => (
        <group key={i} position={[-2.5 + i * 0.72, i % 2 === 0 ? 2.28 : 2.98, -1.6]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.07, 0.5, 10]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.14, 8]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      ))}
      {/* stools */}
      {[-2.2, -0.7, 0.7, 2.2].map((x) => (
        <group key={x} position={[x, 0, 1.4]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial color="#333" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
            <meshStandardMaterial color="#4a2040" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function LoungeSofa({ position, rotation = 0 }: {
  position: [number, number, number];
  rotation?: number;
}) {
  const mat = <meshStandardMaterial color="#1f1b30" roughness={0.85} />;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.8, 0.35, 0.7]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.55, -0.28]}>
        <boxGeometry args={[1.8, 0.55, 0.14]} />
        {mat}
      </mesh>
    </group>
  );
}

function NeonSign({ position = [14, 3, 11.9] }: { position?: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* backing plane */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.4, 1.0]} />
        <meshStandardMaterial color="#0a0a10" roughness={0.9} />
      </mesh>
      <Text fontSize={0.7} anchorX="center" anchorY="middle" color="#ff2d95">
        APE
      </Text>
      <pointLight position={[0, 0, 0.5]} intensity={4} distance={6} color="#ff2d95" />
    </group>
  );
}

export function DJClub() {
  return (
    <group>
      <Stage />
      <LEDWall />
      {/* PA stacks flanking the stage */}
      <PAStack position={[DJ_STAGE.center[0] - DJ_STAGE.size[0] / 2 - 1, 0, DJ_STAGE.center[2]]} />
      <PAStack position={[DJ_STAGE.center[0] + DJ_STAGE.size[0] / 2 + 1, 0, DJ_STAGE.center[2]]} />
      <Bar />
      {/* lounge corner near the +z wall */}
      <LoungeSofa position={[20, 0, 9.5]} rotation={Math.PI * 0.75} />
      <LoungeSofa position={[22.5, 0, 8]} rotation={Math.PI * 0.9} />
      <NeonSign />

      {/* cool club lighting */}
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#4433aa', '#110a1a', 0.6]} />
      <pointLight position={[8, 4, 6]} intensity={70} distance={20} color="#6633ff" />
      <pointLight position={[20, 4, -4]} intensity={70} distance={20} color="#2233ff" />
      <pointLight position={[12, 4, 4]} intensity={60} distance={20} color="#4422cc" />
      {/* warm wash over the DJ stage so the board + knobs read */}
      <pointLight position={[14, 4.5, -7]} intensity={50} distance={18} color="#ffe0c0" />
    </group>
  );
}
