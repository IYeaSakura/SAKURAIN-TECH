import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion, usePageVisibility } from '@/lib/performance';
import { usePerformance } from '@/contexts/PerformanceContext';

// 环境光晕效果
export const AmbientGlow = memo(({ 
  position = 'center',
  color = 'var(--accent-primary)',
  size = 400,
  opacity = 0.15,
  className = ''
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  color?: string;
  size?: number;
  opacity?: number;
  className?: string;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { effectiveQuality } = usePerformance();

  // 水合一致性：SSR 时设备能力检测返回兜底值（medium 质量、非低性能、
  // 不减少动画），而客户端首次渲染会读到真实设备能力（可能为 low）。
  // 挂载前强制走与 SSR 一致的「非低质量」分支，挂载后再应用真实质量，
  // 保证首次客户端渲染与 SSR 输出完全一致，避免 Hydration failed。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const lowQuality = mounted && (prefersReducedMotion || effectiveQuality === 'low');

  const positionStyles = {
    'top-left': { top: '10%', left: '10%' },
    'top-right': { top: '10%', right: '10%' },
    'bottom-left': { bottom: '10%', left: '10%' },
    'bottom-right': { bottom: '10%', right: '10%' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  // 低性能模式降低模糊度和大小（挂载后才生效，见上）
  const actualSize = lowQuality ? size * 0.7 : size;
  const actualOpacity = lowQuality ? opacity * 0.7 : opacity;
  const blurAmount = lowQuality ? 60 : 80;

  if (lowQuality) {
    return (
      <div
        className={`absolute pointer-events-none ${className}`}
        style={{
          width: actualSize,
          height: actualSize,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: `blur(${blurAmount}px)`,
          opacity: actualOpacity,
          ...positionStyles[position],
        }}
      />
    );
  }

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: actualSize,
        height: actualSize,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blurAmount}px)`,
        opacity: actualOpacity,
        ...positionStyles[position],
      }}
      animate={isVisible ? {
        scale: [1, 1.1, 1],
        opacity: [actualOpacity, actualOpacity * 0.7, actualOpacity],
      } : {}}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// 浮动粒子效果（轻量级）
export const FloatingParticles = memo(({
  count = 15,
  color = 'var(--accent-primary)',
}: {
  count?: number;
  color?: string;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { getParticleCount, effectiveQuality } = usePerformance();
  
  // 根据性能级别限制数量
  const particleCount = getParticleCount(Math.min(count, 20));

  if (prefersReducedMotion || effectiveQuality === 'low') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: Math.min(particleCount, 3) }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              background: color,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.3 + 0.1,
          }}
          animate={isVisible ? {
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.1, 0.3, 0.1],
          } : {}}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// 扫描线效果
export const ScanLine = memo(() => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { effectiveQuality } = usePerformance();
  
  if (prefersReducedMotion || effectiveQuality === 'low') return null;
  
  return (
    <motion.div
      className="absolute inset-x-0 h-px pointer-events-none z-10"
      style={{
        background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
        boxShadow: effectiveQuality === 'high' 
          ? '0 0 10px var(--accent-primary), 0 0 20px var(--accent-primary)'
          : '0 0 5px var(--accent-primary)',
      }}
      initial={{ top: '0%', opacity: 0 }}
      animate={isVisible ? { 
        top: ['0%', '100%', '0%'],
        opacity: [0, 0.5, 0],
      } : {}}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
});

// 网格线动画
export const AnimatedGrid = memo(() => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { effectiveQuality } = usePerformance();
  
  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, color-mix(in srgb, var(--accent-primary) 3%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in srgb, var(--accent-primary) 3%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
    );
  }
  
  // 低性能模式使用静态网格
  if (effectiveQuality === 'low') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, color-mix(in srgb, var(--accent-primary) 2%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in srgb, var(--accent-primary) 2%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in srgb, var(--accent-primary) 3%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--accent-primary) 3%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
        animate={isVisible ? {
          backgroundPosition: ['0px 0px', '60px 60px'],
        } : {}}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
});

// 光标跟随光效
export const CursorGlow = memo(() => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { effectiveQuality } = usePerformance();
  
  if (prefersReducedMotion || effectiveQuality === 'low') return null;
  
  return (
    <motion.div
      className="fixed pointer-events-none z-50 mix-blend-screen"
      style={{
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ delay: 1 }}
    />
  );
});

AmbientGlow.displayName = 'AmbientGlow';
FloatingParticles.displayName = 'FloatingParticles';
ScanLine.displayName = 'ScanLine';
AnimatedGrid.displayName = 'AnimatedGrid';
CursorGlow.displayName = 'CursorGlow';
