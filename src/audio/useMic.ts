import { useCallback, useRef, useState } from 'react';
import { audioEngine } from './engine';
import { usePlayerStore } from '../state/playerStore';

/**
 * Mic capture + mouth-openness analysis.
 * The mic MediaStreamSource feeds the outgoing WebRTC mix and an AnalyserNode
 * whose smoothed RMS drives the local avatar's mouth.
 */
export function useMic() {
  const [enabled, setEnabled] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const enable = useCallback(async () => {
    const ctx = audioEngine.ensure();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;
    const src = ctx.createMediaStreamSource(stream);
    audioEngine.feedOutgoing(src);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    analyserRef.current = analyser;
    bufRef.current = new Float32Array(analyser.fftSize);
    setEnabled(true);
    usePlayerStore.getState().setMicEnabled(true);
  }, []);

  const disable = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setEnabled(false);
    usePlayerStore.getState().setMicEnabled(false);
    usePlayerStore.getState().setMouthOpen(0);
  }, []);

  /** Call each frame; returns smoothed mouth openness 0..1. */
  const sampleMouth = useCallback((): number => {
    const analyser = analyserRef.current;
    const buf = bufRef.current;
    if (!analyser || !buf) return 0;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const target = Math.min(1, rms * 6);
    const cur = usePlayerStore.getState().mouthOpen;
    const smoothed = cur + (target - cur) * 0.35;
    usePlayerStore.getState().setMouthOpen(smoothed);
    return smoothed;
  }, []);

  return { enabled, enable, disable, sampleMouth };
}
