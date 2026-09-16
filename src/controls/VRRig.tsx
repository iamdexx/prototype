import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { XROrigin, useXR, useXRInputSourceState, type XRStore } from '@react-three/xr';
import { usePlayerStore } from '../state/playerStore';
import { stepLocomotion } from './locomotion';
import { localHandJoints, localHandTracked, XR_JOINT_NAMES } from './handJoints';
import { clampToRoom } from '../world/room';

const TURN_DEAD = 0.6;
const SNAP = Math.PI / 4; // 45 degrees

/**
 * VR rig: XROrigin follows the player store; thumbstick smooth locomotion on
 * the left controller, snap turn on the right. Also captures hand joints.
 */
export function VRRig({ store }: { store: XRStore }) {
  const origin = useRef<THREE.Group>(null);
  const leftCtrl = useXRInputSourceState('controller', 'left');
  const rightCtrl = useXRInputSourceState('controller', 'right');
  const leftHand = useXRInputSourceState('hand', 'left');
  const rightHand = useXRInputSourceState('hand', 'right');
  const session = useXR((s) => s.session);
  const snapLatch = useRef(false);
  const camera = useThree((s) => s.camera);

  useFrame((state, dt) => {
    const s = usePlayerStore.getState();
    if (!session) return;

    // --- locomotion: left stick move, right stick snap turn ---
    const gpL = leftCtrl?.inputSource?.gamepad;
    const gpR = rightCtrl?.inputSource?.gamepad;
    const mx = gpL?.axes[2] ?? 0;
    const mz = gpL?.axes[3] ?? 0;
    const rx = gpR?.axes[2] ?? 0;

    if (Math.abs(rx) > TURN_DEAD) {
      if (!snapLatch.current) {
        snapLatch.current = true;
        s.setYaw(s.yaw + (rx > 0 ? -SNAP : SNAP));
      }
    } else {
      snapLatch.current = false;
    }

    // Move relative to headset yaw so pushing forward goes where you look.
    const camEuler = new THREE.Euler().setFromQuaternion(
      camera.getWorldQuaternion(new THREE.Quaternion()),
      'YXZ',
    );
    const heading = s.yaw + camEuler.y;
    if (Math.abs(mx) > 0.12 || Math.abs(mz) > 0.12) {
      stepLocomotion(Math.min(dt, 0.1), mx, mz, heading, false);
    }

    // Sync origin to player store.
    if (origin.current) {
      origin.current.position.set(s.position[0], 0, s.position[2]);
      origin.current.rotation.set(0, s.yaw, 0);
    }

    // Head pose (world) for networking.
    const headPos = camera.getWorldPosition(new THREE.Vector3());
    const headQuat = camera.getWorldQuaternion(new THREE.Quaternion());
    s.setHeadPose(
      [headPos.x, headPos.y, headPos.z],
      [headQuat.x, headQuat.y, headQuat.z, headQuat.w],
    );
    const feet = clampToRoom([headPos.x, 0, headPos.z]);
    s.setPosition(feet);

    // --- hand joint capture ---
    const frame = (state as { xrFrame?: XRFrame }).xrFrame;
    const refSpace = store.getState().originReferenceSpace;
    let anyTracked = false;
    ([leftHand, rightHand] as const).forEach((src, handIdx) => {
      localHandTracked[handIdx] = false;
      const hand = src?.inputSource?.hand;
      if (!hand || !frame || !refSpace) return;
      const base = handIdx * 75;
      XR_JOINT_NAMES.forEach((name, j) => {
        const space = hand.get(name as XRHandJoint);
        if (!space) return;
        const pose = frame.getPose(space, refSpace);
        if (!pose) return;
        localHandJoints[base + j * 3] = pose.transform.position.x;
        localHandJoints[base + j * 3 + 1] = pose.transform.position.y;
        localHandJoints[base + j * 3 + 2] = pose.transform.position.z;
        localHandTracked[handIdx] = true;
        anyTracked = true;
      });
    });
    if (anyTracked !== s.handTrackingActive) s.setHandTrackingActive(anyTracked);
  });

  return <XROrigin ref={origin} position={[0, 0, 0]} />;
}
