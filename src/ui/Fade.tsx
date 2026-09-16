import { useWorldStore } from '../state/worldStore';

/** Full-screen black fade for zone transitions (400ms CSS opacity). */
export function Fade() {
  const transitioning = useWorldStore((s) => s.transitioning);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        opacity: transitioning ? 1 : 0,
        transition: 'opacity 400ms ease',
        pointerEvents: transitioning ? 'auto' : 'none',
        zIndex: 90,
      }}
    />
  );
}
