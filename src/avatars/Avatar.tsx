import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { PeerStateMessage } from '../net/protocol';

const SKIN = '#8a5a3b';
const SHIRT = '#4f6df5';

/** 25-sphere hand skeleton driven by a flat number[] joint array. */
export function HandSkeleton({ joints, offset, color = '#e8b98d' }: {
  joints: number[];
  offset: number; // 0 or 75
  color?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const spheres = useMemo(() => Array.from({ length: 25 }, () => new THREE.Vector3()), []);
  useFrame(() => {
    if (!group.current) return;
    for (let j = 0; j < 25; j++) {
      spheres[j].set(joints[offset + j * 3], joints[offset + j * 3 + 1], joints[offset + j * 3 + 2]);
      const child = group.current.children[j] as THREE.Mesh | undefined;
      if (child) child.position.copy(spheres[j]);
    }
  });
  return (
    <group ref={group}>
      {spheres.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.012, 8, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Stylized remote avatar: capsule body, sphere head, eyes, and a mouth whose
 * vertical scale tracks `mouthOpen`. Nametag floats above the head.
 */
export function Avatar({ state }: { state: PeerStateMessage }) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const target = useMemo(() => ({
    pos: new THREE.Vector3(...state.headPosition),
    quat: new THREE.Quaternion(...state.headQuaternion),
  }), []);

  useFrame((_, dt) => {
    if (!group.current || !head.current) return;
    target.pos.set(state.headPosition[0], state.headPosition[1], state.headPosition[2]);
    target.quat.set(
      state.headQuaternion[0],
      state.headQuaternion[1],
      state.headQuaternion[2],
      state.headQuaternion[3],
    );
    const k = 1 - Math.exp(-12 * dt); // damped follow
    // Body follows head position (feet = head - ~1.55)
    group.current.position.lerp(
      new THREE.Vector3(target.pos.x, target.pos.y - 1.55, target.pos.z),
      k,
    );
    head.current.position.lerp(target.pos, k);
    head.current.quaternion.slerp(target.quat, k);
    if (mouth.current) {
      const m = THREE.MathUtils.clamp(state.mouthOpen, 0, 1);
      mouth.current.scale.y = 0.15 + m * 1.6;
    }
  });

  const showHands = state.handJoints.length >= 150;

  return (
    <>
      {/* body rooted at feet */}
      <group ref={group}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <capsuleGeometry args={[0.22, 0.75, 6, 12]} />
          <meshStandardMaterial color={SHIRT} roughness={0.7} />
        </mesh>
      </group>
      {/* head (separate so head pose is exact) */}
      <group ref={head}>
        <mesh castShadow>
          <sphereGeometry args={[0.14, 20, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.05, 0.03, -0.115]}>
          <sphereGeometry args={[0.018, 10, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.05, 0.03, -0.115]}>
          <sphereGeometry args={[0.018, 10, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* mouth */}
        <mesh ref={mouth} position={[0, -0.05, -0.125]} scale={[1, 0.15, 1]}>
          <boxGeometry args={[0.05, 0.02, 0.01]} />
          <meshStandardMaterial color="#521818" />
        </mesh>
        {/* nametag */}
        <Text
          position={[0, 0.28, 0]}
          fontSize={0.09}
          color="#fff"
          outlineWidth={0.006}
          outlineColor="#000"
          anchorX="center"
        >
          {state.name || state.wallet || 'anon'}
        </Text>
      </group>
      {showHands && (
        <>
          <HandSkeleton joints={state.handJoints} offset={0} />
          <HandSkeleton joints={state.handJoints} offset={75} color="#d8a87d" />
        </>
      )}
    </>
  );
}
