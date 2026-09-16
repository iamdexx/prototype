#!/usr/bin/env node
/**
 * Downloads CC0 texture maps from Poly Haven into public/textures/.
 * Usage: node scripts/fetch-textures.mjs
 * Maps fetched per asset: Diffuse -> diffuse.jpg, nor_gl -> normal.jpg,
 * Rough -> rough.jpg (all 1k JPG).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ASSETS = [
  'wood_floor_deck',   // studio floor: dark wood planks
  'concrete_floor_02', // club floor + walls: dark polished concrete
  'fabric_pattern_07', // studio walls: dark acoustic fabric
  'plastered_wall_04', // club walls: dark plaster
  'metal_plate',       // trim/gear: brushed metal
  'fabric_leather_01', // couch: black leather-look fabric
];

const MAPS = { Diffuse: 'diffuse', nor_gl: 'normal', Rough: 'rough' };
const OUT = new URL('../public/textures/', import.meta.url).pathname;
const UA = { 'User-Agent': 'ape-studio-texture-fetch/1.0' };

const j = async (url) => (await fetch(url, { headers: UA })).json();

for (const id of ASSETS) {
  const files = await j(`https://api.polyhaven.com/files/${id}`);
  const dir = join(OUT, id);
  await mkdir(dir, { recursive: true });
  for (const [map, name] of Object.entries(MAPS)) {
    // some assets ship color variants (col_1, col_2, ...) instead of Diffuse
    const entry = files[map]?.['1k']?.jpg ?? files[`${map === 'Diffuse' ? 'col_1' : map}`]?.['1k']?.jpg;
    if (!entry) {
      console.warn(`${id}: no ${map} 1k jpg — skipped`);
      continue;
    }
    const res = await fetch(entry.url, { headers: UA });
    if (!res.ok) throw new Error(`${id}/${map}: HTTP ${res.status}`);
    await writeFile(join(dir, `${name}.jpg`), Buffer.from(await res.arrayBuffer()));
    console.log(`${id}/${name}.jpg`);
  }
}

await writeFile(
  join(OUT, 'LICENSE.md'),
  `# Texture license

All textures in this directory are from Poly Haven (https://polyhaven.com)
and are licensed CC0 (public domain). No attribution required; credit given
anyway.

Assets: ${ASSETS.join(', ')}
`,
);
console.log('done');
