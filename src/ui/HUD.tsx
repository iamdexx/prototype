import { useState } from 'react';
import type { XRStore } from '@react-three/xr';
import { usePlayerStore } from '../state/playerStore';
import { usePeersStore } from '../net/peersStore';
import { useShareStore } from '../share/shareStore';
import { roomFromUrl } from '../net/protocol';
import { WalletHUD } from '../web3/WalletHUD';
import { SettingsDrawer } from './SettingsDrawer';
import { DJPanel } from '../dj/DJPanel';

const bar = {
  position: 'fixed' as const,
  top: 0, left: 0, right: 0, height: 44,
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '0 12px', zIndex: 35,
  background: 'rgba(10,10,16,0.85)',
  borderBottom: '1px solid #222',
  fontFamily: 'system-ui, sans-serif',
};

const btn = {
  background: '#2a2f3f', color: '#eee', border: '1px solid #444',
  borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' as const,
};

export function HUD({
  xrStore,
  micEnabled,
  onToggleMic,
  onShareScreen,
  onShareCamera,
  onShareUrl,
}: {
  xrStore: XRStore;
  micEnabled: boolean;
  onToggleMic: () => void;
  onShareScreen: () => void;
  onShareCamera: () => void;
  onShareUrl: (url: string) => void;
}) {
  const room = roomFromUrl();
  const name = usePlayerStore((s) => s.displayName);
  const handTracking = usePlayerStore((s) => s.handTrackingActive);
  const sharing = useShareStore((s) => s.sharing);
  const peerCount = usePeersStore((s) => Object.keys(s.peers).length);
  const connected = usePeersStore((s) => s.connected);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [djOpen, setDjOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <>
      <div style={bar}>
        <b style={{ color: '#fff' }}>Ape Studio</b>
        <span style={{ color: '#889', fontSize: 12 }}>
          room: {room} · {name} · {connected ? `${peerCount + 1} online` : 'connecting…'}
        </span>
        <button style={btn} onClick={copyInvite}>{copied ? 'Copied!' : 'Invite'}</button>
        <button style={{ ...btn, background: micEnabled ? '#3d5' : btn.background }} onClick={onToggleMic}>
          {micEnabled ? 'Mic on' : 'Mic off'}
        </button>
        {handTracking && <span style={{ color: '#4f6df5', fontSize: 12 }}>✋ tracking</span>}
        <button style={btn} onClick={() => void xrStore.enterVR()}>Enter VR</button>
        <button style={btn} onClick={() => void xrStore.enterAR()}>AR</button>
        {sharing ? (
          <button style={{ ...btn, background: '#c44' }} onClick={onShareScreen}>Stop share</button>
        ) : (
          <>
            <button style={btn} onClick={onShareScreen}>Share screen</button>
            <button style={btn} onClick={onShareCamera}>Share cam</button>
            <button
              style={btn}
              onClick={() => {
                const url = window.prompt('Image or URL to share as a panel:');
                if (url) onShareUrl(url);
              }}
            >
              Share URL
            </button>
          </>
        )}
        <button style={btn} onClick={() => setDjOpen((v) => !v)}>DJ</button>
        <button style={btn} onClick={() => setSettingsOpen((v) => !v)}>Audio</button>
        <div style={{ marginLeft: 'auto' }}>
          <WalletHUD />
        </div>
      </div>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {djOpen && <DJPanel onClose={() => setDjOpen(false)} />}
    </>
  );
}
