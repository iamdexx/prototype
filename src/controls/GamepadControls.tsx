import { useFrame } from '@react-three/fiber';
import { sharedInput } from './locomotion';

const DEAD = 0.15;
const dz = (v: number) => (Math.abs(v) < DEAD ? 0 : v);

/** Last pressed state of the interact button (A on Xbox, X on PS). */
export const gamepadState = { interactPressed: false };

/**
 * Xbox/PS gamepad: left stick move, right stick yaw turn, A/X interact.
 * Runs outside the canvas input loop via useFrame polling.
 */
export function GamepadControls() {
  useFrame(() => {
    const pads = navigator.getGamepads?.() ?? [];
    let gp: Gamepad | null = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) return;
    // standard mapping: axes 0/1 left stick, 2/3 right stick
    sharedInput.moveX = dz(gp.axes[0] ?? 0);
    sharedInput.moveZ = -dz(gp.axes[1] ?? 0);
    sharedInput.lookX = -dz(gp.axes[2] ?? 0) * 1.5;
    gamepadState.interactPressed = gp.buttons[0]?.pressed ?? false;
  });
  return null;
}
