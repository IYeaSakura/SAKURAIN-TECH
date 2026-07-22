'use client';

/**
 * 实验室画布 —— R3F Canvas 封装。
 *
 * 性能策略：
 * - dpr 上限 2，运行时按帧率自动降档（< 45fps 连续采样即降 0.25，下限 1）
 * - IntersectionObserver + visibilitychange：离屏/切后台时切到 demand 帧循环
 * - frozen（prefers-reduced-motion）时整场景静帧，只渲染初始一帧
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { MoebiusWireframe } from './MoebiusWireframe';
import { DataFlowParticles } from './DataFlowParticles';

export interface LabCanvasProps {
  /** 归一化指针坐标 [-1, 1]，由页面层 pointermove 写入 */
  pointerRef: { current: { x: number; y: number } };
  /** 静帧模式（prefers-reduced-motion） */
  frozen: boolean;
  particleCount: number;
  /** 帧率采样回调（约每 0.5s 一次），同时上报当前 dpr */
  onStats?: (fps: number, dpr: number) => void;
}

/** 视差与缓动装置：外层跟随指针，内层缓慢公转 */
function SceneRig({
  pointerRef,
  frozen,
  children,
}: {
  pointerRef: LabCanvasProps['pointerRef'];
  frozen: boolean;
  children: React.ReactNode;
}) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!outer.current || !inner.current) return;
    const step = Math.min(delta, 0.05);
    if (!frozen) inner.current.rotation.y += step * 0.06; // 恒速公转

    // 指针视差：目标角度向指针位置缓动；静帧模式回到默认机位
    const targetY = frozen ? 0 : pointerRef.current.x * 0.3;
    const targetX = frozen ? 0.12 : 0.12 - pointerRef.current.y * 0.18;
    const k = Math.min(1, step * 4);
    outer.current.rotation.y += (targetY - outer.current.rotation.y) * k;
    outer.current.rotation.x += (targetX - outer.current.rotation.x) * k;
  });

  return (
    // 初始俯仰 0.12：静帧模式首帧即是最终构图，无需等待缓动
    <group ref={outer} rotation={[0.12, 0, 0]}>
      <group ref={inner}>{children}</group>
    </group>
  );
}

/** 帧率探针：聚合 0.5s 内的帧数并上报 */
function FpsProbe({
  active,
  onSample,
}: {
  active: boolean;
  onSample: (fps: number) => void;
}) {
  const acc = useRef({ frames: 0, time: 0 });
  useFrame((_, delta) => {
    if (!active) return;
    acc.current.frames += 1;
    acc.current.time += delta;
    if (acc.current.time >= 0.5) {
      onSample(acc.current.frames / acc.current.time);
      acc.current.frames = 0;
      acc.current.time = 0;
    }
  });
  return null;
}

export default function LabCanvas({
  pointerRef,
  frozen,
  particleCount,
  onStats,
}: LabCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // 离屏/切后台时为 false，帧循环降级为 demand
  const [inFocus, setInFocus] = useState(true);
  const [dpr, setDpr] = useState(() =>
    typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2),
  );
  const dprRef = useRef(dpr);
  const lowStreak = useRef(0);

  // 可见性监测：IntersectionObserver（离屏）+ visibilitychange（切标签页）
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let visible = true;
    let pageVisible = !document.hidden;
    const update = () => setInFocus(visible && pageVisible);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    io.observe(el);
    const onVisibility = () => {
      pageVisible = !document.hidden;
      update();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // 帧率自适应：连续 3 次低帧采样降 dpr；恢复后缓慢回升（上限 2）
  const handleSample = useCallback(
    (fps: number) => {
      if (fps < 45) {
        lowStreak.current += 1;
        if (lowStreak.current >= 3 && dprRef.current > 1) {
          dprRef.current = Math.max(1, dprRef.current - 0.25);
          setDpr(dprRef.current);
          lowStreak.current = 0;
        }
      } else {
        lowStreak.current = 0;
        if (fps > 58 && dprRef.current < 2) {
          dprRef.current = Math.min(2, dprRef.current + 0.25);
          setDpr(dprRef.current);
        }
      }
      onStats?.(fps, dprRef.current);
    },
    [onStats],
  );

  const live = !frozen && inFocus;

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        dpr={dpr}
        frameloop={live ? 'always' : 'demand'}
        camera={{ position: [0, 0.9, 4.4], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#05070a']} />
        {/* 极淡雾效，让远处网格自然消隐 */}
        <fog attach="fog" args={['#05070a', 6, 14]} />

        <SceneRig pointerRef={pointerRef} frozen={frozen}>
          <MoebiusWireframe frozen={frozen} />
          <DataFlowParticles
            count={particleCount}
            frozen={frozen}
            pointerRef={pointerRef}
          />
        </SceneRig>

        {/* 地面参考网格：工程图纸式的坐标锚定 */}
        <Grid
          position={[0, -1.7, 0]}
          args={[12, 12]}
          cellSize={0.4}
          cellThickness={0.6}
          cellColor="#1a2430"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#223144"
          fadeDistance={11}
          fadeStrength={2}
          infiniteGrid
        />

        <FpsProbe active={live} onSample={handleSample} />
      </Canvas>
    </div>
  );
}
