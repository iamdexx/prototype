import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { Studio } from './world/Studio';
import { DesktopControls } from './controls/DesktopControls';
import { GamepadControls } from './controls/GamepadControls';
import { TouchControls } from './controls/TouchControls';
import { VRRig } from './controls/VRRig';
import { RemoteAvatars } from './avatars/RemoteAvatars';
import { SpatialAudioSync } from './audio/SpatialAudioSync';
import { SharePanels } from './share/Panels';
import { DJBoard } from './dj/DJBoard';
import { HUD } from './ui/HUD';
import { NamePrompt } from './ui/NamePrompt';
import { PeerMesh } from './net/mesh';
import { roomFromUrl, type PeerStateMessage } from './net/protocol';
import { usePlayerStore } from './state/playerStore';
import { localHandJoints, localHandTracked } from './controls/handJoints';
import { walletInfo, WalletSync } from './web3/walletSync';
import { audioEngine } from './audio/engine';
import { useMic } from './audio/useMic';
import { useScreenShare } from './share/useScreenShare';
import { useShareStore } from './share/shareStore';

const isTouchDevice =
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function buildStateMessage(): PeerStateMessage {
  const s = usePlayerStore.getState();
  return {
    type: 'state',
    position: s.position,
    yaw: s.yaw,
    headPosition: s.headPosition,
    headQuaternion: s.headQuaternion,
    handJoints:
      localHandTracked[0] || localHandTracked[1] ? Array.from(localHandJoints) : [],
    mouthOpen: s.mouthOpen,
    name: s.displayName,
    wallet: walletInfo.short,
  };
}

/** Per-frame mouth sampling (must run inside the Canvas). */
function MicSampler({ sample }: { sample: () => number }) {
  useFrame(() => sample());
  return null;
}

export default function App() {
  const xrStore = useMemo(
    () =>
      createXRStore({
        handTracking: true,
        foveation: 0.5,
      }),
    [],
  );
  const meshRef = useRef<PeerMesh | null>(null);
  const mic = useMic();
  const share = useScreenShare(() => meshRef.current);
  const sharing = useShareStore((s) => s.sharing);

  useEffect(() => {
    const mesh = new PeerMesh(roomFromUrl(), buildStateMessage);
    // Always negotiate with the (initially silent) outgoing mix so an audio
    // sender exists before the mic or DJ is enabled.
    mesh.setOutgoingMedia(audioEngine.outgoingStream);
    meshRef.current = mesh;
    mesh.start();
    return () => {
      mesh.destroy();
      meshRef.current = null;
    };
  }, []);

  const toggleMic = () => {
    if (mic.enabled) {
      mic.disable();
    } else {
      void mic.enable();
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.6, 8], fov: 70, near: 0.05, far: 100 }}
        style={{ flex: 1 }}
      >
        <XR store={xrStore}>
          <color attach="background" args={['#0b0b10']} />
          <fog attach="fog" args={['#0b0b10', 20, 45]} />
          <Studio />
          <DJBoard position={[0, 0.5, -8]} />
          <RemoteAvatars />
          <SharePanels getMesh={() => meshRef.current} />
          <DesktopControls xrStore={xrStore} />
          <GamepadControls />
          <VRRig store={xrStore} />
          <SpatialAudioSync />
          <MicSampler sample={mic.sampleMouth} />
        </XR>
      </Canvas>
      {isTouchDevice && <TouchControls />}
      <NamePrompt />
      <HUD
        xrStore={xrStore}
        micEnabled={mic.enabled}
        onToggleMic={toggleMic}
        onShareScreen={() => {
          if (sharing) share.stop();
          else {
            if (!navigator.mediaDevices.getDisplayMedia) {
              // Quest browser fallback
              const url = window.prompt(
                'No screen capture in this browser. Enter an image/URL to share, or leave blank to share the camera:',
              );
              if (url) share.shareImageOrUrl(url);
              else void share.shareCamera();
            } else {
              void share.startScreen().catch(() => {
                const url = window.prompt('Screen capture failed. Share an image/URL instead?');
                if (url) share.shareImageOrUrl(url);
              });
            }
          }
        }}
        onShareCamera={() => void share.shareCamera()}
        onShareUrl={(url) => share.shareImageOrUrl(url)}
      />
      <WalletSync />
    </div>
  );
}
