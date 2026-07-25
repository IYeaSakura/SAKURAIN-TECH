'use client';

import { useEffect, useState } from 'react';
import { usePerformance } from '@/contexts/PerformanceContext';
import { useTranslation } from '@/hooks';

/**
 * Route-level loading placeholder with staggered animation to avoid jank.
 * Migrated from the legacy RouterTransition.tsx RouteLoader; the original
 * transition logic depended on react-router and is no longer applicable
 * after the Next.js migration.
 */
export function RouteLoader() {
  const { t } = useTranslation();
  const { effectiveQuality } = usePerformance();
  const [animationPhase, setAnimationPhase] = useState(0);
  const isLowQuality = effectiveQuality === 'low';

  // 错峰启动动画
  useEffect(() => {
    if (isLowQuality) return;

    const timers = [
      setTimeout(() => setAnimationPhase(1), 0),
      setTimeout(() => setAnimationPhase(2), 200),
      setTimeout(() => setAnimationPhase(3), 400),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isLowQuality]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 像素风格加载动画 - 使用 CSS 动画 */}
      <div className="relative">
        {/* 外层旋转 */}
        <div
          className="w-16 h-16 rounded-lg"
          style={{
            border: '4px solid var(--bg-tertiary)',
            borderTopColor: 'var(--accent-primary)',
            borderRightColor: 'var(--accent-secondary)',
            animation: animationPhase >= 1 && !isLowQuality
              ? 'spin 1s linear infinite'
              : 'none',
          }}
        />

        {/* 内层反向旋转 */}
        {!isLowQuality && (
          <div
            className="absolute inset-2 rounded"
            style={{
              border: '3px solid transparent',
              borderBottomColor: 'var(--accent-tertiary)',
              borderLeftColor: 'var(--accent-primary)',
              animation: animationPhase >= 1
                ? 'spin-reverse 1.5s linear infinite'
                : 'none',
            }}
          />
        )}
      </div>

      {/* 加载文字 - 错峰淡入 */}
      <div
        className="mt-6 text-center space-y-2 transition-opacity duration-300"
        style={{ opacity: animationPhase >= 2 ? 1 : 0.5 }}
      >
        <p
          className="font-pixel text-lg tracking-wider"
          style={{ color: 'var(--accent-primary)' }}
        >
          LOADING...
        </p>
        <p
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          {t.common.loadingPage}
        </p>
      </div>

      {/* 进度条 - CSS 动画 */}
      <div
        className="mt-8 w-48 h-1 rounded-full overflow-hidden transition-opacity duration-300"
        style={{
          background: 'var(--bg-tertiary)',
          opacity: animationPhase >= 2 ? 1 : 0.5,
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            animation: animationPhase >= 2
              ? 'progress 1s ease-in-out forwards'
              : 'none',
            width: animationPhase >= 2 ? '100%' : '0%',
          }}
        />
      </div>

      {/* 骨架屏预览 - 错峰显示 */}
      <div
        className="mt-12 w-full max-w-2xl space-y-4 transition-opacity duration-500"
        style={{ opacity: animationPhase >= 3 ? 1 : 0 }}
      >
        {/* 模拟标题 */}
        <div
          className="h-8 rounded w-2/3 mx-auto skeleton-pulse"
          style={{ background: 'var(--bg-card)' }}
        />
        {/* 模拟段落 */}
        <div className="space-y-2">
          <div
            className="h-4 rounded w-full skeleton-pulse"
            style={{ background: 'var(--bg-card)', animationDelay: '0.1s' }}
          />
          <div
            className="h-4 rounded w-5/6 mx-auto skeleton-pulse"
            style={{ background: 'var(--bg-card)', animationDelay: '0.2s' }}
          />
          <div
            className="h-4 rounded w-4/6 mx-auto skeleton-pulse"
            style={{ background: 'var(--bg-card)', animationDelay: '0.3s' }}
          />
        </div>
        {/* 模拟卡片 */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg skeleton-pulse"
              style={{
                background: 'var(--bg-card)',
                animationDelay: `${0.4 + i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS 动画定义 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 2s ease-in-out infinite;
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
