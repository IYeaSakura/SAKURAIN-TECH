import { memo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== 光剑效果 ====================
export const LightBeam = memo(({
  position = 'top',
  color = 'var(--accent-primary)',
  intensity = 0.5,
  animate = true,
}: {
  position?: 'top' | 'bottom' | 'left' | 'right';
  color?: string;
  intensity?: number;
  animate?: boolean;
}) => {
  const isHorizontal = position === 'top' || position === 'bottom';
  
  const positionStyles = {
    top: { top: 0, left: 0, right: 0, height: '2px' },
    bottom: { bottom: 0, left: 0, right: 0, height: '2px' },
    left: { left: 0, top: 0, bottom: 0, width: '2px' },
    right: { right: 0, top: 0, bottom: 0, width: '2px' },
  };

  return (
    <div
      className="absolute pointer-events-none overflow-visible"
      style={positionStyles[position]}
    >
      {/* 核心光束 */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${isHorizontal ? '90deg' : '180deg'}, 
            transparent, 
            ${color}, 
            transparent
          )`,
          boxShadow: `
            0 0 10px ${color},
            0 0 20px ${color},
            0 0 40px ${color},
            0 0 80px ${color}
          `,
        }}
        animate={animate ? {
          opacity: [intensity * 0.5, intensity, intensity * 0.5],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* 扫描动画 */}
      <motion.div
        className="absolute"
        style={{
          ...(isHorizontal 
            ? { width: '30%', height: '100%' }
            : { height: '30%', width: '100%' }
          ),
          background: `linear-gradient(${isHorizontal ? '90deg' : '180deg'}, 
            transparent, 
            ${color}, 
            transparent
          )`,
          filter: 'blur(4px)',
        }}
        animate={animate ? {
          [isHorizontal ? 'left' : 'top']: ['0%', '70%', '0%'],
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
});

// ==================== 脉冲光环 ====================
export const PulseRing = memo(({
  color = 'var(--accent-primary)',
  size = 100,
  delay = 0,
  duration = 2,
}: {
  color?: string;
  size?: number;
  delay?: number;
  duration?: number;
}) => {
  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
            boxShadow: `0 0 20px ${color}, inset 0 0 20px ${color}`,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.5, 2],
            opacity: [0.8, 0.4, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay: delay + i * (duration / 3),
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
});

// ==================== 霓虹文字 ====================
export const NeonText = memo(({
  children,
  color = 'var(--accent-primary)',
  flicker = true,
  className = '',
}: {
  children: React.ReactNode;
  color?: string;
  flicker?: boolean;
  className?: string;
}) => {
  return (
    <motion.span
      className={`relative ${className}`}
      style={{
        color,
        textShadow: `
          0 0 5px ${color},
          0 0 10px ${color},
          0 0 20px ${color},
          0 0 40px ${color},
          0 0 80px ${color}
        `,
      }}
      animate={flicker ? {
        opacity: [1, 0.9, 1, 0.95, 1],
        textShadow: [
          `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`,
          `0 0 5px ${color}, 0 0 10px ${color}, 0 0 15px ${color}`,
          `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`,
          `0 0 5px ${color}, 0 0 10px ${color}, 0 0 18px ${color}`,
          `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`,
        ],
      } : {}}
      transition={{
        duration: 0.2,
        repeat: Infinity,
        repeatDelay: Math.random() * 3 + 2,
      }}
    >
      {children}
    </motion.span>
  );
});

// ==================== 点击波纹效果 ====================
interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const RippleEffect = memo(({
  children,
  color = 'var(--accent-primary)',
}: {
  children: React.ReactNode;
  color?: string;
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  return (
    <div className="relative overflow-hidden" onClick={handleClick}>
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              background: `radial-gradient(circle, ${color}40, transparent)`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

// ==================== 发光边框 ====================
export const GlowingBorder = memo(({
  children,
  color = 'var(--accent-primary)',
  intensity = 1,
  animate = true,
  className = '',
}: {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  animate?: boolean;
  className?: string;
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* 外发光 */}
      <motion.div
        className="absolute -inset-[1px] rounded-lg pointer-events-none"
        style={{
          background: `linear-gradient(45deg, ${color}, transparent, ${color})`,
          opacity: intensity * 0.5,
        }}
        animate={animate ? {
          opacity: [intensity * 0.3, intensity * 0.6, intensity * 0.3],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* 旋转渐变 */}
      <motion.div
        className="absolute -inset-[2px] rounded-lg pointer-events-none overflow-hidden"
        style={{ opacity: intensity * 0.3 }}
      >
        <motion.div
          className="absolute inset-[-50%]"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${color}, transparent, ${color}, transparent)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      
      {/* 内容 */}
      <div className="relative z-10 bg-[var(--bg-card)] rounded-lg">
        {children}
      </div>
    </div>
  );
});

// ==================== 闪烁星星 ====================
export const TwinklingStars = memo(({
  count = 20,
  color = 'var(--accent-primary)',
}: {
  count?: number;
  color?: string;
}) => {
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    const newStars = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    }));
    setStars(newStars);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: color,
            boxShadow: `0 0 ${star.size * 2}px ${color}, 0 0 ${star.size * 4}px ${color}`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// ==================== 流动渐变背景 ====================
export const FlowingGradient = memo(({
  colors = ['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)'],
  speed = 10,
  opacity = 0.15,
}: {
  colors?: string[];
  speed?: number;
  opacity?: number;
}) => {
  const gradientString = `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: gradientString,
          backgroundSize: '200% 100%',
          opacity,
          filter: 'blur(60px)',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '200% 50%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
});

// ==================== 能量球效果 ====================
export const EnergyOrb = memo(({
  size = 200,
  color = 'var(--accent-primary)',
  secondaryColor = 'var(--accent-secondary)',
}: {
  size?: number;
  color?: string;
  secondaryColor?: string;
}) => {
  return (
    <div
      className="relative pointer-events-none"
      style={{ width: size, height: size }}
    >
      {/* 核心 */}
      <motion.div
        className="absolute inset-[20%] rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, ${secondaryColor})`,
          boxShadow: `
            0 0 30px ${color},
            0 0 60px ${color},
            0 0 90px ${secondaryColor},
            inset 0 0 30px rgba(255,255,255,0.3)
          `,
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* 内环 */}
      <motion.div
        className="absolute inset-[10%] rounded-full border-2"
        style={{
          borderColor: color,
          boxShadow: `0 0 20px ${color}, inset 0 0 20px ${color}`,
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.05, 1],
        }}
        transition={{
          rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
      
      {/* 外环 */}
      <motion.div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: secondaryColor,
          opacity: 0.5,
        }}
        animate={{
          rotate: -360,
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* 粒子 */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 10px ${color}`,
            left: '50%',
            top: '50%',
          }}
          animate={{
            x: [0, Math.cos(i * 60 * Math.PI / 180) * size * 0.4, 0],
            y: [0, Math.sin(i * 60 * Math.PI / 180) * size * 0.4, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// ==================== 全息投影效果 ====================
export const HologramEffect = memo(({
  children,
  color = 'var(--accent-primary)',
}: {
  children: React.ReactNode;
  color?: string;
}) => {
  return (
    <div className="relative">
      {/* 扫描线 */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `linear-gradient(transparent 50%, ${color}10 50%)`,
          backgroundSize: '100% 4px',
        }}
      />
      
      {/* 扫描动画 */}
      <motion.div
        className="absolute inset-x-0 h-8 pointer-events-none z-20"
        style={{
          background: `linear-gradient(to bottom, transparent, ${color}30, transparent)`,
        }}
        animate={{
          top: ['0%', '100%', '0%'],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* 故障效果 */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: color,
          mixBlendMode: 'overlay',
        }}
        animate={{
          opacity: [0, 0.1, 0, 0.05, 0],
          x: [0, -2, 2, 0],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatDelay: Math.random() * 5 + 3,
        }}
      />
      
      {children}
    </div>
  );
});

// Display names
LightBeam.displayName = 'LightBeam';
PulseRing.displayName = 'PulseRing';
NeonText.displayName = 'NeonText';
RippleEffect.displayName = 'RippleEffect';
GlowingBorder.displayName = 'GlowingBorder';
TwinklingStars.displayName = 'TwinklingStars';
FlowingGradient.displayName = 'FlowingGradient';
EnergyOrb.displayName = 'EnergyOrb';
HologramEffect.displayName = 'HologramEffect';
