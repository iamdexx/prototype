import { create } from 'zustand';
import type { PeerStateMessage, PanelTransform } from './protocol';

export interface RemotePeer {
  id: string;
  state: PeerStateMessage | null;
  lastSeen: number;
  micStream: MediaStream | null;
  screenStream: MediaStream | null;
}

interface PeersState {
  selfId: string;
  isHost: boolean;
  connected: boolean;
  peers: Record<string, RemotePeer>;
  panels: Record<string, PanelTransform>;
  setSelf: (id: string, isHost: boolean) => void;
  setConnected: (v: boolean) => void;
  upsertPeer: (id: string) => void;
  removePeer: (id: string) => void;
  setPeerState: (id: string, s: PeerStateMessage) => void;
  setPeerStream: (id: string, kind: 'mic' | 'screen', stream: MediaStream | null) => void;
  setPanel: (p: PanelTransform) => void;
  removePanel: (id: string) => void;
}

export const usePeersStore = create<PeersState>((set) => ({
  selfId: '',
  isHost: false,
  connected: false,
  peers: {},
  panels: {},
  setSelf: (selfId, isHost) => set({ selfId, isHost }),
  setConnected: (connected) => set({ connected }),
  upsertPeer: (id) =>
    set((s) =>
      s.peers[id]
        ? s
        : {
            peers: {
              ...s.peers,
              [id]: { id, state: null, lastSeen: Date.now(), micStream: null, screenStream: null },
            },
          },
    ),
  removePeer: (id) =>
    set((s) => {
      const peers = { ...s.peers };
      delete peers[id];
      const panels = { ...s.panels };
      for (const [pid, p] of Object.entries(panels)) if (p.owner === id) delete panels[pid];
      return { peers, panels };
    }),
  setPeerState: (id, stateMsg) =>
    set((s) => ({
      peers: {
        ...s.peers,
        [id]: { ...(s.peers[id] ?? { id, micStream: null, screenStream: null }), state: stateMsg, lastSeen: Date.now() },
      },
    })),
  setPeerStream: (id, kind, stream) =>
    set((s) => {
      const p = s.peers[id];
      if (!p) return s;
      return {
        peers: {
          ...s.peers,
          [id]: { ...p, micStream: kind === 'mic' ? stream : p.micStream, screenStream: kind === 'screen' ? stream : p.screenStream },
        },
      };
    }),
  setPanel: (p) => set((s) => ({ panels: { ...s.panels, [p.id]: p } })),
  removePanel: (id) =>
    set((s) => {
      const panels = { ...s.panels };
      delete panels[id];
      return { panels };
    }),
}));
