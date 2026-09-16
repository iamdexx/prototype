import type { Vec3 } from '../state/playerStore';

/** Studio interior: 30m (x) x 6m (y) x 20m (z), centered at origin. */
export const ROOM = {
  width: 30,
  height: 6,
  depth: 20,
  /** Margin from walls the player capsule cannot cross. */
  margin: 0.6,
};

export function clampToRoom(pos: Vec3): Vec3 {
  const hx = ROOM.width / 2 - ROOM.margin;
  const hz = ROOM.depth / 2 - ROOM.margin;
  return [
    Math.min(hx, Math.max(-hx, pos[0])),
    Math.max(0, Math.min(ROOM.height - ROOM.margin, pos[1])),
    Math.min(hz, Math.max(-hz, pos[2])),
  ];
}
