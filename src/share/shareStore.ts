import { create } from 'zustand';

interface ShareState {
  sharing: boolean;
  localStream: MediaStream | null;
  setSharing: (s: MediaStream | null) => void;
}

export const useShareStore = create<ShareState>((set) => ({
  sharing: false,
  localStream: null,
  setSharing: (localStream) => set({ sharing: !!localStream, localStream }),
}));
