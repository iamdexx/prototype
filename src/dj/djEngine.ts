import { audioEngine } from '../audio/engine';

/** Per-deck state. */
export interface Deck {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  fxFilter: BiquadFilterNode;
  analyser: AnalyserNode;
  playing: boolean;
  startedAt: number;
  offset: number;
  rate: number;
  fileName: string;
}

/**
 * Two-deck DJ engine. Signal chain per deck:
 *   source -> eqLow -> eqMid -> eqHigh -> fxFilter -> deckGain -> crossGain -> master
 * master -> spatial panner input (as a remote-style source) + outgoing mix.
 */
class DJEngine {
  decks: [Deck | null, Deck | null] = [null, null];
  private master: GainNode | null = null;
  private crossA: GainNode | null = null;
  private crossB: GainNode | null = null;
  private padGain: GainNode | null = null;
  crossfade = 0.5;
  onChange: () => void = () => undefined;

  private ensureGraph() {
    const ctx = audioEngine.ensure();
    if (this.master) return ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 1;
    this.crossA = ctx.createGain();
    this.crossB = ctx.createGain();
    this.crossA.connect(this.master);
    this.crossB.connect(this.master);
    this.padGain = ctx.createGain();
    this.padGain.connect(this.master);
    // DJ output is spatial at the booth position AND mixed into our mic stream.
    audioEngine.feedOutgoing(this.master);
    this.applyCrossfade();
    return ctx;
  }

  private makeDeck(i: 0 | 1): Deck {
    const ctx = this.ensureGraph();
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 200;
    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 5000;
    const fx = ctx.createBiquadFilter();
    fx.type = 'lowpass';
    fx.frequency.value = 20000;
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    eqLow.connect(eqMid).connect(eqHigh).connect(fx).connect(gain).connect(analyser);
    gain.connect(i === 0 ? this.crossA! : this.crossB!);
    const deck: Deck = {
      buffer: null, source: null, gain, eqLow, eqMid, eqHigh, fxFilter: fx,
      analyser, playing: false, startedAt: 0, offset: 0, rate: 1, fileName: '',
    };
    this.decks[i] = deck;
    return deck;
  }

  deck(i: 0 | 1): Deck {
    return this.decks[i] ?? this.makeDeck(i);
  }

  async loadFile(i: 0 | 1, file: File) {
    const ctx = this.ensureGraph();
    const deck = this.deck(i);
    this.stop(i);
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    deck.buffer = buf;
    deck.fileName = file.name;
    deck.offset = 0;
    this.onChange();
  }

