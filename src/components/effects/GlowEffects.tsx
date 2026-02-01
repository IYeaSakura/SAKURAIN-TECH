import { memo } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion, usePageVisibility } from '@/lib/performance';

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
  
  const positionStyles = {
    'top-left': { top: '10%', left: '10%' },
    'top-right': { top: '10%', right: '10%' },
    'bottom-left': { bottom: '10%', left: '10%' },
    'bottom-right': { bottom: '10%', right: '10%' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  if (prefersReducedMotion) {
    return (
      <div
        className={`absolute pointer-events-none ${className}`}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          opacity,
          ...positionStyles[position],
        }}
      />
    );
  }

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(80px)',
        opacity,
        ...positionStyles[position],
      }}
      animate={isVisible ? {
        scale: [1, 1.1, 1],
        opacity: [opacity, opacity * 0.7, opacity],
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
  
  // 限制数量
  const particleCount = Math.min(count, 20);

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: Math.min(particleCount, 5) }).map((_, i) => (
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
  
  if (prefersReducedMotion) return null;
  
  return (
    <motion.div
      className="absolute inset-x-0 h-px pointer-events-none z-10"
      style={{
        background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
        boxShadow: '0 0 10px var(--accent-primary), 0 0 20px var(--accent-primary)',
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
  
  if (prefersReducedMotion) return null;
  
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
