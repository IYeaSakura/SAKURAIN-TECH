'use client';

/**
 * /lab 展厅首件展品 —— EXHIBIT_001 莫比乌斯数据环。
 *
 * 页面层职责：mono 工程风 HUD 标注、指针归一化与转发、
 * 粒子规模分档、prefers-reduced-motion 静帧降级。
 * 3D 场景全部委托给 LabCanvas。
 */

import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import LabCanvas from './LabCanvas';
import {
  FLOW_LAMBDA,
  MOEBIUS,
  PARTICLE_COUNT_DESKTOP,
  PARTICLE_COUNT_MOBILE,
} from './moebius';

/** 展框四角的发丝括号（refact.cc 式装裱） */
function CornerBracket({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-3 w-3 border-white/25 ${className}`}
    />
  );
}

export default function LabPage() {
  // 全局静帧开关： prefers-reduced-motion 用户直接得到一帧静态构图
  const reduced = useReducedMotion() ?? false;

  // 指针坐标走 ref 通道：高频 pointermove 不触发 React 重渲染，
  // 3D 侧在 useFrame 中直接读取。
  const pointerRef = useRef({ x: 0, y: 0 });

  // HUD 读数（低频：指针 8Hz 节流、帧率 0.5s 采样）
  const [hudPointer, setHudPointer] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState<{ fps: number; dpr: number } | null>(null);
  const lastHudUpdate = useRef(0);

  // 移动端降低粒子规模（首帧判定，客户端组件无 SSR 水合问题）
  const [particleCount] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
      ? PARTICLE_COUNT_MOBILE
      : PARTICLE_COUNT_DESKTOP,
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerRef.current = { x, y };
      const now = performance.now();
      if (now - lastHudUpdate.current > 120) {
        lastHudUpdate.current = now;
        setHudPointer({ x, y });
      }
    },
    [],
  );

  const handleStats = useCallback((fps: number, dpr: number) => {
    setStats({ fps, dpr });
  }, []);

  const fmt = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
      {/* 分区头部：与 /projects 一致的版式语言 */}
      <header className="flex items-end justify-between border-b border-border/40 pb-4 mb-8">
        <div>
          <p className="font-mono uppercase tracking-widest text-muted-foreground text-xs">
            /lab
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
            实验室
          </h1>
        </div>
        <p className="font-mono uppercase tracking-widest text-muted-foreground text-xs">
          EXHIBITS: 01
        </p>
      </header>

      {/* 展框：始终为深色"暗室"，与站点主题解耦 */}
      <figure className="relative">
        <div
          className="relative h-[68vh] min-h-[420px] overflow-hidden border border-white/10 bg-[#05070a] select-none touch-pan-y"
          onPointerMove={handlePointerMove}
        >
          <LabCanvas
            pointerRef={pointerRef}
            frozen={reduced}
            particleCount={particleCount}
            onStats={handleStats}
          />

          {/* 装裱括号 */}
          <CornerBracket className="left-2 top-2 border-l border-t" />
          <CornerBracket className="right-2 top-2 border-r border-t" />
          <CornerBracket className="left-2 bottom-2 border-l border-b" />
          <CornerBracket className="right-2 bottom-2 border-r border-b" />

          {/* HUD：左上 —— 展品编号与状态 */}
          <div className="pointer-events-none absolute left-5 top-4 font-mono text-[10px] sm:text-xs leading-relaxed text-white/60">
            <p className="tracking-widest text-white/85">
              EXHIBIT_001 // MÖBIUS DATA RING
            </p>
            <p className="tracking-widest">
              STATUS:{' '}
              <span className="text-[#569CD6]">
                {reduced ? 'STATIC' : 'LIVE'}
              </span>
              {!reduced && (
                <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#569CD6] align-middle" />
              )}
            </p>
          </div>

          {/* HUD：右上 —— 图号 */}
          <p className="pointer-events-none absolute right-5 top-4 font-mono text-[10px] sm:text-xs tracking-widest text-white/40">
            FIG. 01
          </p>

          {/* HUD：左下 —— 工程参数 */}
          <div className="pointer-events-none absolute left-5 bottom-4 font-mono text-[10px] sm:text-xs leading-relaxed text-white/45">
            <p>GEOMETRY: MÖBIUS R={MOEBIUS.R.toFixed(2)} W={MOEBIUS.W.toFixed(2)}</p>
            <p>PARTICLES: {particleCount.toLocaleString()}</p>
            <p>
              FLOW: λ={FLOW_LAMBDA.toFixed(2)} rad/s
              {stats ? `  DPR: ${stats.dpr.toFixed(2)}` : ''}
            </p>
          </div>

          {/* HUD：右下 —— 实时读数 */}
          <div className="pointer-events-none absolute right-5 bottom-4 text-right font-mono text-[10px] sm:text-xs leading-relaxed text-white/45">
            <p>
              PTR X:{fmt(hudPointer.x)} Y:{fmt(hudPointer.y)}
            </p>
            <p>
              FPS:{' '}
              {reduced
                ? '--'
                : stats
                  ? String(Math.round(stats.fps)).padStart(2, '0')
                  : '--'}
            </p>
          </div>
        </div>

        {/* 图注 */}
        <figcaption className="mt-4 space-y-3">
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
            一条没有正反面的环。{particleCount.toLocaleString()} 个发光粒子沿单侧曲面循环流动，
            象征永不停歇的数据流。移动指针（或手指）可以扰动流速、改变视角。
          </p>
          <p className="font-mono text-[10px] sm:text-xs tracking-wider text-muted-foreground/70">
            THREE.JS / R3F · CUSTOM GLSL POINTS · ADDITIVE BLENDING · ADAPTIVE DPR
            · OFFSCREEN PAUSE · REDUCED-MOTION STATIC FRAME
          </p>
        </figcaption>
      </figure>
    </main>
  );
}
