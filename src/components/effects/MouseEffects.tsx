import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { usePrefersReducedMotion, usePageVisibility } from '@/lib/performance';
import { usePerformance } from '@/contexts/PerformanceContext';

// ==================== 磁性光标 - 优化版 ====================
export const MagneticCursor = memo(() => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { enableMouseEffects, effectiveQuality } = usePerformance();
  const [isHovering, setIsHovering] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // 根据性能级别调整弹簧配置
  const springConfig = effectiveQuality === 'low' 
    ? { damping: 30, stiffness: 200 } // 低性能：更硬的弹簧，减少计算
    : { damping: 25, stiffness: 300 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (prefersReducedMotion || !isVisible || !enableMouseEffects) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], .magnetic')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [mouseX, mouseY, prefersReducedMotion, isVisible, enableMouseEffects]);

  // 低性能模式下完全不渲染
  if (prefersReducedMotion || !enableMouseEffects) return null;

  return (
    <>
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[100000] mix-blend-difference hidden lg:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          willChange: 'transform',
        }}
        animate={{
          width: isHovering ? 60 : 20,
          height: isHovering ? 60 : 20,
        }}
        transition={{ type: 'spring', stiffness: effectiveQuality === 'low' ? 300 : 400, damping: 28 }}
      >
        <div className="w-full h-full rounded-full bg-white" />
      </motion.div>
      
      {/* 拖尾效果只在高性能模式下显示 */}
      {effectiveQuality === 'high' && <CursorTrail />}
    </>
  );
});

const CursorTrail = memo(() => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const [points, setPoints] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const pointIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || !isVisible) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      pendingPointRef.current = { x: e.clientX, y: e.clientY };
    };

    const updatePoints = () => {
      if (pendingPointRef.current) {
        pointIdRef.current++;
        const newPoint = { ...pendingPointRef.current, id: pointIdRef.current };
        pendingPointRef.current = null;
        
        setPoints((prev) => {
          const newPoints = [...prev, newPoint];
          // 减少拖尾长度以提升性能
          if (newPoints.length > 4) {
            return newPoints.slice(newPoints.length - 4);
          }
          return newPoints;
        });
      }
      rafRef.current = requestAnimationFrame(updatePoints);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(updatePoints);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion, isVisible]);

  if (prefersReducedMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] hidden lg:block">
      {points.map((point, i) => (
        <motion.div
          key={point.id}
          className="absolute rounded-full"
          style={{
            left: point.x,
            top: point.y,
            width: (i + 1) * 3,
            height: (i + 1) * 3,
            background: 'var(--accent-primary)',
            transform: 'translate(-50%, -50%)',
            opacity: (i + 1) / points.length * 0.3, // 降低透明度
            boxShadow: `0 0 ${(i + 1)}px var(--accent-primary)`, // 减少发光
            willChange: 'opacity, transform',
          }}
          initial={{ scale: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.4 }} // 缩短动画时间
        />
      ))}
    </div>
  );
});

// ==================== 聚光灯光标 - 优化版 ====================
export const SpotlightCursor = memo(({
  children,
  size = 300,
  opacity = 0.15,
}: {
  children: React.ReactNode;
  size?: number;
  opacity?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { enableMouseEffects } = usePerformance();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || prefersReducedMotion || !enableMouseEffects) return;
    const rect = containerRef.current.getBoundingClientRect();
    pendingPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingPosRef.current) {
          setPosition(pendingPosRef.current);
          pendingPosRef.current = null;
        }
        rafRef.current = null;
      });
    }
  }, [prefersReducedMotion, enableMouseEffects]);

  if (prefersReducedMotion || !enableMouseEffects) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: size,
          height: size,
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)`,
          filter: 'blur(40px)',
          willChange: 'opacity',
        }}
        animate={{ opacity: isVisible ? opacity : 0 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </div>
  );
});

// ==================== 鼠标跟随卡片 - 优化版 ====================
export const MouseFollowCard = memo(({
  children,
  className = '',
  intensity = 20,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const { enableMouseEffects, effectiveQuality } = usePerformance();

  // 低性能模式降低强度
  const actualIntensity = effectiveQuality === 'low' ? intensity * 0.5 : intensity;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current || prefersReducedMotion || !enableMouseEffects) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    setRotateX((-mouseY / (rect.height / 2)) * actualIntensity);
    setRotateY((mouseX / (rect.width / 2)) * actualIntensity);
    
    setGlarePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, [actualIntensity, prefersReducedMotion, enableMouseEffects]);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  }, []);

  if (prefersReducedMotion || !enableMouseEffects) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
        
        {effectiveQuality !== 'low' && (
          <div
            className="absolute inset-0 pointer-events-none rounded-inherit"
            style={{
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.15), transparent 50%)`,
              transform: 'translateZ(1px)',
            }}
          />
        )}
      </motion.div>
    </div>
  );
});

