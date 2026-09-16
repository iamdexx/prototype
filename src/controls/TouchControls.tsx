import { useRef, useState, type PointerEvent } from 'react';
import { sharedInput } from './locomotion';

function Joystick({
  side,
  onMove,
}: {
  side: 'left' | 'right';
  onMove: (x: number, y: number) => void;
}) {
  const [knob, setKnob] = useState<[number, number]>([0, 0]);
  const active = useRef<number | null>(null);
  const base = useRef<HTMLDivElement | null>(null);

  const handle = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current !== e.pointerId || !base.current) return;
    const rect = base.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = rect.width / 2;
    let x = (e.clientX - cx) / r;
    let y = (e.clientY - cy) / r;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    setKnob([x, y]);
    onMove(x, y);
  };

  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current !== e.pointerId) return;
    active.current = null;
    setKnob([0, 0]);
    onMove(0, 0);
  };

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        active.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handle(e);
      }}
      onPointerMove={handle}
      onPointerUp={end}
      onPointerCancel={end}
      style={{
        position: 'fixed',
        bottom: 24,
        [side]: 24,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.25)',
        touchAction: 'none',
        zIndex: 20,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.35)',
          transform: `translate(calc(-50% + ${knob[0] * 36}px), calc(-50% + ${knob[1] * 36}px))`,
        }}
      />
    </div>
  );
}

/** On-screen dual joysticks for mobile: left moves, right turns/looks. */
export function TouchControls() {
  return (
    <>
      <Joystick
        side="left"
        onMove={(x, y) => {
          sharedInput.moveX = x;
          sharedInput.moveZ = -y;
        }}
      />
      <Joystick
        side="right"
        onMove={(x) => {
          sharedInput.lookX = -x * 1.8;
        }}
      />
    </>
  );
}
