'use client';

/**
 * FocusSpaceVisualizer — technical audio analysis visualization for the music page.
 *
 * Replaces the previous abstract presets with three analytical renderers that feel
 * like studio equipment: a radial spectrum analyzer, a classic oscilloscope and a
 * pulsing reactor core. All presets share the same Web Audio analyser and react to
 * both frequency-domain and time-domain data.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BarChart3, Activity, Hexagon } from 'lucide-react';
import { globalAudioMap } from './AudioVisualizer';
import { useTranslation, usePrefersReducedMotion } from '@/hooks';

type FocusPreset = 'blob' | 'particles' | 'wave';

interface FocusSpaceVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

interface ThemeColors {
  primary: THREE.Color;
  secondary: THREE.Color;
  tertiary: THREE.Color;
  bg: THREE.Color;
}

interface AudioDataRef {
  current: {
    energy: { low: number; mid: number; high: number; total: number };
    frequency: Uint8Array<ArrayBuffer> | null;
    waveform: Uint8Array<ArrayBuffer> | null;
  };
}

interface SceneProps {
  preset: FocusPreset;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  colors: ThemeColors;
  reducedMotion: boolean;
}

interface PresetSceneProps {
  audioData: AudioDataRef;
  colors: ThemeColors;
  reducedMotion: boolean;
}

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const BAR_COUNT = 64;
const WAVE_POINTS = 240;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Parse a CSS color string into a Three.js Color.
 * Falls back to a computed style read for rgb()/hsl() values.
 */
