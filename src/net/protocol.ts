import type { Vec3 } from '../state/playerStore';
import type { ZoneId } from '../world/zones';

/** Deterministic host peer id for a room. */
export const hostIdForRoom = (room: string) => `ape-studio-${room}-host`;

export const roomFromUrl = (): string => {
  const params = new URLSearchParams(window.location.search);
  return params.get('room')?.trim() || 'lobby';
};

/** Compact per-peer state broadcast at 15 Hz. */
export interface PeerStateMessage {
  type: 'state';
  position: Vec3;
  yaw: number;
  headPosition: Vec3;
  headQuaternion: [number, number, number, number];
  /** 150 floats (25 joints x 2 hands x xyz) serialized as number[]; empty when untracked. */
  handJoints: number[];
  mouthOpen: number;
  name: string;
  wallet: string;
  /** Which environment the peer is in; older clients may omit it. */
  zone?: ZoneId;
}

export interface PeerListMessage {
  type: 'peer-list';
  /** Peer ids the host knows about; clients connect to all to form a mesh. */
  peers: string[];
}

export interface PanelTransform {
  id: string;
  position: Vec3;
  quaternion: [number, number, number, number];
  scale: number;
  /** 'screen' | 'image' | 'url' */
  kind: string;
  /** URL for image/url panels. */
  src: string;
  owner: string;
  zone: ZoneId;
}

export interface PanelMessage {
  type: 'panel';
  panel: PanelTransform | null; // null => delete
  panelId: string;
}

export type NetMessage = PeerStateMessage | PeerListMessage | PanelMessage;

export const HAND_JOINT_COUNT = 25;
