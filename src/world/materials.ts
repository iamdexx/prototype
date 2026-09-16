import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

const base = '/textures';
const PATHS = {
  woodD: `${base}/wood_floor_deck/diffuse.jpg`,
  woodN: `${base}/wood_floor_deck/normal.jpg`,
  woodR: `${base}/wood_floor_deck/rough.jpg`,
  conD: `${base}/concrete_floor_02/diffuse.jpg`,
  conN: `${base}/concrete_floor_02/normal.jpg`,
  conR: `${base}/concrete_floor_02/rough.jpg`,
  fabD: `${base}/fabric_pattern_07/diffuse.jpg`,
  fabN: `${base}/fabric_pattern_07/normal.jpg`,
  fabR: `${base}/fabric_pattern_07/rough.jpg`,
  plaD: `${base}/plastered_wall_04/diffuse.jpg`,
  plaN: `${base}/plastered_wall_04/normal.jpg`,
  plaR: `${base}/plastered_wall_04/rough.jpg`,
  metD: `${base}/metal_plate/diffuse.jpg`,
  metN: `${base}/metal_plate/normal.jpg`,
  metR: `${base}/metal_plate/rough.jpg`,
  leaD: `${base}/fabric_leather_01/diffuse.jpg`,
  leaN: `${base}/fabric_leather_01/normal.jpg`,
  leaR: `${base}/fabric_leather_01/rough.jpg`,
};

export type TexKey = keyof typeof PATHS;

function prep(t: THREE.Texture | undefined, rx: number, ry: number, srgb: boolean) {
  if (!t) return null;
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(rx, ry);
  if (srgb) c.colorSpace = THREE.SRGBColorSpace;
  c.needsUpdate = true;
  return c;
}

export interface WorldMaterials {
  woodFloor: THREE.MeshStandardMaterial;
  fabricWall: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  black: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
}

/**
 * All world materials from Poly Haven CC0 textures (see public/textures).
 * Memoized per component instance; textures are shared via drei cache.
 */
export function useWorldMaterials(): WorldMaterials {
  const t = useTexture(PATHS);
  return useMemo(() => {
    const pbr = (d: THREE.Texture | undefined, n: THREE.Texture | undefined, r: THREE.Texture | undefined, rx: number, ry: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({
        map: prep(d, rx, ry, true) ?? undefined,
        normalMap: prep(n, rx, ry, false) ?? undefined,
        roughnessMap: prep(r, rx, ry, false) ?? undefined,
        ...opts,
      });
    return {
      woodFloor: pbr(t.woodD, t.woodN, t.woodR, 6, 6, { color: '#8a7a68', roughness: 0.7 }),
      fabricWall: pbr(t.fabD, t.fabN, t.fabR, 6, 2, { color: '#3a3c44', roughness: 0.95 }),
      concrete: pbr(t.conD, t.conN, t.conR, 7, 7, { color: '#565662', roughness: 0.25, metalness: 0.3 }),
      plaster: pbr(t.plaD, t.plaN, t.plaR, 5, 2, { color: '#3f3f48', roughness: 0.85 }),
      metal: pbr(t.metD, t.metN, t.metR, 2, 2, { color: '#b8bcc4', metalness: 0.8, roughness: 0.4 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#d8dce2', metalness: 1, roughness: 0.15 }),
      leather: pbr(t.leaD, t.leaN, t.leaR, 2, 2, { color: '#1c1c20', roughness: 0.7 }),
      black: new THREE.MeshStandardMaterial({ color: '#0b0b0e', roughness: 0.9 }),
      ceiling: new THREE.MeshStandardMaterial({ color: '#060608', roughness: 1 }),
    };
  }, [t]);
}
