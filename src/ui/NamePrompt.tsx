import { useState } from 'react';
import { usePlayerStore } from '../state/playerStore';

/** First-load display-name entry (persisted in localStorage). */
export function NamePrompt() {
  const name = usePlayerStore((s) => s.displayName);
  const setName = usePlayerStore((s) => s.setDisplayName);
  const [value, setValue] = useState('');

  if (name) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 100,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) setName(value.trim().slice(0, 24));
        }}
        style={{
          background: '#15151f', padding: 24, borderRadius: 10, border: '1px solid #333',
          display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280,
        }}
      >
        <b style={{ color: '#fff' }}>Enter the studio</b>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Display name"
          style={{ padding: 8, borderRadius: 6, border: '1px solid #444', background: '#0c0c14', color: '#fff' }}
        />
        <button type="submit" style={{ padding: 8, borderRadius: 6, border: 0, background: '#4f6df5', color: '#fff', cursor: 'pointer' }}>
          Join
        </button>
      </form>
    </div>
  );
}
