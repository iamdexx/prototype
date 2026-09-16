import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ZONES, type ZoneId } from './zones';
import { useWorldStore } from '../state/worldStore';
import { usePlayerStore } from '../state/playerStore';
import type { Vec3 } from '../state/playerStore';

const TRIGGER_RADIUS = 0.9;
const DEBOUNCE_MS = 1500;
const FADE_MS = 450;

/**
 * Walk into the portal ring → fade out, switch zone, spawn just outside the
 * target zone's portal (inside its room, a step toward the room center).
 */
export function PortalTrigger() {
  const lastSwitch = useRef(0);
  const busy = useRef(false);
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const w = useWorldStore.getState();
    const now = performance.now();
    if (busy.current || w.transitioning || now - lastSwitch.current < DEBOUNCE_MS) return;

    const def = ZONES[w.zone];
    const p = def.portal.position;
    const pos = usePlayerStore.getState().position;
    const dx = pos[0] - p[0];
    const dz = pos[2] - p[2];
    if (dx * dx + dz * dz > TRIGGER_RADIUS * TRIGGER_RADIUS) return;

    // Fade → switch → fade back.
    busy.current = true;
    lastSwitch.current = now;
    w.setTransitioning(true);
    const target: ZoneId = def.portal.target;
    setTimeout(() => {
      const tdef = ZONES[target];
      // Arrive just inside the target zone, a couple of meters past its
      // portal toward the room center.
      const dir: Vec3 =
        tdef.portal.position[0] > 0 ? [-1, 0, 0] : [1, 0, 0];
      const arrival: Vec3 = [
        tdef.portal.position[0] + dir[0] * 2.2,
        0,
        tdef.portal.position[2] + dir[2] * 2.2,
      ];
      useWorldStore.getState().setZone(target);
      const s = usePlayerStore.getState();
      s.setPosition(arrival);
      const yaw = dir[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
      s.setYaw(yaw);
      camera.rotation.set(0, yaw, 0);
      setTimeout(() => {
        useWorldStore.getState().setTransitioning(false);
        busy.current = false;
      }, FADE_MS);
    }, FADE_MS);
  });

  return null;
}
