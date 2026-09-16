import type { Vec3 } from '../state/playerStore';

/** DJ stage in the club zone (club centered at origin) — shared by the
 *  stage mesh and the DJBoard. */
export const DJ_STAGE = {
  center: [0, 0, -6] as Vec3,
  size: [12, 0.5, 5] as Vec3,
};

/** Position the DJBoard should sit at (on top of the stage, facing +z). */
export const DJ_BOARD_POSITION = [
  DJ_STAGE.center[0],
  DJ_STAGE.size[1],
  DJ_STAGE.center[2],
] as Vec3;
