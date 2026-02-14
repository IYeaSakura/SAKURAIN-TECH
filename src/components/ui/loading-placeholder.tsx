import { memo, useState, useEffect } from 'react';
import { usePerformance } from '@/contexts/PerformanceContext';

/**
 * 统一的首屏加载占位符 - 错峰动画避免卡顿
 * 优先使用 CSS 动画，减少 JS 计算负担
 */
export const LoadingPlaceholder = memo(() => {
  const { effectiveQuality } = usePerformance();
  const [animationPhase, setAnimationPhase] = useState(0);
  const isLowQuality = effectiveQuality === 'low';

  // 错峰启动动画，避免同时开始造成卡顿
  useEffect(() => {
    if (isLowQuality) return; // 低性能设备不使用复杂动画

    const timers = [
      setTimeout(() => setAnimationPhase(1), 100),   // 旋转动画
      setTimeout(() => setAnimationPhase(2), 300),   // 文字显示
      setTimeout(() => setAnimationPhase(3), 500),   // 进度条
      setTimeout(() => setAnimationPhase(4), 700),   // 骨架屏
    ];

    return () => timers.forEach(clearTimeout);
  }, [isLowQuality]);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 静态背景网格 - 无动画 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--accent-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.03,
        }}
      />

      {/* 主加载动画 - 使用 CSS 动画而非 framer-motion */}
      <div className="relative">
        {/* 外层旋转 - CSS 动画 */}
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
        
        {/* 内层反向旋转 - 低性能设备不显示 */}
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

      {/* 加载文字 - 淡入显示 */}
      <div 
        className="mt-6 text-center space-y-2 transition-opacity duration-300"
        style={{ opacity: animationPhase >= 2 ? 1 : 0 }}
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
          正在初始化系统
        </p>
      </div>

      {/* 进度条 - CSS 动画 */}
      <div 
        className="mt-8 w-48 h-1 rounded-full overflow-hidden transition-opacity duration-300"
        style={{ 
          background: 'var(--bg-tertiary)',
          opacity: animationPhase >= 3 ? 1 : 0,
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            animation: animationPhase >= 3
              ? 'progress 1.2s ease-in-out forwards'
              : 'none',
          }}
        />
      </div>

      {/* 骨架屏预览 - 错峰淡入 */}
      <div 
        className="mt-12 w-full max-w-md space-y-4 transition-opacity duration-500"
        style={{ opacity: animationPhase >= 4 ? 1 : 0 }}
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
        </div>
        {/* 模拟卡片 */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="h-20 rounded-lg skeleton-pulse"
              style={{ 
                background: 'var(--bg-card)',
                animationDelay: `${0.3 + i * 0.15}s`,
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
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';

/**
 * 简化版加载占位符 - 用于区域加载
 */
export const SectionLoadingPlaceholder = memo(() => (
  <div className="min-h-[300px] flex flex-col items-center justify-center">
    <div
      className="w-10 h-10 rounded-lg"
      style={{
        border: '3px solid var(--bg-tertiary)',
        borderTopColor: 'var(--accent-primary)',
        animation: 'spin 1s linear infinite',
      }}
    />
    <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
      加载中...
    </p>
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
));

SectionLoadingPlaceholder.displayName = 'SectionLoadingPlaceholder';
