'use client';

/**
 * Centralised Web Audio connection management for the music player.
 *
 * A single HTMLAudioElement can only ever have ONE MediaElementAudioSourceNode
 * created for it — a second createMediaElementSource() throws. All three
 * former initialisation sites (Context, AudioVisualizer, AudioMetrics) now go
 * through this module so the connection is created exactly once, only in CORS
 * mode, and can be torn down when CORS is downgraded or the network resets.
 */

export interface AudioConnection {
  context: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
}

const globalAudioMap = new WeakMap<HTMLAudioElement, AudioConnection>();

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

/** Subscribe to connection created/disposed events (returns unsubscribe). */
export function subscribeAudioConnection(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAudioConnection(audio: HTMLAudioElement | null | undefined): AudioConnection | undefined {
  return audio ? globalAudioMap.get(audio) : undefined;
}

/**
 * Create and cache a Web Audio analyser connection for an HTMLAudioElement.
 * Idempotent. Returns undefined unless the element is in CORS-anonymous mode,
 * because attaching a MediaElementSource to a non-CORS element mutes output.
 */
export function initAudioConnection(audio: HTMLAudioElement): AudioConnection | undefined {
  const existing = globalAudioMap.get(audio);
  if (existing) return existing;

  if (audio.crossOrigin !== 'anonymous') return undefined;

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return undefined;

  try {
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = DEFAULT_FFT_SIZE;
    analyser.smoothingTimeConstant = 0.82;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const connection: AudioConnection = { context: audioContext, analyser, source };
    globalAudioMap.set(audio, connection);
    notify();
    return connection;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[audio-analyser] init failed:', err);
    }
    return undefined;
  }
}

/**
 * Tear down the Web Audio connection for an element.
 *
 * IMPORTANT: createMediaElementSource permanently redirects the element's
 * output through the Web Audio graph. Disconnecting also silences the element,
 * so callers MUST swap in a fresh <audio> element (via the Context's audio
 * epoch) whenever they dispose a live connection. This is used on CORS
 * downgrade and network reset, where a fresh element is created anyway.
 */
export function disposeAudioConnection(audio: HTMLAudioElement | null | undefined): void {
  if (!audio) return;
  const connection = globalAudioMap.get(audio);
  if (!connection) return;
  try {
    connection.source.disconnect();
    connection.analyser.disconnect();
  } catch {
    // already disconnected
  }
  globalAudioMap.delete(audio);
  void connection.context.close().catch(() => {
    // ignore close failures
  });
  notify();
}

/** Resume the suspended Web Audio context for an element (call in a gesture). */
export function resumeAudioContext(audio: HTMLAudioElement | null | undefined): void {
  if (!audio) return;
  const connection = globalAudioMap.get(audio);
  if (connection && connection.context.state === 'suspended') {
    void connection.context.resume().catch(() => {
      // Ignore resume failures; playback falls back to direct output.
    });
  }
}

/** Audible range used for visualisation. 16 kHz+ carries little musical energy. */
export const MIN_FREQ = 60;
export const MAX_FREQ = 16000;
export const DEFAULT_FFT_SIZE = 8192;
/** Curve power > 1 expands the low-frequency (left) bands visually. */
export const FREQ_CURVE_POWER = 1.3;

/**
 * Map raw FFT bins onto logarithmically spaced bars over the audible range.
 * Shared by every visualisation surface so scaling can never diverge.
 */
export function getLogBars(
  dataArray: Uint8Array,
  sampleRate: number,
  fftSize: number,
  barCount: number
): number[] {
  const binCount = dataArray.length;
  const binSize = sampleRate / fftSize;
  const ratio = Math.log(MAX_FREQ / MIN_FREQ);
  const bars: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const startT = Math.pow(i / barCount, FREQ_CURVE_POWER);
    const endT = Math.pow((i + 1) / barCount, FREQ_CURVE_POWER);
    const startFreq = MIN_FREQ * Math.exp(startT * ratio);
    const endFreq = MIN_FREQ * Math.exp(endT * ratio);
    const startBin = Math.max(0, Math.floor(startFreq / binSize));
    const endBin = Math.min(binCount, Math.max(startBin + 1, Math.floor(endFreq / binSize)));

    let sum = 0;
    for (let j = startBin; j < endBin; j++) {
      sum += dataArray[j];
    }
    bars.push(sum / (endBin - startBin));
  }

  return bars;
}

/** Peak level in dBFS using a loop (avoids spreading thousands of bins). */
export function computePeakDb(dataArray: Uint8Array): number {
  let peak = 1;
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i] > peak) peak = dataArray[i];
  }
  return Math.round(20 * Math.log10(peak / 255));
}
