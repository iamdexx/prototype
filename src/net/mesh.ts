import Peer, { type DataConnection, type MediaConnection } from 'peerjs';
import { hostIdForRoom, type NetMessage, type PanelTransform, type PeerStateMessage } from './protocol';
import { usePeersStore } from './peersStore';
import { audioEngine } from '../audio/engine';

type CallKind = 'mic' | 'screen';

interface CallMeta {
  kind: CallKind;
}

/**
 * Full-mesh PeerJS network. One peer claims the deterministic host id; everyone
 * else connects to it, receives the peer list, and connects to all peers.
 */
export class PeerMesh {
  private peer: Peer | null = null;
  private conns = new Map<string, DataConnection>();
  private calls = new Map<string, MediaConnection>();
  private room: string;
  private destroyed = false;
  private outgoingMedia: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private getState: () => PeerStateMessage;
  private broadcastTimer: ReturnType<typeof setInterval> | null = null;
  onError: (msg: string) => void = () => undefined;

  constructor(room: string, getState: () => PeerStateMessage) {
    this.room = room;
    this.getState = getState;
  }

  start() {
    this.tryBecomeHost();
  }

  destroy() {
    this.destroyed = true;
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    for (const c of this.conns.values()) c.close();
    for (const c of this.calls.values()) c.close();
    this.peer?.destroy();
    this.peer = null;
    this.conns.clear();
    this.calls.clear();
  }

  private tryBecomeHost() {
    const hostId = hostIdForRoom(this.room);
    const peer = new Peer(hostId, { debug: 1 });
    this.wirePeer(peer, true);
    peer.on('error', (err) => {
      const e = err as { type?: string };
      if (e.type === 'unavailable-id' && !this.destroyed) {
        // Host exists — join as a client.
        peer.destroy();
        const client = new Peer({ debug: 1 });
        this.wirePeer(client, false);
        client.on('open', () => this.connectTo(hostId));
      }
    });
  }

  private wirePeer(peer: Peer, isHost: boolean) {
    this.peer = peer;
    const store = usePeersStore.getState();
    peer.on('open', (id) => {
      store.setSelf(id, isHost);
      store.setConnected(true);
      if (isHost) this.startBroadcast();
    });
    peer.on('connection', (conn) => this.handleData(conn));
    peer.on('call', (call) => {
      call.answer(this.outgoingMedia ?? audioEngine.outgoingStream ?? undefined);
      this.wireCall(call);
    });
    peer.on('disconnected', () => {
      if (!this.destroyed && !peer.destroyed) peer.reconnect();
    });
    peer.on('error', (err) => {
      const e = err as { type?: string; message?: string };
      if (e.type === 'peer-unavailable') return; // peer left; fine
      if (e.type !== 'unavailable-id') this.onError(e.message ?? String(err));
    });
  }

  private startBroadcast() {
    if (this.broadcastTimer) return;
    this.broadcastTimer = setInterval(() => this.broadcastState(), 1000 / 15);
  }

  private connectTo(peerId: string) {
    if (!this.peer || this.conns.has(peerId) || peerId === this.peer.id) return;
    const conn = this.peer.connect(peerId, { reliable: true });
    this.handleData(conn);
    // Media call: send our mic/dj mix both ways.
    const call = this.peer.call(peerId, this.outgoingMedia ?? audioEngine.outgoingStream ?? new MediaStream(), {
      metadata: { kind: 'mic' satisfies CallKind },
    });
    if (call) this.wireCall(call);
  }

  private handleData(conn: DataConnection) {
    conn.on('open', () => {
      const id = conn.peer;
      this.conns.set(id, conn);
      const store = usePeersStore.getState();
      store.upsertPeer(id);
      if (store.isHost) {
        // Tell everyone (including the new peer) the full peer list.
        const ids = [this.peer!.id, ...this.conns.keys()];
        this.sendToAll({ type: 'peer-list', peers: ids });
      }
      if (!this.broadcastTimer) this.startBroadcast();
    });
    conn.on('data', (data) => this.handleMessage(conn.peer, data as NetMessage));
    conn.on('close', () => this.dropPeer(conn.peer));
    conn.on('error', () => this.dropPeer(conn.peer));
  }

  private handleMessage(from: string, msg: NetMessage) {
    const store = usePeersStore.getState();
    switch (msg.type) {
      case 'state':
        store.setPeerState(from, msg);
        break;
      case 'peer-list':
        if (!store.isHost) {
          for (const id of msg.peers) {
            if (id !== this.peer?.id && !this.conns.has(id)) {
              // Avoid duplicate dials: only the lower id initiates.
              if (this.peer && this.peer.id < id) this.connectTo(id);
            }
          }
        }
        break;
      case 'panel':
        if (msg.panel) store.setPanel(msg.panel);
        else store.removePanel(msg.panelId);
        break;
    }
  }

  private wireCall(call: MediaConnection) {
    const meta = call.metadata as CallMeta | undefined;
    const kind: CallKind = meta?.kind === 'screen' ? 'screen' : 'mic';
    call.on('stream', (stream) => {
      usePeersStore.getState().upsertPeer(call.peer);
      usePeersStore.getState().setPeerStream(call.peer, kind, stream);
    });
    call.on('close', () => {
      usePeersStore.getState().setPeerStream(call.peer, kind, null);
      this.calls.delete(`${call.peer}:${kind}`);
    });
    call.on('error', () => this.calls.delete(`${call.peer}:${kind}`));
    this.calls.set(`${call.peer}:${kind}`, call);
  }

  private dropPeer(id: string) {
    this.conns.delete(id);
    usePeersStore.getState().removePeer(id);
  }

  private broadcastState() {
    const msg = this.getState();
    this.sendToAll(msg);
  }

  sendToAll(msg: NetMessage) {
    for (const conn of this.conns.values()) {
      if (conn.open) conn.send(msg);
    }
  }

  /** Panel create/update/delete broadcast. */
  broadcastPanel(panel: PanelTransform | null, panelId: string) {
    this.sendToAll({ type: 'panel', panel, panelId });
  }

  /** Replace the outgoing mic/DJ stream for future + existing calls. */
  setOutgoingMedia(stream: MediaStream | null) {
    this.outgoingMedia = stream;
    // Re-negotiate is not supported without replaceTrack; PeerJS wraps
    // RTCPeerConnection, so swap tracks on the senders directly.
    const audio = stream?.getAudioTracks()[0];
    for (const [key, call] of this.calls) {
      if (!key.endsWith(':mic')) continue;
      const pc = (call as unknown as { peerConnection?: RTCPeerConnection }).peerConnection;
      const sender = pc?.getSenders().find((s) => s.track?.kind === 'audio');
      if (sender && audio) void sender.replaceTrack(audio);
    }
  }

  /** Start (or stop, with null) sharing a screen stream to all peers. */
  shareScreen(stream: MediaStream | null) {
    this.screenStream = stream;
    if (!stream) {
      for (const [key, call] of this.calls) {
        if (key.endsWith(':screen')) call.close();
      }
      return;
    }
    for (const id of this.conns.keys()) {
      const call = this.peer?.call(id, stream, {
        metadata: { kind: 'screen' satisfies CallKind },
      });
      if (call) this.wireCall(call);
    }
  }

  getScreenStream() {
    return this.screenStream;
  }
}
