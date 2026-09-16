import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from './engine';
import { usePeersStore } from '../net/peersStore';
import { usePlayerStore } from '../state/playerStore';
import { isInsideBooth } from '../world/booth';
import { useWorldStore } from '../state/worldStore';
import type { Vec3 } from '../state/playerStore';

const fwd = new THREE.Vector3();
const up = new THREE.Vector3();

/** Attaches remote streams to the audio graph and updates positions per frame. */
export function SpatialAudioSync() {
  const camera = useThree((s) => s.camera);
  const peers = usePeersStore((s) => s.peers);
  const panels = usePeersStore((s) => s.panels);

  // Attach/detach mic + screen streams as they appear.
  useEffect(() => {
    for (const p of Object.values(peers)) {
      if (p.micStream && !audioEngine.hasSource(`${p.id}:mic`)) {
        audioEngine.attachStream(`${p.id}:mic`, p.micStream);
      }
      if (p.screenStream && !audioEngine.hasSource(`${p.id}:screen`)) {
        audioEngine.attachStream(`${p.id}:screen`, p.screenStream);
      }
      if (!p.micStream) audioEngine.detachStream(`${p.id}:mic`);
      if (!p.screenStream) audioEngine.detachStream(`${p.id}:screen`);
    }
    return () => {
      for (const p of Object.values(peers)) {
        audioEngine.detachStream(`${p.id}:mic`);
        audioEngine.detachStream(`${p.id}:screen`);
      }
    };
  }, [peers]);

  useFrame(() => {
    camera.getWorldDirection(fwd);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const lp = usePlayerStore.getState().headPosition;
    const localPos: Vec3 = [lp[0], lp[1], lp[2]];
    const localZone = useWorldStore.getState().zone;
    const localInBooth = isInsideBooth(localPos);

    for (const p of Object.values(usePeersStore.getState().peers)) {
      if (p.state) {
        const hp = p.state.headPosition;
        const pz = p.state.zone ?? 'studio'; // default for older clients
        audioEngine.setSourcePosition(`${p.id}:mic`, hp);
        audioEngine.setSourcePosition(`${p.id}:screen`, hp);
        audioEngine.setSourceZone(`${p.id}:mic`, pz);
        audioEngine.setSourceZone(`${p.id}:screen`, pz);
      }
    }
    // Screenshare audio lives where its panel is, not where its owner walked to.
    for (const panel of Object.values(usePeersStore.getState().panels)) {
      const key = `${panel.owner}:screen`;
      if (audioEngine.hasSource(key)) {
        audioEngine.setSourcePosition(key, panel.position);
        audioEngine.setSourceZone(key, panel.zone ?? 'studio');
      }
    }
    audioEngine.update(localPos, fwd, up, localInBooth, localZone);
  });

  void panels;
  return null;
}
