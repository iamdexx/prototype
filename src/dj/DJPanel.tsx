import { useRef, useState } from 'react';
import { djEngine } from './djEngine';
import { audioEngine } from '../audio/engine';

const styles = {
  panel: {
    position: 'fixed' as const,
    left: '50%',
    bottom: 170,
    transform: 'translateX(-50%)',
    background: 'rgba(16,16,24,0.95)',
    border: '1px solid #333',
    borderRadius: 8,
    padding: 12,
    color: '#ddd',
    fontSize: 12,
    zIndex: 30,
    display: 'flex',
    gap: 16,
  },
  deck: { display: 'flex', flexDirection: 'column' as const, gap: 6, minWidth: 170 },
  btn: {
    background: '#2a2f3f', color: '#eee', border: '1px solid #444',
    borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11,
  },
};

function DeckPanel({ side }: { side: 0 | 1 }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const deck = djEngine.deck(side);
  return (
    <div style={styles.deck}>
      <b>Deck {side === 0 ? 'A' : 'B'}</b>
      <span style={{ color: '#889', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {deck.fileName || 'no track'}
      </span>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { audioEngine.ensure(); void djEngine.loadFile(side, f); }
        }}
      />
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button style={styles.btn} onClick={() => fileRef.current?.click()}>Load file</button>
        <button style={styles.btn} onClick={() => { audioEngine.ensure(); djEngine.makeSynthLoop(side); }}>Synth loop</button>
        <button style={styles.btn} onClick={() => (deck.playing ? djEngine.stop(side) : djEngine.play(side))}>
          {deck.playing ? 'Pause' : 'Play'}
        </button>
        <button style={styles.btn} onClick={() => djEngine.cue(side)}>Cue</button>
      </div>
      {(['pitch', 'vol', 'fx'] as const).map((k) => (
        <label key={k}>
          {k.toUpperCase()}{' '}
          <input
            type="range" min={0} max={1} step={0.01}
            defaultValue={k === 'fx' ? 1 : k === 'vol' ? 0.8 : 0.5}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (k === 'pitch') djEngine.setRate(side, 0.5 + v);
              else if (k === 'vol') djEngine.setVolume(side, v);
              else djEngine.setFX(side, v);
            }}
          />
        </label>
      ))}
      {(['low', 'mid', 'high'] as const).map((band) => (
        <label key={band}>
          EQ {band}{' '}
          <input type="range" min={-12} max={12} step={0.5} defaultValue={0}
            onChange={(e) => djEngine.setEQ(side, band, Number(e.target.value))} />
        </label>
      ))}
    </div>
  );
}

/** 2D fallback DJ panel (same engine as the 3D board). */
export function DJPanel({ onClose }: { onClose: () => void }) {
  const [, force] = useState(0);
  djEngine.onChange = () => force((n) => n + 1);
  return (
    <div style={styles.panel}>
      <DeckPanel side={0} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
        <label>
          X-FADE{' '}
          <input type="range" min={0} max={1} step={0.01} defaultValue={0.5}
            onChange={(e) => djEngine.setCrossfade(Number(e.target.value))} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 28px)', gap: 4 }}>
          {Array.from({ length: 16 }, (_, i) => (
            <button key={i} style={{ ...styles.btn, padding: 6 }}
              onClick={() => { audioEngine.ensure(); djEngine.triggerPad(i); }}>
              {i + 1}
            </button>
          ))}
        </div>
        <button style={styles.btn} onClick={onClose}>Close</button>
      </div>
      <DeckPanel side={1} />
    </div>
  );
}
