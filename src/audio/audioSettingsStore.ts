import { create } from 'zustand';

interface AudioSettings {
  spatial: boolean;
  maxDistance: number;
  rolloffFactor: number;
  masterVolume: number;
  /** per-source gain multipliers, keyed by source id */
  sourceVolumes: Record<string, number>;
  setSpatial: (v: boolean) => void;
  setMaxDistance: (v: number) => void;
  setRolloff: (v: number) => void;
  setMasterVolume: (v: number) => void;
  setSourceVolume: (id: string, v: number) => void;
}

export const useAudioSettings = create<AudioSettings>((set) => ({
  spatial: true,
  maxDistance: 25,
  rolloffFactor: 1.5,
  masterVolume: 1,
  sourceVolumes: {},
  setSpatial: (spatial) => set({ spatial }),
  setMaxDistance: (maxDistance) => set({ maxDistance }),
  setRolloff: (rolloffFactor) => set({ rolloffFactor }),
  setMasterVolume: (masterVolume) => set({ masterVolume }),
  setSourceVolume: (id, v) =>
    set((s) => ({ sourceVolumes: { ...s.sourceVolumes, [id]: v } })),
}));
