import { useAudioSettings } from '../audio/audioSettingsStore';
import { audioEngine } from '../audio/engine';
import { usePeersStore } from '../net/peersStore';

const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, margin: '6px 0' } as const;

/** Spatial-audio settings drawer. */
export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useAudioSettings();
  const peers = usePeersStore((st) => st.peers);
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', top: 48, right: 8, width: 280, zIndex: 40,
        background: 'rgba(16,16,24,0.96)', border: '1px solid #333',
        borderRadius: 8, padding: 14, color: '#ddd', fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <b>Audio settings</b>
        <button onClick={onClose} style={{ background: 'none', border: 0, color: '#aaa', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={row}>
        <span>Mode</span>
        <button
          onClick={() => s.setSpatial(!s.spatial)}
          style={{ background: s.spatial ? '#4f6df5' : '#333', color: '#fff', border: 0, borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
        >
          {s.spatial ? 'Spatial (HRTF)' : 'Non-spatial'}
        </button>
      </div>
      <div style={row}>
        <span>Falloff distance ({s.maxDistance}m)</span>
        <input type="range" min={3} max={50} step={1} value={s.maxDistance}
          onChange={(e) => s.setMaxDistance(Number(e.target.value))} />
      </div>
      <div style={row}>
        <span>Rolloff ({s.rolloffFactor.toFixed(1)})</span>
        <input type="range" min={0} max={3} step={0.1} value={s.rolloffFactor}
          onChange={(e) => s.setRolloff(Number(e.target.value))} />
      </div>
      <div style={row}>
        <span>Master volume</span>
        <input type="range" min={0} max={1.5} step={0.01} value={s.masterVolume}
          onChange={(e) => s.setMasterVolume(Number(e.target.value))} />
      </div>
      <div style={{ marginTop: 10, borderTop: '1px solid #333', paddingTop: 8 }}>
        <b>Sources</b>
        {Object.values(peers).length === 0 && <div style={{ color: '#778' }}>No peers connected.</div>}
        {Object.values(peers).map((p) => {
          const label = p.state?.name || p.id.slice(-6);
          return (
            <div key={p.id}>
              {(['mic', 'screen'] as const).map((kind) => {
                const id = `${p.id}:${kind}`;
                const has = kind === 'mic' ? p.micStream : p.screenStream;
                if (!has) return null;
                const v = s.sourceVolumes[id] ?? 1;
                return (
                  <div key={id} style={row}>
                    <span>{label} · {kind}</span>
                    <input
                      type="range" min={0} max={1.5} step={0.01} value={v}
                      onChange={(e) => {
                        s.setSourceVolume(id, Number(e.target.value));
                        audioEngine.setSourceVolume(id, Number(e.target.value));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
