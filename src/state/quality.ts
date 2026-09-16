import { useXR } from '@react-three/xr';

const fxOff =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('fx') === '0';

const lowEnd =
  typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 2;

/**
 * Whether post-processing should be enabled. Off for `?fx=0`, very low-end
 * devices, and active XR sessions (composer passes break stereoscopic render).
 */
export function useQuality(): { postprocessing: boolean } {
  const inXR = useXR((s) => !!s.session);
  return { postprocessing: !fxOff && !lowEnd && !inXR };
}
