import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// ==================== 磁性光标 ====================
export const MagneticCursor = memo(() => {
  const [isHovering, setIsHovering] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 300 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
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
  }, [mouseX, mouseY]);

  return (
    <>
      {/* 主光标 */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference hidden lg:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 60 : 20,
          height: isHovering ? 60 : 20,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <div className="w-full h-full rounded-full bg-white" />
      </motion.div>
      
      {/* 光标轨迹 */}
      <CursorTrail />
    </>
  );
});

// ==================== 光标轨迹 ====================
const CursorTrail = memo(() => {
  const [points, setPoints] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const pointIdRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      pointIdRef.current++;
      const newPoint = { x: e.clientX, y: e.clientY, id: pointIdRef.current };
      
      setPoints((prev) => {
        const newPoints = [...prev, newPoint];
        if (newPoints.length > 8) {
          return newPoints.slice(newPoints.length - 8);
        }
        return newPoints;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] hidden lg:block">
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
            opacity: (i + 1) / points.length * 0.4,
            boxShadow: `0 0 ${(i + 1) * 2}px var(--accent-primary)`,
          }}
          initial={{ scale: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={() => {
            setPoints((prev) => prev.filter((p) => p.id !== point.id));
          }}
        />
      ))}
    </div>
  );
});

// ==================== 聚光灯效果 ====================
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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

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
        }}
        animate={{ opacity: isVisible ? opacity : 0 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </div>
  );
});

// ==================== 鼠标跟随卡片 ====================
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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    setRotateX((-mouseY / (rect.height / 2)) * intensity);
    setRotateY((mouseX / (rect.width / 2)) * intensity);
    
    setGlarePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  }, []);

  return (
    <motion.div
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
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
        
        {/* 光泽效果 */}
        <div
          className="absolute inset-0 pointer-events-none rounded-inherit"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.15), transparent 50%)`,
            transform: 'translateZ(1px)',
          }}
        />
      </motion.div>
    </motion.div>
  );
});

// ==================== 磁性元素 ====================
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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    setPosition({
      x: distanceX * strength,
      y: distanceY * strength,
    });
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {children}
    </motion.div>
  );
});

// ==================== 鼠标视差容器 ====================
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      setOffset({
        x: (e.clientX - centerX) * intensity,
        y: (e.clientY - centerY) * intensity,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [intensity]);

  return (
    <motion.div
      className={className}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
    >
      {children}
    </motion.div>
  );
});

// ==================== 鼠标速度效果 ====================
export const VelocityCursor = memo(() => {
  const [velocity, setVelocity] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(Date.now());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = now - lastTime.current;
      
      if (dt > 16) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vel = dist / dt * 10;
        
        setVelocity(Math.min(vel, 10));
        setPosition({ x: e.clientX, y: e.clientY });
        
        lastPos.current = { x: e.clientX, y: e.clientY };
        lastTime.current = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed pointer-events-none z-[9997] hidden lg:block"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
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

// Display names
MagneticCursor.displayName = 'MagneticCursor';
CursorTrail.displayName = 'CursorTrail';
SpotlightCursor.displayName = 'SpotlightCursor';
MouseFollowCard.displayName = 'MouseFollowCard';
MagneticElement.displayName = 'MagneticElement';
ParallaxContainer.displayName = 'ParallaxContainer';
VelocityCursor.displayName = 'VelocityCursor';
