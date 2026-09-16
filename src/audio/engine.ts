import * as THREE from 'three';
import { isInsideBooth } from '../world/booth';
import type { ZoneId } from '../world/zones';
import type { Vec3 } from '../state/playerStore';
import { useAudioSettings } from './audioSettingsStore';

interface SourceNodes {
  input: AudioNode;
  boothFilter: BiquadFilterNode;
  sourceGain: GainNode;
  panner: PannerNode;
  /** for per-frame position updates */
  position: THREE.Vector3;
  /** Which zone the source lives in; gain is 0 outside the local zone. */
  zone: ZoneId;
}

/**
 * Single AudioContext graph:
 *   MediaStreamSource -> BiquadFilter (booth lowpass) -> Gain (per-source vol)
 *     -> PannerNode (HRTF inverse) -> master Gain -> destination
 * Spatial off = bypass panner (connect sourceGain straight to master).
 */
class AudioEngine {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources = new Map<string, SourceNodes>();
  private mediaSources = new Map<string, MediaStreamAudioSourceNode>();
  /** DJ + mic mix destination feeding outgoing WebRTC stream. */
  outgoingDest: MediaStreamAudioDestinationNode | null = null;
  outgoingMix: GainNode | null = null;

  ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = useAudioSettings.getState().masterVolume;
      this.master.connect(this.ctx.destination);
      this.outgoingDest = this.ctx.createMediaStreamDestination();
      this.outgoingMix = this.ctx.createGain();
      this.outgoingMix.connect(this.outgoingDest);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  get outgoingStream(): MediaStream | null {
    this.ensure();
    return this.outgoingDest?.stream ?? null;
  }

  /** Feed a local audio node (mic, DJ master) into the outgoing WebRTC mix. */
  feedOutgoing(node: AudioNode) {
    this.ensure();
    if (this.outgoingMix) node.connect(this.outgoingMix);
  }

  attachStream(id: string, stream: MediaStream) {
    this.ensure();
    if (this.sources.has(id)) return;
    const ctx = this.ctx!;
    const input = ctx.createMediaStreamSource(stream);
    const boothFilter = ctx.createBiquadFilter();
    boothFilter.type = 'lowpass';
    boothFilter.frequency.value = 22050;
    const sourceGain = ctx.createGain();
    sourceGain.gain.value = useAudioSettings.getState().sourceVolumes[id] ?? 1;
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    const s = useAudioSettings.getState();
    panner.maxDistance = s.maxDistance;
    panner.rolloffFactor = s.rolloffFactor;

    input.connect(boothFilter).connect(sourceGain);
    this.routeSource(sourceGain, panner, s.spatial);

    const nodes: SourceNodes = {
      input,
      boothFilter,
      sourceGain,
      panner,
      position: new THREE.Vector3(0, 1.6, 0),
      zone: 'studio',
    };
    this.sources.set(id, nodes);
    this.mediaSources.set(id, input);
  }

  private routeSource(sourceGain: GainNode, panner: PannerNode, spatial: boolean) {
    sourceGain.disconnect();
    panner.disconnect();
    if (spatial) {
      sourceGain.connect(panner).connect(this.master!);
    } else {
      sourceGain.connect(this.master!);
    }
  }

  detachStream(id: string) {
    const n = this.sources.get(id);
    if (!n) return;
    n.input.disconnect();
    n.boothFilter.disconnect();
    n.sourceGain.disconnect();
    n.panner.disconnect();
    this.sources.delete(id);
    this.mediaSources.delete(id);
  }

  setSourceZone(id: string, zone: ZoneId) {
    const n = this.sources.get(id);
    if (n) n.zone = zone;
  }

  setSourcePosition(id: string, pos: Vec3) {
    const n = this.sources.get(id);
    if (!n || !this.ctx) return;
    n.position.set(pos[0], pos[1], pos[2]);
    const t = this.ctx.currentTime;
    n.panner.positionX.setTargetAtTime(pos[0], t, 0.05);
    n.panner.positionY.setTargetAtTime(pos[1], t, 0.05);
    n.panner.positionZ.setTargetAtTime(pos[2], t, 0.05);
  }

  setSourceVolume(id: string, v: number) {
    const n = this.sources.get(id);
    if (n && this.ctx) n.sourceGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
  }

  /** Per-frame update: listener pose, booth filtering, spatial params. */
  update(
    listenerPos: Vec3,
    fwd: THREE.Vector3,
    up: THREE.Vector3,
    localInBooth: boolean,
    localZone: ZoneId,
  ) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const l = ctx.listener;
    const t = ctx.currentTime;
    l.positionX.setTargetAtTime(listenerPos[0], t, 0.05);
    l.positionY.setTargetAtTime(listenerPos[1], t, 0.05);
    l.positionZ.setTargetAtTime(listenerPos[2], t, 0.05);
    l.forwardX.setTargetAtTime(fwd.x, t, 0.05);
    l.forwardY.setTargetAtTime(fwd.y, t, 0.05);
    l.forwardZ.setTargetAtTime(fwd.z, t, 0.05);
    l.upX.setTargetAtTime(up.x, t, 0.05);
    l.upY.setTargetAtTime(up.y, t, 0.05);
    l.upZ.setTargetAtTime(up.z, t, 0.05);

    const s = useAudioSettings.getState();
    this.master!.gain.setTargetAtTime(s.masterVolume, t, 0.05);

    for (const [id, n] of this.sources) {
      // Booth isolation: if one side is inside and the other outside, muffle.
      const remoteInBooth = isInsideBooth([n.position.x, n.position.y, n.position.z]);
      const isolated = localInBooth !== remoteInBooth;
      n.boothFilter.frequency.setTargetAtTime(isolated ? 600 : 22050, t, 0.08);
      n.boothFilter.Q.setTargetAtTime(isolated ? 1.2 : 0.7, t, 0.08);
      const vol = s.sourceVolumes[id] ?? 1;
      const zoneMuted = n.zone !== localZone ? 0 : 1;
      n.sourceGain.gain.setTargetAtTime(
        (isolated ? vol * 0.45 : vol) * zoneMuted,
        t,
        0.08,
      );

      n.panner.maxDistance = s.maxDistance;
      n.panner.rolloffFactor = s.rolloffFactor;
      // Re-route if the spatial flag changed.
      const routed = n.sourceGain.numberOfOutputs > 0 && n.panner.numberOfOutputs > 0;
      if (s.spatial && !routed) this.routeSource(n.sourceGain, n.panner, true);
      else if (!s.spatial && routed) this.routeSource(n.sourceGain, n.panner, false);
    }
  }

  hasSource(id: string) {
    return this.sources.has(id);
  }
}

export const audioEngine = new AudioEngine();