function parseCssColor(value: string): THREE.Color {
  const v = value.trim();
  if (!v) return new THREE.Color('#888888');
  try {
    return new THREE.Color(v);
  } catch {
    const div = document.createElement('div');
    div.style.color = v;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).color;
    document.body.removeChild(div);
    const rgb = computed.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      return new THREE.Color(`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
    }
    return new THREE.Color('#888888');
  }
}

/**
 * Read the current theme colors from CSS custom properties.
 */
function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>({
    primary: new THREE.Color('#0E639C'),
    secondary: new THREE.Color('#8b5cf6'),
    tertiary: new THREE.Color('#06b6d4'),
    bg: new THREE.Color('#0a0a0a'),
  });

  useEffect(() => {
    const update = () => {
      const root = getComputedStyle(document.documentElement);
      setColors({
        primary: parseCssColor(root.getPropertyValue('--accent-primary')),
        secondary: parseCssColor(root.getPropertyValue('--accent-secondary')),
        tertiary: parseCssColor(root.getPropertyValue('--accent-tertiary')),
        bg: parseCssColor(root.getPropertyValue('--bg-primary')),
      });
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}

/**
 * Hook that builds or reuses the shared Web Audio analyser and samples it every frame.
 * Returns both frequency and waveform data plus aggregated energy bands.
 */
function useAudioData(audioRef: React.RefObject<HTMLAudioElement | null>, _isPlaying: boolean): AudioDataRef {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const waveRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const dataRef = useRef<AudioDataRef['current']>({
    energy: { low: 0, mid: 0, high: 0, total: 0 },
    frequency: null,
    waveform: null,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let connection = globalAudioMap.get(audio);
    if (!connection) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.82;

      try {
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        connection = { context: audioContext, analyser, source };
        globalAudioMap.set(audio, connection);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[FocusSpaceVisualizer] Audio context init failed:', err);
        }
        return;
      }
    }

    if (connection.context.state === 'suspended') {
      connection.context.resume().catch(() => {});
    }
    analyserRef.current = connection.analyser;
    freqRef.current = new Uint8Array(connection.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    waveRef.current = new Uint8Array(connection.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  }, [audioRef]);

  useFrame(() => {
    const analyser = analyserRef.current;
    const frequency = freqRef.current;
    const waveform = waveRef.current;
    if (!analyser || !frequency || !waveform) return;

    analyser.getByteFrequencyData(frequency);
    analyser.getByteTimeDomainData(waveform);

    const len = frequency.length;
    const lowEnd = Math.max(1, Math.floor(len * 0.08));
    const midEnd = Math.max(lowEnd + 1, Math.floor(len * 0.35));

    let lowSum = 0;
    let midSum = 0;
    let highSum = 0;
    for (let i = 0; i < lowEnd; i++) lowSum += frequency[i];
    for (let i = lowEnd; i < midEnd; i++) midSum += frequency[i];
    for (let i = midEnd; i < len; i++) highSum += frequency[i];

    const smooth = 0.82;
    const low = lowSum / lowEnd / 255;
    const mid = midSum / (midEnd - lowEnd) / 255;
    const high = highSum / (len - midEnd) / 255;

    dataRef.current.energy.low = dataRef.current.energy.low * smooth + low * (1 - smooth);
    dataRef.current.energy.mid = dataRef.current.energy.mid * smooth + mid * (1 - smooth);
    dataRef.current.energy.high = dataRef.current.energy.high * smooth + high * (1 - smooth);
    dataRef.current.energy.total = (dataRef.current.energy.low + dataRef.current.energy.mid + dataRef.current.energy.high) / 3;
    dataRef.current.frequency = frequency;
    dataRef.current.waveform = waveform;
  });

  return dataRef;
}

/* ------------------------------------------------------------------ */
/* Preset 1: Spectrum Ring                                            */
/* ------------------------------------------------------------------ */

/**
 * Radial spectrum analyzer built with an instanced mesh for performance.
 * Bars are arranged in a ring and scale with exponential frequency sampling
 * so the low end is not crushed together.
 */
function SpectrumRingScene({ audioData, colors: _colors, reducedMotion }: PresetSceneProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const floorRef = useRef<THREE.GridHelper>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.1, 1, 0.1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geometry: geo, material: mat };
  }, []);

  useEffect(() => {
    if (!floorRef.current) return;
    const mat = floorRef.current.material as THREE.GridHelper['material'];
    mat.color.setHex(0x0066ff);
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !audioData.current.frequency) return;
    const frequency = audioData.current.frequency;
    const radius = 2.4;

    for (let i = 0; i < BAR_COUNT; i++) {
      const t = i / (BAR_COUNT - 1);
      const sampleIdx = Math.min(
        frequency.length - 1,
        Math.floor(Math.pow(t, 1.5) * (frequency.length * 0.45))
      );
      const raw = frequency[sampleIdx] / 255;
      const intensity = Math.pow(raw, 1.4);
      const h = 0.15 + intensity * 4.2;
      const angle = (i / BAR_COUNT) * Math.PI * 2 + state.clock.elapsedTime * (reducedMotion ? 0.02 : 0.05);

      dummy.position.set(Math.cos(angle) * radius, -0.6, Math.sin(angle) * radius);
      dummy.rotation.y = -angle;
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Standard spectrum coloring: low frequencies are red, high frequencies violet,
      // and intensity pushes the bar toward white-hot brightness.
      const hue = THREE.MathUtils.lerp(0.0, 0.78, i / (BAR_COUNT - 1));
      colorTmp.setHSL(hue, 0.9, 0.5);
      colorTmp.lerp(new THREE.Color(0xffffff), intensity * 0.8);
      colorTmp.multiplyScalar(1 + intensity * 1.1);
      meshRef.current.setColorAt(i, colorTmp);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[geometry, material, BAR_COUNT]} />
      <gridHelper ref={floorRef} args={[14, 28, 0x444444, 0x222222]} position={[0, -0.65, 0]} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Preset 2: Oscilloscope                                             */
/* ------------------------------------------------------------------ */

/**
 * Classic dual-trace oscilloscope look: a waveform drawn as a line on a grid.
 * A second fainter trace shows the envelope of the total energy.
 */
function OscilloscopeScene({ audioData, colors: _colors, reducedMotion: _reducedMotion }: PresetSceneProps) {
  const gridRef = useRef<THREE.GridHelper>(null);

  const waveLine = useMemo(() => {
    const positions = new Float32Array(WAVE_POINTS * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ff9d }));
  }, []);

  const envelopeLine = useMemo(() => {
    const positions = new Float32Array(WAVE_POINTS * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.35 }));
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    const mat = gridRef.current.material as THREE.GridHelper['material'];
    mat.color.setHex(0x00aaff);
  }, []);

  useFrame(() => {
    const waveform = audioData.current.waveform;
    const total = audioData.current.energy.total;
    if (!waveform) return;

    const wavePos = waveLine.geometry.attributes.position.array as Float32Array;
    const envPos = envelopeLine.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < WAVE_POINTS; i++) {
      const idx = Math.floor((i / (WAVE_POINTS - 1)) * (waveform.length - 1));
      const v = waveform[idx] / 255;
      const y = (v - 0.5) * 4.5;
      const x = ((i / (WAVE_POINTS - 1)) - 0.5) * 7;
      wavePos[i * 3] = x;
      wavePos[i * 3 + 1] = y;
      wavePos[i * 3 + 2] = 0;

      const env = Math.sin(i * 0.08 + total * Math.PI) * (0.3 + total * 1.2);
      envPos[i * 3] = x;
      envPos[i * 3 + 1] = env;
      envPos[i * 3 + 2] = -0.4;
    }

    waveLine.geometry.attributes.position.needsUpdate = true;
    envelopeLine.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <gridHelper ref={gridRef} args={[10, 20, 0x444444, 0x222222]} position={[0, 0, -0.8]} />
      <primitive object={waveLine} />
      <primitive object={envelopeLine} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Preset 3: Gradient Terrain                                         */
/* ------------------------------------------------------------------ */

const TERRAIN_SIZE = 50;
const TERRAIN_SEGMENTS = 48;

/**
 * Standard heatmap gradient: blue -> cyan -> green -> yellow -> red -> white.
 * This matches scientific and audio-analysis visualizations instead of the site theme.
 */
function heatColor(t: number, out: THREE.Color): void {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  const hue = THREE.MathUtils.lerp(0.66, 0.0, clamped);
  out.setHSL(hue, 0.92, 0.52);
  if (clamped > 0.82) {
    out.lerp(new THREE.Color(0xffffff), (clamped - 0.82) / 0.18 * 0.85);
  }
  out.multiplyScalar(1 + clamped * 0.35);
}

/**
 * Map an elevation value to a heat-style color gradient that follows the spectrum.
 */
function elevationToColor(elevation: number, out: THREE.Color): void {
  const t = THREE.MathUtils.clamp((elevation + 0.5) / 2.4, 0, 1);
  heatColor(t, out);
}

/**
 * A 3D terrain whose height is sculpted by the audio spectrum in real time.
 * X axis represents frequency (exponentially sampled), Y axis is amplitude,
 * and vertex colors follow a standard heatmap gradient as peaks rise.
 */
function GradientTerrainScene({ audioData, colors: _colors, reducedMotion }: PresetSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const { geometry, material, wireGeometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    geo.rotateX(-Math.PI / 2.2);
    const colorsAttr = new Float32Array(geo.attributes.position.count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colorsAttr, 3));
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wireGeo = new THREE.WireframeGeometry(geo);
    return { geometry: geo, material: mat, wireGeometry: wireGeo };
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !wireRef.current || !audioData.current.frequency) return;
    const frequency = audioData.current.frequency;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const colorsAttr = meshRef.current.geometry.attributes.color.array as Float32Array;
    const count = meshRef.current.geometry.attributes.position.count;
    const cols = TERRAIN_SEGMENTS + 1;
    const total = audioData.current.energy.total;

    for (let i = 0; i < count; i++) {
      const ix = i % cols;
      const iz = Math.floor(i / cols);
      const freqT = Math.pow(ix / (cols - 1), 1.6);
      const sampleIdx = Math.min(frequency.length - 1, Math.floor(freqT * (frequency.length * 0.5)));
      const raw = frequency[sampleIdx] / 255;
      const wave = Math.sin(iz * 0.25 + state.clock.elapsedTime * (reducedMotion ? 0.3 : 1.2)) * 0.15;
      const elevation = (Math.pow(raw, 1.3) * 3.2 + wave) * (1 + total * 0.3);

      positions[i * 3 + 1] = elevation;

      elevationToColor(elevation, colorTmp);
      colorsAttr[i * 3] = colorTmp.r;
      colorsAttr[i * 3 + 1] = colorTmp.g;
      colorsAttr[i * 3 + 2] = colorTmp.b;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
    wireRef.current.geometry.attributes.position.array.set(positions);
    wireRef.current.geometry.attributes.position.needsUpdate = true;

    meshRef.current.rotation.y += 0.001 + total * 0.005;
    wireRef.current.rotation.y = meshRef.current.rotation.y;
  });

  return (
    <>
      <mesh ref={meshRef} geometry={geometry} material={material} position={[0, -0.8, 0]} />
      <lineSegments ref={wireRef} geometry={wireGeometry} position={[0, -0.8, 0]}>
        <lineBasicMaterial color={0x00aaff} transparent opacity={0.12} />
      </lineSegments>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Scene dispatcher                                                   */
/* ------------------------------------------------------------------ */

function FocusScene({ preset, audioRef, isPlaying, colors, reducedMotion }: SceneProps) {
  const audioData = useAudioData(audioRef, isPlaying);

  return (
    <>
      {preset === 'blob' && (
        <SpectrumRingScene audioData={audioData} colors={colors} reducedMotion={reducedMotion} />
      )}
      {preset === 'particles' && (
        <OscilloscopeScene audioData={audioData} colors={colors} reducedMotion={reducedMotion} />
      )}
      {preset === 'wave' && (
        <GradientTerrainScene audioData={audioData} colors={colors} reducedMotion={reducedMotion} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* UI overlay                                                         */
/* ------------------------------------------------------------------ */

const PRESETS: { key: FocusPreset; icon: React.ComponentType<{ className?: string }>; labelKey: 'focusBlob' | 'focusParticles' | 'focusWave' }[] = [
  { key: 'blob', icon: BarChart3, labelKey: 'focusBlob' },
  { key: 'particles', icon: Activity, labelKey: 'focusParticles' },
  { key: 'wave', icon: Hexagon, labelKey: 'focusWave' },
];

/**
 * HUD energy meters that mirror the analytical feel of the 3D scenes.
 */
function EnergyHud({ audioData }: { audioData: AudioDataRef }) {
  const [values, setValues] = useState({ low: 0, mid: 0, high: 0 });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setValues({ ...audioData.current.energy });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioData]);

  const bars = [
    { label: 'LOW', value: values.low, color: 'var(--accent-primary)' },
    { label: 'MID', value: values.mid, color: 'var(--accent-secondary)' },
    { label: 'HIGH', value: values.high, color: 'var(--accent-tertiary)' },
  ];

  return (
    <div
      className="absolute top-4 right-4 flex flex-col gap-2 p-2 z-10 min-w-[88px]"
      style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: '4px 4px 0 var(--border-subtle)' }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider px-1 pb-1 border-b-2"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
      >
        ANALYSER
      </div>
      <div className="flex flex-col gap-1.5">
        {bars.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[9px] font-mono w-8" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <div className="flex-1 h-2 overflow-hidden" style={{ background: 'var(--bg-tertiary)', border: PIXEL_BORDER }}>
              <div className="h-full transition-all duration-75" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FocusSpaceVisualizer({ audioRef, isPlaying }: FocusSpaceVisualizerProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const colors = useThemeColors();
  const [preset, setPreset] = useState<FocusPreset>('blob');

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="absolute inset-0">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5.2], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          frameloop={isPlaying ? 'always' : 'never'}
        >
          <FocusScene
            preset={preset}
            audioRef={audioRef}
            isPlaying={isPlaying}
            colors={colors}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </div>

      <div
        className="absolute top-4 left-4 flex flex-col gap-2 p-2 z-10"
        style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: '4px 4px 0 var(--border-subtle)' }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-wider px-1 pb-1 border-b-2"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          {t.music.focusMode}
        </div>
        <div className="flex flex-col gap-1">
          {PRESETS.map(({ key, icon: Icon, labelKey }) => {
            const active = preset === key;
            return (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
                style={{
                  background: active ? 'var(--accent-primary)' : 'transparent',
                  color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  fontFamily: 'var(--font-mono)',
                }}
                title={t.music[labelKey]}
              >
                <Icon className="w-3 h-3" />
                <span>{t.music[labelKey]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <EnergyHud audioData={useAudioData(audioRef, isPlaying)} />

      <div
        className="absolute bottom-4 right-4 text-[10px] font-mono uppercase tracking-wider z-10"
        style={{ color: 'var(--text-muted)' }}
      >
        {t.music.focusHint}
      </div>
    </div>
  );
}
