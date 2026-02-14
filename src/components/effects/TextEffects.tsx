import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { usePrefersReducedMotion, usePageVisibility } from '@/lib/performance';
import { usePerformance } from '@/contexts/PerformanceContext';

// ==================== 打字机效果 ====================
export const TypewriterText = memo(({
  text,
  speed = 50,
  delay = 0,
  className = '',
  onComplete,
  cursor = true,
  cursorColor = 'var(--accent-primary)',
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  cursor?: boolean;
  cursorColor?: string;
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    if (isInView && !started && isVisible) {
      setStarted(true);
      const timeout = setTimeout(() => {
        let index = 0;
        const interval = setInterval(() => {
          if (index < text.length) {
            setDisplayText(text.slice(0, index + 1));
            index++;
          } else {
            clearInterval(interval);
            setIsComplete(true);
            onComplete?.();
          }
        }, speed);

        return () => clearInterval(interval);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [isInView, started, text, speed, delay, onComplete, prefersReducedMotion, isVisible]);

  return (
    <span ref={containerRef} className={className}>
      {displayText}
      {cursor && !isComplete && !prefersReducedMotion && (
        <motion.span
          style={{ color: cursorColor }}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
});

// ==================== 故障文字效果 ====================
export const GlitchText = memo(({
  children,
  className = '',
  color = 'var(--accent-primary)',
  secondaryColor = 'var(--accent-secondary)',
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  secondaryColor?: string;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  if (prefersReducedMotion) {
    return <span className={className} style={{ color }}>{children}</span>;
  }
  
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      whileHover="hover"
    >
      <motion.span
        className="relative z-10"
        style={{ color }}
        variants={{
          hover: {
            x: [0, -2, 2, -1, 0],
            transition: { duration: 0.2 },
          },
        }}
      >
        {children}
      </motion.span>
      
      {/* 红色偏移 */}
      <motion.span
        className="absolute inset-0"
        style={{ color: secondaryColor, opacity: 0 }}
        variants={{
          hover: {
            opacity: [0, 0.8, 0, 0.8, 0],
            x: [0, 3, -3, 2, 0],
            transition: { duration: 0.2 },
          },
        }}
      >
        {children}
      </motion.span>
      
      {/* 蓝色偏移 */}
      <motion.span
        className="absolute inset-0"
        style={{ color, opacity: 0, filter: 'hue-rotate(180deg)' }}
        variants={{
          hover: {
            opacity: [0, 0.6, 0, 0.6, 0],
            x: [0, -3, 3, -2, 0],
            transition: { duration: 0.2, delay: 0.05 },
          },
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
});

// ==================== 波浪文字效果 ====================
export const WaveText = memo(({
  children,
  className = '',
  amplitude = 5,
  frequency = 0.1,
  speed = 2,
}: {
  children: string;
  className?: string;
  amplitude?: number;
  frequency?: number;
  speed?: number;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const characters = children.split('');

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`inline-flex ${className}`}>
      {characters.map((char, i) => (
        <motion.span
          key={i}
          animate={isVisible ? {
            y: [0, -amplitude, 0, amplitude, 0],
          } : {}}
          transition={{
            duration: speed,
            repeat: Infinity,
            delay: i * frequency,
            ease: 'easeInOut',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
});

// ==================== 翻转文字效果 ====================
export const FlipText = memo(({
  children,
  className = '',
  delay = 0,
}: {
  children: string;
  className?: string;
  delay?: number;
}) => {
  const characters = children.split('');
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });
  const prefersReducedMotion = usePrefersReducedMotion();

  const variants: Variants = {
    hidden: { rotateX: 90, opacity: 0 },
    visible: (i: number) => ({
      rotateX: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: delay + i * 0.05,
        ease: [0.215, 0.61, 0.355, 1],
      },
    }),
  };

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span ref={containerRef} className={`inline-flex perspective-500 ${className}`}>
      {characters.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          style={{ transformStyle: 'preserve-3d' }}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={variants}
          custom={i}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
});

// ==================== 渐变文字效果 ====================
export const GradientText = memo(({
  children,
  className = '',
  colors = ['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)'],
  animate = true,
  speed = 3,
}: {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animate?: boolean;
  speed?: number;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { effectiveQuality } = usePerformance();
  const gradient = `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`;

  // 低性能模式禁用动画
  if (prefersReducedMotion || !animate || effectiveQuality === 'low') {
    return (
      <span
        className={`bg-clip-text text-transparent ${className}`}
        style={{
          backgroundImage: gradient,
          backgroundSize: '200% 100%',
        }}
      >
        {children}
      </span>
    );
  }

  // 中等质量降低动画速度
  const actualSpeed = effectiveQuality === 'medium' ? speed * 1.5 : speed;

  return (
    <motion.span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: gradient,
        backgroundSize: '200% 100%',
      }}
      animate={isVisible ? {
        backgroundPosition: ['0% 50%', '200% 50%'],
      } : {}}
      transition={{
        duration: actualSpeed,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
});

// ==================== 描边文字效果 ====================
export const OutlineText = memo(({
  children,
  className = '',
  strokeColor = 'var(--accent-primary)',
  fillColor = 'transparent',
  strokeWidth = 1,
}: {
  children: React.ReactNode;
  className?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
}) => {
  return (
    <span
      className={className}
      style={{
        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
        WebkitTextFillColor: fillColor,
        color: fillColor,
      }}
    >
      {children}
    </span>
  );
});

// ==================== 聚光灯文字效果 ====================
export const SpotlightText = memo(({
  children,
  className = '',
  spotlightColor = 'var(--accent-primary)',
}: {
  children: string;
  className?: string;
  spotlightColor?: string;
}) => {
  const [mouseX, setMouseX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setMouseX(e.clientX - rect.left);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* 暗淡版本 */}
      <span className="text-[var(--text-muted)]">{children}</span>
      
      {/* 聚光灯版本 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle 100px at ${mouseX}px 50%, ${spotlightColor}, transparent)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
});

// ==================== 弹跳文字效果 ====================
export const BounceText = memo(({
  children,
  className = '',
  delay = 0,
}: {
  children: string;
  className?: string;
  delay?: number;
}) => {
  const characters = children.split('');
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });
  const prefersReducedMotion = usePrefersReducedMotion();

  const variants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
        delay: delay + i * 0.05,
      },
    }),
  };

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span ref={containerRef} className={`inline-flex ${className}`}>
      {characters.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={variants}
          custom={i}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
});

// ==================== 扫描文字效果 ====================
export const ScanText = memo(({
  children,
  className = '',
  color = 'var(--accent-primary)',
  scanColor = 'var(--accent-secondary)',
  speed = 2,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  scanColor?: string;
  speed?: number;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();

  if (prefersReducedMotion) {
    return <span style={{ color }}>{children}</span>;
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <span style={{ color }}>{children}</span>
      <motion.span
        className="absolute inset-0 overflow-hidden"
        style={{ color: scanColor }}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={isVisible ? { clipPath: ['inset(0 100% 0 0)', 'inset(0 0 0 0)', 'inset(0 0 0 100%)'] } : {}}
        transition={{
          duration: speed,
          repeat: Infinity,
          repeatDelay: speed,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.span>
    </span>
  );
});

// Display names
TypewriterText.displayName = 'TypewriterText';
GlitchText.displayName = 'GlitchText';
WaveText.displayName = 'WaveText';
FlipText.displayName = 'FlipText';
GradientText.displayName = 'GradientText';
OutlineText.displayName = 'OutlineText';
SpotlightText.displayName = 'SpotlightText';
BounceText.displayName = 'BounceText';
ScanText.displayName = 'ScanText';
