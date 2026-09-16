import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { DJ_STAGE } from './layout';
import { useWorldMaterials } from './materials';
import { ZONES } from './zones';

const BLUE = ZONES.club.accent; // #1f3bff
const DIM = '#0a1030';

/** Raised DJ stage with blue emissive edge strips (uses shared DJ_STAGE). */
function Stage() {
  const m = useWorldMaterials();
  const [cx, , cz] = DJ_STAGE.center;
  const [w, h, d] = DJ_STAGE.size;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, h / 2, 0]} receiveShadow castShadow material={m.concrete}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {/* blue edge strips on front + sides */}
      <mesh position={[0, h + 0.02, d / 2 - 0.02]}>
        <boxGeometry args={[w, 0.05, 0.05]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={2.5} />
      </mesh>
      {[-w / 2 + 0.02, w / 2 - 0.02].map((x) => (
        <mesh key={x} position={[x, h + 0.02, 0]}>
          <boxGeometry args={[0.05, 0.05, d]} />
          <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={2.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Monochrome blue LED dance floor — instanced tiles pulsing dim→blue. */
function LEDFloor() {
  const mesh = useRef<THREE.InstancedMesh | null>(null);
  const cols = 10;
  const rows = 7;
  const count = cols * rows;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const palette = useMemo(
    () => [new THREE.Color(DIM), new THREE.Color(BLUE)],
    [],
  );
  const initRef = (inst: THREE.InstancedMesh | null) => {
    mesh.current = inst;
    if (!inst) return;
    let i = 0;
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) {
        dummy.position.set(-4.5 + c, 0.012, -1.5 + r);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        inst.setColorAt(i, palette[0]);
        i++;
      }
    inst.instanceMatrix.needsUpdate = true;
  };
  const phase = useMemo(() => Float32Array.from({ length: count }, (_, i) => i * 0.35), []);
  const t0 = useRef(0);
  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const inst = mesh.current;
    if (!inst) return;
    const t = clock.elapsedTime;
    if (t - t0.current < 1 / 12) return;
    t0.current = t;
    for (let i = 0; i < count; i++) {
      const k = 0.5 + 0.5 * Math.sin(t * 0.9 + phase[i]);
      tmp.copy(palette[0]).lerp(palette[1], k * k);
      inst.setColorAt(i, tmp);
    }
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={initRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.92, 0.02, 0.92]} />
      <meshStandardMaterial color="#ffffff" emissive={DIM} emissiveIntensity={0.8} roughness={0.6} />
    </instancedMesh>
  );
}

/** 8x3m LED wall on the +z wall — blue/white waveform. */
function LEDWall({ position = [0, 3, 8.85] }: { position?: [number, number, number] }) {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, tex };
  }, []);
  const acc = useRef(0);
  useFrame(({ clock }) => {
    const dt = clock.elapsedTime;
    if (dt - acc.current < 1 / 15) return;
    acc.current = dt;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, 256, 96);
    ctx.beginPath();
    for (let x = 0; x < 256; x++) {
      const y =
        48 +
        Math.sin(x * 0.09 + dt * 2.2) * 20 +
        Math.sin(x * 0.031 - dt * 1.3) * 14;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#8fa8ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 7;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    tex.needsUpdate = true;
  });
  return (
    <group position={position} rotation-y={Math.PI}>
      <mesh>
        <planeGeometry args={[8, 3]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.55, -0.02]}>
        <boxGeometry args={[8.2, 0.1, 0.08]} />
        <meshStandardMaterial color="#0a0a10" />
      </mesh>
      <mesh position={[0, -1.55, -0.02]}>
        <boxGeometry args={[8.2, 0.1, 0.08]} />
        <meshStandardMaterial color="#0a0a10" />
      </mesh>
    </group>
  );
}

