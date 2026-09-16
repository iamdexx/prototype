import { useMemo, useRef, useState } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePeersStore } from '../net/peersStore';
import { useShareStore } from './shareStore';
import type { PeerMesh } from '../net/mesh';
import type { PanelTransform } from '../net/protocol';

function usePanelTexture(panel: PanelTransform): THREE.Texture | null {
  const peers = usePeersStore((s) => s.peers);
  const localStream = useShareStore((s) => s.localStream);
  const selfId = usePeersStore((s) => s.selfId);

  return useMemo(() => {
    let stream: MediaStream | null = null;
    if (panel.kind === 'screen') {
      stream = panel.owner === selfId ? localStream : peers[panel.owner]?.screenStream ?? null;
      if (!stream) return null;
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = panel.owner === selfId;
      video.playsInline = true;
      void video.play().catch(() => undefined);
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    if (panel.kind === 'image' && panel.src) {
      const tex = new THREE.TextureLoader().load(panel.src);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    return null;
  }, [panel.kind, panel.src, panel.owner, selfId, localStream, peers]);
}

function Panel({ panel, getMesh }: { panel: PanelTransform; getMesh: () => PeerMesh | null }) {
  const group = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const [grabOffset] = useState(() => new THREE.Vector3());
  const camera = useThree((s) => s.camera);
  const texture = usePanelTexture(panel);
  const selfId = usePeersStore((s) => s.selfId);
  const isOwner = panel.owner === selfId;

  const sync = () => {
    if (!group.current || !isOwner) return;
    const p = group.current.position;
    const q = group.current.quaternion;
    const next: PanelTransform = {
      ...panel,
      position: [p.x, p.y, p.z],
      quaternion: [q.x, q.y, q.z, q.w],
      scale: group.current.scale.x,
    };
    usePeersStore.getState().setPanel(next);
    getMesh()?.broadcastPanel(next, next.id);
  };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isOwner || !group.current) return;
    e.stopPropagation();
    dragging.current = true;
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
    grabOffset.copy(group.current.position).sub(e.point);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !group.current) return;
    e.stopPropagation();
    group.current.position.copy(e.point).add(grabOffset);
    group.current.lookAt(camera.position);
  };
  const onUp = () => {
    if (dragging.current) sync();
    dragging.current = false;
  };
  const onWheel = (e: ThreeEvent<WheelEvent>) => {
    if (!isOwner || !group.current) return;
    e.stopPropagation();
    const s = THREE.MathUtils.clamp(group.current.scale.x - e.deltaY * 0.001, 0.3, 4);
    group.current.scale.setScalar(s);
    sync();
  };

  return (
    <group
      ref={group}
      position={panel.position}
      quaternion={panel.quaternion}
      scale={panel.scale}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onWheel={onWheel}
    >
      <mesh>
        <planeGeometry args={[1.6, 0.9]} />
        {texture ? (
          <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#22293a" side={THREE.DoubleSide} />
        )}
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <planeGeometry args={[1.6, 0.12]} />
        <meshBasicMaterial color="#11141c" />
      </mesh>
      <Text position={[0, -0.5, 0.001]} fontSize={0.07} color="#9db4ff" anchorX="center">
        {panel.kind === 'url' ? panel.src : `${panel.kind} panel`}
      </Text>
      {/* corner scale handle hint */}
      <mesh position={[0.78, -0.43, 0.001]}>
        <planeGeometry args={[0.08, 0.08]} />
        <meshBasicMaterial color="#4f6df5" />
      </mesh>
    </group>
  );
}

export function SharePanels({ getMesh }: { getMesh: () => PeerMesh | null }) {
  const panels = usePeersStore((s) => s.panels);
  return (
    <>
      {Object.values(panels).map((p) => (
        <Panel key={p.id} panel={p} getMesh={getMesh} />
      ))}
    </>
  );
}
