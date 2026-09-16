import { useCallback } from 'react';
import type { PeerMesh } from '../net/mesh';
import { useShareStore } from './shareStore';
import { usePeersStore } from '../net/peersStore';
import type { PanelTransform } from '../net/protocol';

let panelSeq = 0;

/**
 * Screen sharing. PC/mobile: getDisplayMedia({video, audio}).
 * Quest browser has no getDisplayMedia — use shareCamera/shareImage instead.
 */
export function useScreenShare(getMesh: () => PeerMesh | null) {
  const setSharing = useShareStore((s) => s.setSharing);

  const spawnPanel = useCallback(
    (kind: string, src: string): PanelTransform => {
      const self = usePeersStore.getState().selfId;
      const panel: PanelTransform = {
        id: `${self}-${Date.now()}-${panelSeq++}`,
        position: [0, 1.6, 3],
        quaternion: [0, 0, 0, 1],
        scale: 1,
        kind,
        src,
        owner: self,
      };
      usePeersStore.getState().setPanel(panel);
      getMesh()?.broadcastPanel(panel, panel.id);
      return panel;
    },
    [getMesh],
  );

  const startScreen = useCallback(async () => {
    if (!navigator.mediaDevices.getDisplayMedia) {
      throw new Error('getDisplayMedia unsupported on this browser');
    }
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      getMesh()?.shareScreen(null);
      setSharing(null);
    });
    setSharing(stream);
    getMesh()?.shareScreen(stream);
    spawnPanel('screen', '');
  }, [getMesh, setSharing, spawnPanel]);

  /** VR fallback: share the headset's rear camera as a pseudo-screen. */
  const shareCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    setSharing(stream);
    getMesh()?.shareScreen(stream);
    spawnPanel('screen', '');
  }, [getMesh, setSharing, spawnPanel]);

  /** VR/mobile fallback: share an image or embeddable URL panel. */
  const shareImageOrUrl = useCallback(
    (url: string) => {
      spawnPanel(url.match(/\.(png|jpe?g|gif|webp)$/i) ? 'image' : 'url', url);
    },
    [spawnPanel],
  );

  const stop = useCallback(() => {
    const s = useShareStore.getState().localStream;
    s?.getTracks().forEach((t) => t.stop());
    getMesh()?.shareScreen(null);
    setSharing(null);
  }, [getMesh, setSharing]);

  return { startScreen, shareCamera, shareImageOrUrl, stop, spawnPanel };
}
