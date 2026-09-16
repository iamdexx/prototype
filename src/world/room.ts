import type { Vec3 } from '../state/playerStore';

/** Whole venue: 52m (x) x 6m (y) x 24m (z), centered at origin.
 *  Left half (x<0) = recording studio, right half (x>0) = DJ club. */
export const ROOM = {
  width: 52,
  height: 6,
  depth: 24,
  /** Margin from walls the player capsule cannot cross. */
  margin: 0.6,
};

/** Partition wall at x=0 with a 5m doorway centered at z=0. */
export const PARTITION = {
  x: 0,
  thickness: 0.4,
  /** Doorway half-width: passable for |z| <= doorHalf. */
  doorHalf: 2.5,
};

export function clampToRoom(pos: Vec3): Vec3 {
  const hx = ROOM.width / 2 - ROOM.margin;
  const hz = ROOM.depth / 2 - ROOM.margin;
  const p: Vec3 = [
    Math.min(hx, Math.max(-hx, pos[0])),
    Math.max(0, Math.min(ROOM.height - ROOM.margin, pos[1])),
    Math.min(hz, Math.max(-hz, pos[2])),
  ];
  // Keep the player out of the partition wall except inside the doorway.
  const half = PARTITION.thickness / 2 + ROOM.margin;
  if (Math.abs(p[0]) < half && Math.abs(p[2]) > PARTITION.doorHalf - 0.2) {
    p[0] = Math.sign(p[0] || 1) * half;
  }
  return p;
}
