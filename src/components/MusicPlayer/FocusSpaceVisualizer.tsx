'use client';

/**
 * FocusSpaceVisualizer — immersive WebGL audio visualization for the music page.
 *
 * Inspired by Kimi's "focus space" template, this component renders a central
 * 3D form that reacts to the playing audio spectrum. Three presets are provided:
 * Aurora (organic blob), Nebula (particle cloud) and Terrain (wave plane).
 *
 * The component reuses the shared Web Audio analyser created by AudioVisualizer
 * so no duplicate audio graph is built.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Circle, Sparkles, Mountain } from 'lucide-react';
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

interface AudioEnergyRef {
  current: {
    low: number;
    mid: number;
    high: number;
    total: number;
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
  audioData: AudioEnergyRef;
  colors: ThemeColors;
  reducedMotion: boolean;
}

const PIXEL_BORDER = '2px solid var(--border-subtle)';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseCssColor(value: string): THREE.Color {
  const v = value.trim();
  if (!v) return new THREE.Color('#888888');
  try {
    return new THREE.Color(v);
  } catch {
    // Fallback for rgb()/hsl() values by reading the computed color.
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

function useAudioData(audioRef: React.RefObject<HTMLAudioElement | null>, isPlaying: boolean): AudioEnergyRef {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<AudioEnergyRef['current']>({ low: 0, mid: 0, high: 0, total: 0 });

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
  }, [audioRef]);

  useFrame(() => {
    const analyser = analyserRef.current;
    if (!analyser || !isPlaying) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const len = dataArray.length;
    const lowEnd = Math.max(1, Math.floor(len * 0.08));
    const midEnd = Math.max(lowEnd + 1, Math.floor(len * 0.35));

    let lowSum = 0;
    let midSum = 0;
    let highSum = 0;

    for (let i = 0; i < lowEnd; i++) lowSum += dataArray[i];
    for (let i = lowEnd; i < midEnd; i++) midSum += dataArray[i];
    for (let i = midEnd; i < len; i++) highSum += dataArray[i];

    const low = lowSum / lowEnd / 255;
    const mid = midSum / (midEnd - lowEnd) / 255;
    const high = highSum / (len - midEnd) / 255;

    const smooth = 0.82;
    dataRef.current.low = dataRef.current.low * smooth + low * (1 - smooth);
    dataRef.current.mid = dataRef.current.mid * smooth + mid * (1 - smooth);
    dataRef.current.high = dataRef.current.high * smooth + high * (1 - smooth);
    dataRef.current.total = (dataRef.current.low + dataRef.current.mid + dataRef.current.high) / 3;
  });

  return dataRef;
}

/* ------------------------------------------------------------------ */
/* Shader chunks                                                      */
/* ------------------------------------------------------------------ */

const NOISE_3D = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

/* ------------------------------------------------------------------ */
/* Preset 1: Aurora Blob                                              */
/* ------------------------------------------------------------------ */

const blobVertexShader = `
${NOISE_3D}

varying vec3 vNormal;
varying vec3 vPosition;
varying float vAudio;

uniform float uTime;
uniform float uAudioLow;
uniform float uAudioMid;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec3 pos = position;

  float n1 = snoise(pos * 1.2 + vec3(0.0, uTime * 0.25, uTime * 0.15));
  float n2 = snoise(pos * 2.8 + vec3(uTime * 0.2, 0.0, -uTime * 0.1));
  float displacement = 0.18 + uAudioLow * 0.55 + uAudioMid * 0.25;

  pos += normal * (n1 + n2 * 0.35) * displacement;
  vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
  vAudio = uAudioLow;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const blobFragmentShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying float vAudio;

uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uTertiary;
uniform float uTime;

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

  vec3 color = mix(uPrimary, uSecondary, vAudio + 0.3);
  color = mix(color, uTertiary, fresnel * 0.6);
  color += uSecondary * fresnel * 0.4;

  float alpha = 0.75 + fresnel * 0.25;
  gl_FragColor = vec4(color, alpha);
}
`;