  /** Built-in synthesized 4-bar loop so the decks work without files. */
  makeSynthLoop(i: 0 | 1) {
    const ctx = this.ensureGraph();
    const deck = this.deck(i);
    this.stop(i);
    const bpm = i === 0 ? 120 : 128;
    const beats = 16;
    const dur = (60 / bpm) * beats;
    const buf = ctx.createBuffer(2, Math.ceil(dur * ctx.sampleRate), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let s = 0; s < d.length; s++) {
        const t = s / ctx.sampleRate;
        const beat = (t * bpm) / 60;
        const kick = Math.exp(-((beat % 1) * 18)) * Math.sin(2 * Math.PI * (55 - (beat % 1) * 30) * t) * 0.9;
        const hat = (beat % 0.5) < 0.05 ? (Math.random() * 2 - 1) * Math.exp(-(beat % 0.5) * 120) * 0.25 : 0;
        const bass = Math.sin(2 * Math.PI * 55 * t) * 0.15 * (Math.floor(beat / 4) % 2 === 0 ? 1 : 0.6);
        d[s] = kick + hat + bass;
      }
    }
    deck.buffer = buf;
    deck.fileName = `Synth loop ${bpm}bpm`;
    deck.offset = 0;
    this.onChange();
  }

  play(i: 0 | 1) {
    const ctx = this.ensureGraph();
    const deck = this.deck(i);
    if (!deck.buffer || deck.playing) return;
    const src = ctx.createBufferSource();
    src.buffer = deck.buffer;
    src.loop = true;
    src.playbackRate.value = deck.rate;
    src.connect(deck.eqLow);
    src.start(0, deck.offset % deck.buffer.duration);
    deck.source = src;
    deck.startedAt = ctx.currentTime;
    deck.playing = true;
    this.onChange();
  }

  stop(i: 0 | 1) {
    const deck = this.deck(i);
    if (deck.playing && deck.source) {
      const ctx = audioEngine.ctx!;
      deck.offset += (ctx.currentTime - deck.startedAt) * deck.rate;
      try { deck.source.stop(); } catch { /* already stopped */ }
      deck.source.disconnect();
    }
    deck.source = null;
    deck.playing = false;
    this.onChange();
  }

  cue(i: 0 | 1) {
    this.stop(i);
    this.deck(i).offset = 0;
    this.onChange();
  }

  setRate(i: 0 | 1, rate: number) {
    const deck = this.deck(i);
    deck.rate = rate;
    deck.source?.playbackRate.setTargetAtTime(rate, audioEngine.ctx!.currentTime, 0.05);
    this.onChange();
  }

  setEQ(i: 0 | 1, band: 'low' | 'mid' | 'high', db: number) {
    const deck = this.deck(i);
    const f = band === 'low' ? deck.eqLow : band === 'mid' ? deck.eqMid : deck.eqHigh;
    f.gain.setTargetAtTime(db, audioEngine.ctx!.currentTime, 0.03);
    this.onChange();
  }

  setVolume(i: 0 | 1, v: number) {
    this.deck(i).gain.gain.setTargetAtTime(v, audioEngine.ctx!.currentTime, 0.03);
    this.onChange();
  }

  /** FX filter knob: 0..1 sweeps lowpass 200Hz..20kHz. */
  setFX(i: 0 | 1, v: number) {
    const hz = 200 * Math.pow(100, v);
    this.deck(i).fxFilter.frequency.setTargetAtTime(hz, audioEngine.ctx!.currentTime, 0.03);
    this.onChange();
  }

  setCrossfade(v: number) {
    this.crossfade = v;
    this.applyCrossfade();
    this.onChange();
  }

  private applyCrossfade() {
    const ctx = audioEngine.ctx;
    if (!ctx || !this.crossA || !this.crossB) return;
    const t = ctx.currentTime;
    this.crossA.gain.setTargetAtTime(Math.cos((this.crossfade * Math.PI) / 2), t, 0.02);
    this.crossB.gain.setTargetAtTime(Math.cos(((1 - this.crossfade) * Math.PI) / 2), t, 0.02);
  }

  /** 4x4 pad grid: synthesized drum hits. index 0..15. */
  triggerPad(index: number) {
    const ctx = this.ensureGraph();
    const t = ctx.currentTime;
    const kind = index % 4; // 0 kick, 1 snare, 2 hat, 3 clap
    const row = Math.floor(index / 4);
    if (kind === 0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(120 - row * 15, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(g).connect(this.padGain!);
      osc.start(t); osc.stop(t + 0.3);
    } else {
      // noise-based: snare / hat / clap
      const len = kind === 1 ? 0.2 : kind === 2 ? 0.06 : 0.15;
      const buf = ctx.createBuffer(1, Math.ceil(len * ctx.sampleRate), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let s = 0; s < d.length; s++) d[s] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = kind === 2 ? 'highpass' : 'bandpass';
      f.frequency.value = kind === 2 ? 7000 + row * 500 : 1800 + row * 300;
      const g = ctx.createGain();
      g.gain.setValueAtTime(kind === 2 ? 0.3 : 0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      src.connect(f).connect(g).connect(this.padGain!);
      src.start(t);
    }
  }
}

export const djEngine = new DJEngine();
