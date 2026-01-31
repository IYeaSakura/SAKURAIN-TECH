import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

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
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;
  const isHorizontal = position === 'top' || position === 'bottom';
  
  const positionStyles = useMemo(() => ({
    top: { top: 0, left: 0, right: 0, height: '2px' },
    bottom: { bottom: 0, left: 0, right: 0, height: '2px' },
    left: { left: 0, top: 0, bottom: 0, width: '2px' },
    right: { right: 0, top: 0, bottom: 0, width: '2px' },
  }), []);

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
          opacity: intensity,
        }}
        animate={shouldAnimate ? {
          opacity: [intensity * 0.5, intensity, intensity * 0.5],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* 扫描动画 - 只在需要时渲染 */}
      {shouldAnimate && (
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
          animate={{
            [isHorizontal ? 'left' : 'top']: ['0%', '70%', '0%'],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
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
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
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
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: color,
            opacity: 0.3,
          }}
        />
      </div>
    );
  }
  
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
            willChange: 'transform, opacity',
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
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion || !flicker) {
    return (
      <span
        className={`relative ${className}`}
        style={{
          color,
          textShadow: `
            0 0 5px ${color},
            0 0 10px ${color},
            0 0 20px ${color},
            0 0 40px ${color}
          `,
        }}
      >
        {children}
      </span>
    );
  }
  
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
      animate={{
        opacity: [1, 0.9, 1, 0.95, 1],
      }}
      transition={{
        duration: 0.2,
        repeat: Infinity,
        repeatDelay: 3,
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
  const prefersReducedMotion = useReducedMotion();

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, [prefersReducedMotion]);

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
              willChange: 'width, height, opacity',
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
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  return (
    <div className={`relative ${className}`}>
      {/* 外发光 - 使用 CSS transition 替代 motion */}
      <div
        className="absolute -inset-[1px] rounded-lg pointer-events-none transition-opacity duration-1000"
        style={{
          background: `linear-gradient(45deg, ${color}, transparent, ${color})`,
          opacity: intensity * 0.5,
        }}
      />
      
      {/* 旋转渐变 - 只在需要时渲染 */}
      {shouldAnimate && (
        <motion.div
          className="absolute -inset-[2px] rounded-lg pointer-events-none overflow-hidden"
          style={{ opacity: intensity * 0.3 }}
        >
          <motion.div
            className="absolute inset-[-50%]"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${color}, transparent, ${color}, transparent)`,
              willChange: 'transform',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
      
      {/* 内容 */}
      <div className="relative z-10 bg-[var(--bg-card)] rounded-lg">
        {children}
      </div>
    </div>
  );
});

// ==================== 闪烁星星 - 美化增强版 ====================
interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  type: 'small' | 'medium' | 'large' | 'sparkle';
  color: string;
}

export const TwinklingStars = memo(({
  count = 30,
  color = 'var(--accent-primary)',
  secondaryColor = 'var(--accent-secondary)',
  shootingStars = true,
}: {
  count?: number;
  color?: string;
  secondaryColor?: string;
  shootingStars?: boolean;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [shootingStar, setShootingStar] = useState<{ x: number; y: number; id: number } | null>(null);
  
  // 限制最大数量
  const starCount = Math.min(count, 50);
  
  // 生成多样化的星星
  const stars = useMemo(() => 
    Array.from({ length: starCount }, (_, i) => {
      const rand = Math.random();
      let type: Star['type'] = 'small';
      let size = 1;
      
      if (rand > 0.9) {
        type = 'sparkle';
        size = Math.random() * 3 + 2;
      } else if (rand > 0.7) {
        type = 'large';
        size = Math.random() * 2 + 2;
      } else if (rand > 0.4) {
        type = 'medium';
        size = Math.random() * 1.5 + 1.5;
      } else {
        type = 'small';
        size = Math.random() * 1 + 0.5;
      }
      
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
        type,
        color: Math.random() > 0.7 ? secondaryColor : color,
      };
    }),
    [starCount, color, secondaryColor]
  );

  // 流星效果
  useEffect(() => {
    if (!shootingStars || prefersReducedMotion) return;
    
    const createShootingStar = () => {
      const id = Date.now();
      setShootingStar({
        x: Math.random() * 80 + 10,
        y: Math.random() * 30,
        id,
      });
      
      setTimeout(() => {
        setShootingStar((current) => (current?.id === id ? null : current));
      }, 1500);
    };
    
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        createShootingStar();
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [shootingStars, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              background: star.color,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 普通星星 */}
      {stars.map((star) => {
        const isSparkle = star.type === 'sparkle';
        const isLarge = star.type === 'large';
        
        return (
          <motion.div
            key={star.id}
            className="absolute"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: isSparkle ? [0.3, 1, 0.2, 0.8, 0.3] : [0.2, 0.9, 0.2],
              scale: isSparkle ? [1, 1.5, 1, 1.3, 1] : [1, 1.3, 1],
              rotate: isSparkle ? [0, 180, 360] : 0,
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          >
            {/* 星星核心 */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: star.color,
                boxShadow: `
                  0 0 ${star.size * 2}px ${star.color},
                  0 0 ${star.size * 4}px ${star.color},
                  0 0 ${star.size * 6}px ${star.color}80
                `,
              }}
            />
            {/* 十字光芒 - 大星星才有 */}
            {(isLarge || isSparkle) && (
              <>
                <div
                  className="absolute rounded-full"
                  style={{
                    width: star.size * 8,
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${star.color}, transparent)`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.6,
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 1,
                    height: star.size * 8,
                    background: `linear-gradient(0deg, transparent, ${star.color}, transparent)`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.6,
                  }}
                />
              </>
            )}
            {/* 闪烁光晕 */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: star.size * 3,
                height: star.size * 3,
                background: `radial-gradient(circle, ${star.color}40, transparent)`,
                left: '50%',
                top: '50%',
                marginLeft: -star.size * 1.5,
                marginTop: -star.size * 1.5,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: star.duration * 0.8,
                repeat: Infinity,
                delay: star.delay,
              }}
            />
          </motion.div>
        );
      })}
      
      {/* 流星效果 */}
      {shootingStar && (
        <motion.div
          key={shootingStar.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${shootingStar.x}%`,
            top: `${shootingStar.y}%`,
            background: color,
            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: [0, -200],
            y: [0, 150],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
          }}
        >
          {/* 流星尾巴 */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 100,
              height: 2,
              background: `linear-gradient(90deg, ${color}, transparent)`,
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
          />
        </motion.div>
      )}
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
  const prefersReducedMotion = useReducedMotion();
  const gradientString = useMemo(() => 
    `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`,
    [colors]
  );
  
  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: gradientString,
            backgroundSize: '200% 100%',
            opacity,
            filter: 'blur(60px)',
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: gradientString,
          backgroundSize: '200% 100%',
          opacity,
          filter: 'blur(60px)',
          willChange: 'background-position',
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

// ==================== 能量球效果 - 简化版 ====================
export const EnergyOrb = memo(({
  size = 200,
  color = 'var(--accent-primary)',
  secondaryColor = 'var(--accent-secondary)',
}: {
  size?: number;
  color?: string;
  secondaryColor?: string;
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return (
      <div
        className="relative pointer-events-none"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-[20%] rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}, ${secondaryColor})`,
          }}
        />
      </div>
    );
  }

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
          willChange: 'transform',
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
          willChange: 'transform',
        }}
        animate={{
          rotate: -360,
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
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
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="relative">
      {/* 扫描线 */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `linear-gradient(transparent 50%, ${color}10 50%)`,
          backgroundSize: '100% 4px',
        }}
      />
      
      {/* 扫描动画 - 只在需要时渲染 */}
      {!prefersReducedMotion && (
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
      )}
      
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