function BlobScene({ audioData, colors, reducedMotion }: PresetSceneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudioLow: { value: 0 },
      uAudioMid: { value: 0 },
      uPrimary: { value: colors.primary.clone() },
      uSecondary: { value: colors.secondary.clone() },
      uTertiary: { value: colors.tertiary.clone() },
    }),
    []
  );

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uPrimary.value.copy(colors.primary);
    materialRef.current.uniforms.uSecondary.value.copy(colors.secondary);
    materialRef.current.uniforms.uTertiary.value.copy(colors.tertiary);
  }, [colors]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const m = materialRef.current;
    const timeScale = reducedMotion ? 0.1 : 1.0;
    m.uniforms.uTime.value = state.clock.elapsedTime * timeScale;
    m.uniforms.uAudioLow.value = audioData.current.low;
    m.uniforms.uAudioMid.value = audioData.current.mid;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1.6, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={blobVertexShader}
        fragmentShader={blobFragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Preset 2: Nebula Particles                                         */
/* ------------------------------------------------------------------ */

const particleVertexShader = `
attribute float aSize;
attribute float aRandom;

varying vec3 vColor;

uniform float uTime;
uniform float uAudioMid;
uniform float uAudioHigh;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uTertiary;

void main() {
  vec3 pos = position;
  float pulse = uAudioMid * 0.6 + uAudioHigh * 0.3;
  pos += normalize(pos) * pulse * (0.5 + aRandom);
  pos += vec3(
    sin(uTime * 0.2 + aRandom * 10.0),
    cos(uTime * 0.15 + aRandom * 8.0),
    sin(uTime * 0.25 + aRandom * 12.0)
  ) * 0.05;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (1.0 + uAudioHigh * 3.0) * (200.0 / -mvPosition.z);

  vColor = mix(uPrimary, uSecondary, aRandom);
  vColor = mix(vColor, uTertiary, uAudioHigh);

  gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = `
varying vec3 vColor;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  if (d > 0.5) discard;
  float alpha = 1.0 - smoothstep(0.0, 0.5, d);
  gl_FragColor = vec4(vColor, alpha);
}
`;

const PARTICLE_COUNT = 3500;

function ParticleScene({ audioData, colors }: Omit<PresetSceneProps, 'reducedMotion'>) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const { positions, sizes, randoms } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const randoms = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 1.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 1.5 + Math.random() * 2.5;
      randoms[i] = Math.random();
    }

    return { positions, sizes, randoms };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudioMid: { value: 0 },
      uAudioHigh: { value: 0 },
      uPrimary: { value: colors.primary.clone() },
      uSecondary: { value: colors.secondary.clone() },
      uTertiary: { value: colors.tertiary.clone() },
    }),
    []
  );

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uPrimary.value.copy(colors.primary);
    materialRef.current.uniforms.uSecondary.value.copy(colors.secondary);
    materialRef.current.uniforms.uTertiary.value.copy(colors.tertiary);
  }, [colors]);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uAudioMid.value = audioData.current.mid;
    materialRef.current.uniforms.uAudioHigh.value = audioData.current.high;
  });

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Preset 3: Terrain Wave                                             */
/* ------------------------------------------------------------------ */

const waveVertexShader = `
varying vec2 vUv;
varying float vElevation;

uniform float uTime;
uniform float uAudioLow;
uniform float uAudioHigh;

void main() {
  vUv = uv;

  float elevation = sin(position.x * 2.0 + uTime) * cos(position.y * 2.0 + uTime) * 0.15;
  elevation += sin(position.x * 4.0 - uTime * 1.2) * 0.08;
  elevation += uAudioLow * 0.7 * sin(position.x * 5.0 + position.y * 3.0 + uTime * 3.0);
  elevation += uAudioHigh * 0.2 * sin(position.x * 10.0 + uTime * 5.0);

  vec3 pos = position;
  pos.z += elevation;
  vElevation = elevation;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waveFragmentShader = `
varying vec2 vUv;
varying float vElevation;

uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uTertiary;

void main() {
  vec3 color = mix(uSecondary, uPrimary, smoothstep(-0.6, 0.6, vElevation));
  color = mix(color, uTertiary, step(0.35, vElevation));

  vec2 grid = fract(vUv * 40.0);
  float line = step(0.96, max(grid.x, grid.y));
  color += line * 0.12;

  gl_FragColor = vec4(color, 0.92);
}
`;

function WaveScene({ audioData, colors, reducedMotion }: PresetSceneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudioLow: { value: 0 },
      uAudioHigh: { value: 0 },
      uPrimary: { value: colors.primary.clone() },
      uSecondary: { value: colors.secondary.clone() },
      uTertiary: { value: colors.tertiary.clone() },
    }),
    []
  );

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uPrimary.value.copy(colors.primary);
    materialRef.current.uniforms.uSecondary.value.copy(colors.secondary);
    materialRef.current.uniforms.uTertiary.value.copy(colors.tertiary);
  }, [colors]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const timeScale = reducedMotion ? 0.1 : 1.0;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * timeScale;
    materialRef.current.uniforms.uAudioLow.value = audioData.current.low;
    materialRef.current.uniforms.uAudioHigh.value = audioData.current.high;
  });

  return (
    <mesh rotation={[-Math.PI / 2.8, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[9, 9, 120, 120]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={waveVertexShader}
        fragmentShader={waveFragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
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
        <BlobScene audioData={audioData} colors={colors} reducedMotion={reducedMotion} />
      )}
      {preset === 'particles' && (
        <ParticleScene audioData={audioData} colors={colors} />
      )}
      {preset === 'wave' && (
        <WaveScene audioData={audioData} colors={colors} reducedMotion={reducedMotion} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* UI overlay                                                         */
/* ------------------------------------------------------------------ */

const PRESETS: { key: FocusPreset; icon: React.ComponentType<{ className?: string }>; labelKey: 'focusBlob' | 'focusParticles' | 'focusWave' }[] = [
  { key: 'blob', icon: Circle, labelKey: 'focusBlob' },
  { key: 'particles', icon: Sparkles, labelKey: 'focusParticles' },
  { key: 'wave', icon: Mountain, labelKey: 'focusWave' },
];

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
          camera={{ position: [0, 0, 4.8], fov: 45 }}
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

      {/* Preset switcher */}
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

      {/* Subtle hint */}
      <div
        className="absolute bottom-4 right-4 text-[10px] font-mono uppercase tracking-wider z-10"
        style={{ color: 'var(--text-muted)' }}
      >
        {t.music.focusHint}
      </div>
    </div>
  );
}