// ==================== 磁性元素 - 优化版 ====================
export const MagneticElement = memo(({
  children,
  className = '',
  strength = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const { enableMouseEffects } = usePerformance();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current || prefersReducedMotion || !enableMouseEffects) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    setPosition({
      x: distanceX * strength,
      y: distanceY * strength,
    });
  }, [strength, prefersReducedMotion, enableMouseEffects]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  if (prefersReducedMotion || !enableMouseEffects) {
    return <div className={`inline-block ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
});

// ==================== 视差容器 - 优化版 ====================
export const ParallaxContainer = memo(({
  children,
  className = '',
  intensity = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { enableMouseEffects, effectiveQuality } = usePerformance();

  // 低性能模式降低强度
  const actualIntensity = effectiveQuality === 'low' ? intensity * 0.3 : intensity;

  useEffect(() => {
    if (prefersReducedMotion || !isVisible || !enableMouseEffects) return;
    
    let pendingOffset = { x: 0, y: 0 };
    
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      pendingOffset = {
        x: (e.clientX - centerX) * actualIntensity,
        y: (e.clientY - centerY) * actualIntensity,
      };
      
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setOffset(pendingOffset);
          rafRef.current = null;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [actualIntensity, prefersReducedMotion, isVisible, enableMouseEffects]);

  if (prefersReducedMotion || !enableMouseEffects) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
});

// ==================== 速度光标 - 简化版 (低性能设备禁用) ====================
export const VelocityCursor = memo(() => {
  const [velocity, setVelocity] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { enableMouseEffects, effectiveQuality } = usePerformance();

  useEffect(() => {
    // 仅在高质量模式下启用
    if (prefersReducedMotion || !isVisible || !enableMouseEffects || effectiveQuality !== 'high') return;
    
    let pendingPos = { x: 0, y: 0 };
    
    const handleMouseMove = (e: MouseEvent) => {
      pendingPos = { x: e.clientX, y: e.clientY };
      
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          const now = Date.now();
          const dt = now - lastTime.current;
          
          if (dt > 16) {
            const dx = pendingPos.x - lastPos.current.x;
            const dy = pendingPos.y - lastPos.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const vel = dist / dt * 10;
            
            setVelocity(Math.min(vel, 10));
            setPosition(pendingPos);
            
            lastPos.current = pendingPos;
            lastTime.current = now;
          }
          rafRef.current = null;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion, isVisible, enableMouseEffects, effectiveQuality]);

  if (prefersReducedMotion || !enableMouseEffects || effectiveQuality !== 'high') return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-[99998] hidden lg:block"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        willChange: 'transform, opacity',
      }}
      animate={{
        scale: 1 + velocity * 0.2,
        opacity: velocity > 1 ? 0.5 : 0,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    >
      <div
        className="rounded-full bg-[var(--accent-primary)]"
        style={{
          width: 40,
          height: 40,
          filter: 'blur(10px)',
        }}
      />
    </motion.div>
  );
});

MagneticCursor.displayName = 'MagneticCursor';
CursorTrail.displayName = 'CursorTrail';
SpotlightCursor.displayName = 'SpotlightCursor';
MouseFollowCard.displayName = 'MouseFollowCard';
MagneticElement.displayName = 'MagneticElement';
ParallaxContainer.displayName = 'ParallaxContainer';
VelocityCursor.displayName = 'VelocityCursor';
