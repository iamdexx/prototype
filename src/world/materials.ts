import * as THREE from 'three';

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

/** Acoustic foam wedge tiles (studio walls). */
export function acousticWallMaterial(): THREE.MeshStandardMaterial {
  const { canvas, ctx } = makeCanvas(256, 256);
  if (ctx) {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const shade = 30 + ((x + y) % 2) * 22;
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 6})`;
        ctx.fillRect(x * 32, y * 32, 32, 32);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x * 32, y * 32, 32, 4);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 2);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
}

/** Warm wood planks (studio floor). */
export function woodFloorMaterial(): THREE.MeshStandardMaterial {
  const { canvas, ctx } = makeCanvas(512, 512);
  if (ctx) {
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const r = Math.round(107 + t * 31 + (i % 3) * 6); // #6b4a2e -> #8a6340
      const g = Math.round(74 + t * 25 + (i % 2) * 5);
      const b = Math.round(46 + t * 18);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, i * 32, 512, 32);
      // grain lines
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (let gline = 0; gline < 4; gline++) {
        const gy = i * 32 + 6 + gline * 7 + (i % 4);
        ctx.fillRect(0, gy, 512, 1);
      }
      ctx.fillRect(0, i * 32 + 31, 512, 2);
      // plank seams (staggered)
      const seam = ((i * 137) % 256) + 40;
      ctx.fillRect(seam, i * 32, 2, 32);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
}

/** Dark polished concrete (club floor). */
export function concreteFloorMaterial(): THREE.MeshStandardMaterial {
  const { canvas, ctx } = makeCanvas(256, 256);
  if (ctx) {
    ctx.fillStyle = '#14141a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 400; i++) {
      const v = 18 + Math.random() * 14;
      ctx.fillStyle = `rgba(${v},${v},${v + 6},0.5)`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: '#14141a',
    roughness: 0.3,
    metalness: 0.2,
  });
}

/** Vertical wood slat accent band for studio walls. */
export function woodSlatMaterial(): THREE.MeshStandardMaterial {
  const { canvas, ctx } = makeCanvas(256, 64);
  if (ctx) {
    for (let x = 0; x < 32; x++) {
      const shade = 90 + (x % 3) * 14;
      ctx.fillStyle = `rgb(${shade},${Math.round(shade * 0.7)},${Math.round(shade * 0.42)})`;
      ctx.fillRect(x * 8, 0, 7, 64);
      ctx.fillStyle = '#151009';
      ctx.fillRect(x * 8 + 7, 0, 1, 64);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
}
