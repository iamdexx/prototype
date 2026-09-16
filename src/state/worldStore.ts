import { create } from 'zustand';
import type { ZoneId } from '../world/zones';

interface WorldState {
  zone: ZoneId;
  transitioning: boolean;
  setZone: (z: ZoneId) => void;
  setTransitioning: (v: boolean) => void;
}

const initial: ZoneId =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('zone') === 'club'
    ? 'club'
    : 'studio';

export const useWorldStore = create<WorldState>((set) => ({
  zone: initial,
  transitioning: false,
  setZone: (zone) => set({ zone }),
  setTransitioning: (transitioning) => set({ transitioning }),
}));
