import { create } from 'zustand';

export type Vec3 = [number, number, number];

export interface PlayerState {
  /** Feet position in world space. */
  position: Vec3;
  /** Yaw in radians around +Y. */
  yaw: number;
  /** Head pose (local headset / camera pose, world space for remote sends). */
  headPosition: Vec3;
  headQuaternion: [number, number, number, number];
  /** Smoothed mic-derived mouth openness 0..1 */
  mouthOpen: number;
  displayName: string;
  micEnabled: boolean;
  handTrackingActive: boolean;
  setPosition: (p: Vec3) => void;
  setYaw: (y: number) => void;
  setHeadPose: (p: Vec3, q: [number, number, number, number]) => void;
  setMouthOpen: (v: number) => void;
  setDisplayName: (n: string) => void;
  setMicEnabled: (v: boolean) => void;
  setHandTrackingActive: (v: boolean) => void;
}

const savedName =
  typeof localStorage !== 'undefined' ? localStorage.getItem('ape-studio-name') ?? '' : '';

export const usePlayerStore = create<PlayerState>((set) => ({
  position: [-12, 0, 9],
  yaw: 0, // camera identity = looking -z, toward the mixing desk
  headPosition: [-12, 1.6, 9],
  headQuaternion: [0, 0, 0, 1],
  mouthOpen: 0,
  displayName: savedName,
  micEnabled: false,
  handTrackingActive: false,
  setPosition: (position) => set({ position }),
  setYaw: (yaw) => set({ yaw }),
  setHeadPose: (headPosition, headQuaternion) => set({ headPosition, headQuaternion }),
  setMouthOpen: (mouthOpen) => set({ mouthOpen }),
  setDisplayName: (displayName) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('ape-studio-name', displayName);
    set({ displayName });
  },
  setMicEnabled: (micEnabled) => set({ micEnabled }),
  setHandTrackingActive: (handTrackingActive) => set({ handTrackingActive }),
}));