function PAStack({ position }: { position: [number, number, number] }) {
  const m = useWorldMaterials();
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.45 + i * 0.95, 0]}>
          <mesh castShadow material={m.black}>
            <boxGeometry args={[0.9, 0.9, 0.7]} />
          </mesh>
          <mesh position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]} material={m.chrome}>
            <coneGeometry args={[0.3 - i * 0.04, 0.15, 20, 1, true]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Bar along the +x wall with monochrome blue/white bottles + stools. */
function Bar({ position = [12.3, 0, 3] }: { position?: [number, number, number] }) {
  const m = useWorldMaterials();
  const bottleColors = useMemo(
    () => [BLUE, '#e8ecff', '#3d5bff', '#c8d4ff', BLUE, '#8fa8ff', '#e8ecff', '#3d5bff'],
    [],
  );
  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow material={m.black}>
        <boxGeometry args={[6, 1.1, 0.7]} />
      </mesh>
      <mesh position={[0, 1.12, 0]} material={m.chrome}>
        <boxGeometry args={[6.2, 0.05, 0.85]} />
      </mesh>
      <pointLight position={[0, 1.7, -0.8]} intensity={30} distance={8} color={BLUE} />
      {[2.0, 2.7].map((y) => (
        <mesh key={y} position={[0, y, -1.6]} material={m.black}>
          <boxGeometry args={[6, 0.05, 0.4]} />
        </mesh>
      ))}
      {bottleColors.map((c, i) => (
        <group key={i} position={[-2.5 + i * 0.72, i % 2 === 0 ? 2.28 : 2.98, -1.6]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.07, 0.5, 10]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.32, 0]} material={m.black}>
            <cylinderGeometry args={[0.02, 0.03, 0.14, 8]} />
          </mesh>
        </group>
      ))}
      {[-2.2, -0.7, 0.7, 2.2].map((x) => (
        <group key={x} position={[x, 0, 1.4]}>
          <mesh position={[0, 0.4, 0]} material={m.chrome}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
          </mesh>
          <mesh position={[0, 0.82, 0]} material={m.leather}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
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
  const m = useWorldMaterials();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.2, 0]} material={m.leather}>
        <boxGeometry args={[1.8, 0.35, 0.7]} />
      </mesh>
      <mesh position={[0, 0.55, -0.28]} material={m.leather}>
        <boxGeometry args={[1.8, 0.55, 0.14]} />
      </mesh>
    </group>
  );
}

/** Chrome torus sculpture lit from below (replaces neon signage). */
function ChromeRing({ position = [9.5, 1.1, 7] }: { position?: [number, number, number] }) {
  const m = useWorldMaterials();
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.y = clock.elapsedTime * 0.15;
  });
  return (
    <group position={position}>
      <mesh position={[0, -0.75, 0]} material={m.black}>
        <cylinderGeometry args={[0.5, 0.6, 0.7, 24]} />
      </mesh>
      <mesh ref={ring} material={m.chrome}>
        <torusGeometry args={[0.8, 0.09, 16, 48]} />
      </mesh>
      <pointLight position={[0, -0.4, 0]} intensity={8} distance={4} color={BLUE} />
    </group>
  );
}

/** Ceiling truss + slow blue pin spots + white wash over the stage. */
function Truss() {
  const m = useWorldMaterials();
  const spots = useRef<(THREE.SpotLight | null)[]>([]);
  const beams: [number, number][] = [
    [-3, 0.4],
    [0, 2.0],
    [3, 0.7],
    [-1.5, 1.5],
    [1.5, 2.4],
    [4.5, 1.1],
  ];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.25;
    spots.current.forEach((s, i) => {
      if (s) s.intensity = 140 + 60 * Math.sin(t + i);
    });
  });
  return (
    <group>
      {/* truss beams over the dance floor */}
      <mesh position={[0, 5.6, 0.5]} material={m.chrome}>
        <boxGeometry args={[10, 0.15, 0.15]} />
      </mesh>
      <mesh position={[0, 5.6, 0.5]} material={m.chrome}>
        <boxGeometry args={[0.15, 0.15, 6]} />
      </mesh>
      {beams.map(([x, ph], i) => (
        <spotLight
          key={i}
          ref={(r) => {
            spots.current[i] = r;
          }}
          position={[x, 5.5, 0.5]}
          target-position={[x * 0.6, 0, ph]}
          angle={0.6}
          penumbra={0.6}
          intensity={160}
          distance={20}
          color={i % 3 === 2 ? '#e8ecff' : BLUE}
        />
      ))}
    </group>
  );
}

export function DJClub() {
  return (
    <group>
      <Stage />
      <LEDFloor />
      <LEDWall />
      <PAStack position={[DJ_STAGE.center[0] - DJ_STAGE.size[0] / 2 - 1, 0, DJ_STAGE.center[2]]} />
      <PAStack position={[DJ_STAGE.center[0] + DJ_STAGE.size[0] / 2 + 1, 0, DJ_STAGE.center[2]]} />
      <Bar />
      {/* lounge in the +x/+z corner */}
      <LoungeSofa position={[10.5, 0, 6.5]} rotation={-Math.PI / 4} />
      <LoungeSofa position={[8.5, 0, 7.8]} rotation={-Math.PI / 6} />
      <ChromeRing />
      <Truss />

      {/* monochrome blue/white club lighting */}
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#2233aa', '#05060f', 0.6]} />
      <pointLight position={[-6, 5, 5]} intensity={70} distance={20} color={BLUE} />
      <pointLight position={[7, 5, -3]} intensity={70} distance={20} color={BLUE} />
      <pointLight position={[0, 5, 6]} intensity={60} distance={20} color="#e8ecff" />
      {/* white wash over the DJ stage so the board + knobs read */}
      <pointLight position={[0, 5, -5.5]} intensity={55} distance={18} color="#f2f4ff" />
    </group>
  );
}
