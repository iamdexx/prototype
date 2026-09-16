import type { Vec3 } from '../state/playerStore';
import { useWorldStore } from '../state/worldStore';
import { ZONES, clampToZone, type ZoneId } from './zones';

/** Kept for backward compatibility — zone bounds now live in zones.ts. */
export const ROOM = {
  width: 24,
  height: 6,
  depth: 16,
  margin: 0.6,
};

/** Clamp to the CURRENT zone (room + its portal hallway). */
export function clampToRoom(pos: Vec3): Vec3 {
  return clampToZone(useWorldStore.getState().zone, pos);
}

export { clampToZone, ZONES };
export type { ZoneId };
