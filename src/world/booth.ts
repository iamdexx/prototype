import type { Vec3 } from '../state/playerStore';

/**
 * Vocal booth: a glass-walled box in the studio's far-left corner.
 * 4x4m footprint, 3m high, with a door opening on the +x facing wall.
 */
export const BOOTH = {
  /** Center of the booth floor (world space). */
  center: [-21, 0, -7] as Vec3,
  /** Half extents of the booth interior. */
  half: [2, 1.5, 2] as Vec3,
  /** Door opening: on the wall facing +x, centered at z = -7, width 0.9m. */
  doorWidth: 0.9,
};

export function isInsideBooth(pos: Vec3): boolean {
  const [cx, , cz] = BOOTH.center;
  const [hx, hy, hz] = BOOTH.half;
  return (
    Math.abs(pos[0] - cx) <= hx &&
    pos[1] >= -0.5 &&
    pos[1] <= hy * 2 &&
    Math.abs(pos[2] - cz) <= hz
  );
}
