import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, type RootState } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
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
import { useQuality } from './state/quality';
import { useWorldStore } from './state/worldStore';
import { DJ_BOARD_POSITION } from './world/layout';
import { ZONES } from './world/zones';
import { Fade } from './ui/Fade';

const isTouchDevice =
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// Dev-only QA hooks: window.__player (zustand store) + window.__r3f (RootState).
const devWindow = window as unknown as Record<string, unknown>;
if (import.meta.env.DEV) {
  devWindow.__player = usePlayerStore;
  devWindow.__world = useWorldStore;
}

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
    zone: useWorldStore.getState().zone,
  };
}

/** Per-frame mouth sampling (must run inside the Canvas). */
function MicSampler({ sample }: { sample: () => number }) {
  useFrame(() => sample());
  return null;
}

/** Post-processing gated by device quality / XR session / ?fx=0. */
function PostFX() {
  const { postprocessing } = useQuality();
  if (!postprocessing) return null;
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom luminanceThreshold={0.9} intensity={0.8} mipmapBlur />
      <Vignette darkness={0.6} offset={0.3} />
    </EffectComposer>
  );
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
  const zone = useWorldStore((s) => s.zone);

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
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{
          position: [ZONES[useWorldStore.getState().zone].spawn[0], 1.6, ZONES[useWorldStore.getState().zone].spawn[2]],
          fov: 70,
          near: 0.05,
          far: 6000,
        }}
        style={{ flex: 1 }}
        onCreated={(state: RootState) => {
          if (import.meta.env.DEV) devWindow.__r3f = state;
        }}
      >
        <XR store={xrStore}>
          <color attach="background" args={['#0b0b10']} />
          <fog attach="fog" args={['#0b0b10', 30, 200]} />
          <Studio />
          {zone === 'club' && <DJBoard position={DJ_BOARD_POSITION} />}
          <RemoteAvatars />
          <SharePanels getMesh={() => meshRef.current} />
          <DesktopControls xrStore={xrStore} />
          <GamepadControls />
          <VRRig store={xrStore} />
          <SpatialAudioSync />
          <MicSampler sample={mic.sampleMouth} />
          <PostFX />
        </XR>
      </Canvas>
      {isTouchDevice && <TouchControls />}
      <Fade />
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
