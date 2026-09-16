import type { Vec3 } from '../state/playerStore';

export type ZoneId = 'studio' | 'club';

export interface ZoneDef {
  id: ZoneId;
  label: string;
  /** Interior box centered at origin. */
  bounds: { width: number; height: number; depth: number };
  spawn: Vec3;
  spawnYaw: number;
  portal: {
    /** Portal ring center (world space). */
    position: Vec3;
    /** Yaw the portal ring faces (toward the hallway). */
    yaw: number;
    target: ZoneId;
  };
  accent: string;
}

export const HALLWAY = {
  width: 3,
  length: 8,
  height: 3,
};

export const ZONES: Record<ZoneId, ZoneDef> = {
  studio: {
    id: 'studio',
    label: 'RECORDING STUDIO',
    bounds: { width: 24, height: 6, depth: 16 },
    // spawn faces -z toward the mixing desk
    spawn: [-1, 0, 6],
    spawnYaw: 0,
    portal: {
      // hallway leaves the +x wall at z=0; ring at the far end
      position: [24 / 2 + HALLWAY.length - 0.4, 1.4, 0],
      yaw: -Math.PI / 2,
      target: 'club',
    },
    accent: '#ffb454',
  },
  club: {
    id: 'club',
    label: 'DJ CLUB',
    bounds: { width: 26, height: 7, depth: 18 },
    spawn: [8, 0, 5],
    spawnYaw: 0.4,
    portal: {
      // hallway leaves the -x wall at z=0; ring at the far end
      position: [-(26 / 2 + HALLWAY.length - 0.4), 1.4, 0],
      yaw: Math.PI / 2,
      target: 'studio',
    },
    accent: '#1f3bff',
  },
};

interface Box {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function boxesFor(zone: ZoneId): { room: Box; hall: Box } {
  const { bounds, portal } = ZONES[zone];
  const hw = bounds.width / 2;
  const hd = bounds.depth / 2;
  const m = 0.6;
  const room: Box = {
    minX: -hw + m,
    maxX: hw - m,
    minZ: -hd + m,
    maxZ: hd - m,
  };
  const hallHalf = HALLWAY.width / 2 - m;
  const exitsPlusX = portal.position[0] > 0;
  const hall: Box = exitsPlusX
    ? {
        minX: hw - m - 0.5, // overlap the mouth so crossing is continuous
        maxX: hw + HALLWAY.length - m,
        minZ: -hallHalf,
        maxZ: hallHalf,
      }
    : {
        minX: -(hw + HALLWAY.length - m),
        maxX: -(hw - m - 0.5),
        minZ: -hallHalf,
        maxZ: hallHalf,
      };
  return { room, hall };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const inBox = (x: number, z: number, b: Box) =>
  x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;

/** Clamp a position inside the zone: room box OR hallway box. */
export function clampToZone(zone: ZoneId, pos: Vec3): Vec3 {
  const { bounds } = ZONES[zone];
  const { room, hall } = boxesFor(zone);
  const y = Math.max(0, Math.min(bounds.height - 0.6, pos[1]));
  const inRoom = inBox(pos[0], pos[2], room);
  const inHall = inBox(pos[0], pos[2], hall);
  if (inHall && !inRoom) {
    return [clamp(pos[0], hall.minX, hall.maxX), y, clamp(pos[2], hall.minZ, hall.maxZ)];
  }
  if (inRoom) {
    return [clamp(pos[0], room.minX, room.maxX), y, clamp(pos[2], room.minZ, room.maxZ)];
  }
  // Outside both (e.g. pushed by the mouth corner): clamp to whichever
  // box is nearer, preferring the hallway when close to it.
  const dHallX = pos[0] < hall.minX ? hall.minX - pos[0] : pos[0] > hall.maxX ? pos[0] - hall.maxX : 0;
  const dHallZ = pos[2] < hall.minZ ? hall.minZ - pos[2] : pos[2] > hall.maxZ ? pos[2] - hall.maxZ : 0;
  const dRoomX = pos[0] < room.minX ? room.minX - pos[0] : pos[0] > room.maxX ? pos[0] - room.maxX : 0;
  const dRoomZ = pos[2] < room.minZ ? room.minZ - pos[2] : pos[2] > room.maxZ ? pos[2] - room.maxZ : 0;
  const target =
    Math.hypot(dHallX, dHallZ) <= Math.hypot(dRoomX, dRoomZ) ? hall : room;
  return [clamp(pos[0], target.minX, target.maxX), y, clamp(pos[2], target.minZ, target.maxZ)];
}
