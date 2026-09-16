import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { XRStore } from '@react-three/xr';
import { usePlayerStore } from '../state/playerStore';
import { stepLocomotion, sharedInput } from './locomotion';

const EYE_HEIGHT = 1.6;

/**
 * PC controls: pointer-lock mouse look + WASD (+ Shift sprint).
 * The camera is driven from the player store each frame.
 */
export function DesktopControls({ xrStore }: { xrStore: XRStore }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const keys = useRef<Set<string>>(new Set());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const pitch = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      sharedInput.sprint = e.shiftKey;
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
      sharedInput.sprint = e.shiftKey;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, dt) => {
    if (xrStore.getState().session) return; // XR drives the camera
    const s = usePlayerStore.getState();
    const k = keys.current;
    const moveZ =
      (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) + sharedInput.moveZ;
    const moveX =
      (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) + sharedInput.moveX;

    // Mouse-look yaw comes from the camera quaternion (set by PointerLockControls),
    // plus any virtual-look input (touch/gamepad turning).
    if (sharedInput.lookX !== 0) {
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y += sharedInput.lookX * dt * 2.2;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current + 0,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05,
      );
      euler.current.x = pitch.current;
      camera.quaternion.setFromEuler(euler.current);
    }
    euler.current.setFromQuaternion(camera.quaternion);
    pitch.current = euler.current.x;
    const heading = euler.current.y;
    s.setYaw(heading);

    const clamped = stepLocomotion(
      Math.min(dt, 0.1),
      THREE.MathUtils.clamp(moveX, -1, 1),
      THREE.MathUtils.clamp(moveZ, -1, 1),
      heading,
      sharedInput.sprint,
    );
    camera.position.set(clamped[0], clamped[1] + EYE_HEIGHT, clamped[2]);
    s.setHeadPose(
      [camera.position.x, camera.position.y, camera.position.z],
      [camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w],
    );
  });

  return <PointerLockControls args={[camera, gl.domElement]} selector="canvas" makeDefault />;
}
