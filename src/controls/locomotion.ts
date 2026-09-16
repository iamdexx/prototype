import { clampToRoom } from '../world/room';
import { usePlayerStore, type Vec3 } from '../state/playerStore';

export const WALK_SPEED = 2.4;
export const SPRINT_SPEED = 5;

/** Shared non-positional input state, written by touch/gamepad layers. */
export const sharedInput = {
  moveX: 0, // strafe -1..1
  moveZ: 0, // forward -1..1
  lookX: 0, // yaw rate -1..1
  sprint: false,
};

/**
 * Apply planar locomotion for one frame. `heading` is the yaw of forward
 * (player yaw for desktop, headset yaw in VR).
 */
export function stepLocomotion(
  dt: number,
  moveX: number,
  moveZ: number,
  heading: number,
  sprint: boolean,
): Vec3 {
  const s = usePlayerStore.getState();
  const speed = sprint ? SPRINT_SPEED : WALK_SPEED;
  const sin = Math.sin(heading);
  const cos = Math.cos(heading);
  // forward = -Z rotated by heading
  const dx = (moveX * cos - moveZ * sin) * speed * dt;
  const dz = (-moveX * sin - moveZ * cos) * speed * dt;
  const next: Vec3 = [s.position[0] + dx, s.position[1], s.position[2] + dz];
  const clamped = clampToRoom(next);
  s.setPosition(clamped);
  return clamped;
}
