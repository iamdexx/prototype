import { useRef, useState } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { djEngine } from './djEngine';
import { audioEngine } from '../audio/engine';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Rotary knob: drag vertically (or VR ray) to change value 0..1. */
function Knob({ position, value: initial, onChange, label, color = '#9db4ff' }: {
  position: [number, number, number];
  value: number;
  onChange: (v: number) => void;
  label: string;
  color?: string;
}) {
  const [value, setValue] = useState(initial);
  const drag = useRef<{ y: number; v: number } | null>(null);
  const apply = (v: number) => {
    const c = clamp01(v);
    setValue(c);
    onChange(c);
  };
  return (
    <group position={position}>
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          drag.current = { y: e.clientY, v: value };
          (e.target as Element)?.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          e.stopPropagation();
          // Under pointer lock clientY is frozen, so fall back to movementY.
          if (document.pointerLockElement) {
            drag.current.v -= e.movementY / 150;
            apply(drag.current.v);
          } else {
            apply(drag.current.v + (drag.current.y - e.clientY) / 150);
          }
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <cylinderGeometry args={[0.03, 0.03, 0.03, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* indicator line rotates with value */}
      <mesh rotation={[0, -Math.PI * 0.75 + value * Math.PI * 1.5, 0]} position={[0, 0.017, 0]}>
        <boxGeometry args={[0.004, 0.004, 0.028]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <Text position={[0, -0.045, 0.01]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.025} color="#ccc" anchorX="center">
        {label}
      </Text>
    </group>
  );
}

/** Horizontal fader (crossfader / volume). */
function Fader({ position, value, onChange, width = 0.3, label }: {
  position: [number, number, number];
  value: number;
  onChange: (v: number) => void;
  width?: number;
  label?: string;
}) {
  const drag = useRef(false);
  const track = useRef<THREE.Group>(null);
  const set = (e: ThreeEvent<PointerEvent>) => {
    if (!track.current) return;
    const local = track.current.worldToLocal(e.point.clone());
    onChange(clamp01(local.x / width + 0.5));
  };
  return (
    <group position={position} ref={track}>
      <mesh
        onPointerDown={(e) => { e.stopPropagation(); drag.current = true; set(e); (e.target as Element)?.setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => { if (drag.current) { e.stopPropagation(); set(e); } }}
        onPointerUp={() => (drag.current = false)}
      >
        <boxGeometry args={[width, 0.008, 0.02]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[(value - 0.5) * width, 0.012, 0]}>
        <boxGeometry args={[0.03, 0.02, 0.05]} />
        <meshStandardMaterial color="#ff5533" />
      </mesh>
      {label && (
        <Text position={[0, -0.04, 0.01]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.025} color="#ccc" anchorX="center">
          {label}
        </Text>
      )}
    </group>
  );
}

function Pad({ position, index }: { position: [number, number, number]; index: number }) {
  const [flash, setFlash] = useState(false);
  return (
    <mesh
      position={position}
      onPointerDown={(e) => {
        e.stopPropagation();
        audioEngine.ensure();
        djEngine.triggerPad(index);
        setFlash(true);
        setTimeout(() => setFlash(false), 120);
      }}
    >
      <boxGeometry args={[0.07, 0.015, 0.07]} />
      <meshStandardMaterial
        color={flash ? '#fff' : ['#ff6644', '#ffcc44', '#44dd88', '#44aaff'][index % 4]}
        emissive={flash ? '#fff' : '#000'}
      />
    </mesh>
  );
}

function DeckControls({ side }: { side: 0 | 1 }) {
  const [, force] = useState(0);
  djEngine.onChange = () => force((n) => n + 1);
  const deck = djEngine.deck(side);
  const x = side === 0 ? -0.55 : 0.55;

  return (
    <group position={[x, 0, 0]}>
      <Text position={[0, 0.09, -0.28]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.04} color="#fff" anchorX="center">
        {`DECK ${side === 0 ? 'A' : 'B'} — ${deck.fileName || 'empty'}`}
      </Text>
      {/* play / cue / load-synth buttons */}
      {(
        [
          { label: deck.playing ? 'PAUSE' : 'PLAY', z: -0.16, fn: () => (deck.playing ? djEngine.stop(side) : djEngine.play(side)), c: '#44dd88' },
          { label: 'CUE', z: -0.08, fn: () => djEngine.cue(side), c: '#ffcc44' },
          { label: 'LOOP', z: 0.0, fn: () => djEngine.makeSynthLoop(side), c: '#9db4ff' },
        ] as const
      ).map((b) => (
        <group key={b.label} position={[-0.28, 0, b.z]}>
          <mesh
            onPointerDown={(e) => {
              e.stopPropagation();
              audioEngine.ensure();
              b.fn();
            }}
          >
            <boxGeometry args={[0.09, 0.02, 0.05]} />
            <meshStandardMaterial color={b.c} />
          </mesh>
          <Text position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.02} color="#000" anchorX="center">
            {b.label}
          </Text>
        </group>
      ))}
      {/* EQ knobs */}
      <Knob position={[-0.05, 0.03, -0.16]} value={0.5} onChange={(v) => djEngine.setEQ(side, 'high', (v - 0.5) * 24)} label="HI" />
      <Knob position={[-0.05, 0.03, -0.08]} value={0.5} onChange={(v) => djEngine.setEQ(side, 'mid', (v - 0.5) * 24)} label="MID" />
      <Knob position={[-0.05, 0.03, 0.0]} value={0.5} onChange={(v) => djEngine.setEQ(side, 'low', (v - 0.5) * 24)} label="LOW" />
      {/* pitch + FX */}
      <Knob position={[0.08, 0.03, -0.16]} value={0.5} onChange={(v) => djEngine.setRate(side, 0.5 + v)} label="PITCH" color="#ffaa55" />
      <Knob position={[0.08, 0.03, -0.08]} value={1} onChange={(v) => djEngine.setFX(side, v)} label="FX" color="#cc66ff" />
      {/* volume fader */}
      <Fader position={[0.22, 0.02, -0.05]} value={0.8} onChange={(v) => djEngine.setVolume(side, v)} width={0.18} label="VOL" />
    </group>
  );
}

/** Two-deck controller on the stage. All meshes are pointer-interactable. */
export function DJBoard({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const [, force] = useState(0);
  djEngine.onChange = () => force((n) => n + 1);
  return (
    <group position={position}>
      {/* table */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[2.2, 0.06, 0.9]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[2.0, 0.44, 0.7]} />
        <meshStandardMaterial color="#14141a" />
      </mesh>
      <group position={[0, 0.5, 0]} rotation={[-0.35, 0, 0]}>
        <DeckControls side={0} />
        <DeckControls side={1} />
        {/* crossfader */}
        <Fader
          position={[0, 0.02, 0.18]}
          value={djEngine.crossfade}
          onChange={(v) => djEngine.setCrossfade(v)}
          width={0.5}
          label="XFADE"
        />
        {/* 4x4 sample pads */}
        {Array.from({ length: 16 }, (_, i) => (
          <Pad
            key={i}
            index={i}
            position={[(i % 4 - 1.5) * 0.09, 0.02, 0.3 + Math.floor(i / 4) * 0.09]}
          />
        ))}
        <Text position={[0, -0.02, 0.26]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.022} color="#888" anchorX="center">
          PADS: kick / snare / hat / clap
        </Text>
      </group>
    </group>
  );
}
