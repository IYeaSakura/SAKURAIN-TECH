import { memo, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion, usePageVisibility } from '@/lib/performance';
import { usePerformance } from '@/contexts/PerformanceContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

// ==================== 粒子爆发效果 - 优化版 ====================
export const ParticleBurst = memo(({
  trigger,
  x,
  y,
  count = 20,
  colors = ['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)'],
}: {
  trigger: boolean;
  x: number;
  y: number;
  count?: number;
  colors?: string[];
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { getParticleCount, effectiveQuality } = usePerformance();
  
  // 根据性能级别限制粒子数量
  const particleCount = getParticleCount(Math.min(count, 25));

  useEffect(() => {
    if (trigger && !prefersReducedMotion && isVisible && effectiveQuality !== 'low') {
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const velocity = Math.random() * 5 + 2;
        return {
          id: Date.now() + i,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          size: Math.random() * 4 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          maxLife: 1,
        };
      });
      setParticles(newParticles);
    }
  }, [trigger, particleCount, colors, prefersReducedMotion, isVisible, effectiveQuality]);

  useEffect(() => {
    if (prefersReducedMotion || !isVisible || effectiveQuality === 'low') return;
    
    let lastTime = performance.now();
    // 根据性能级别调整目标帧率
    const targetFPS = effectiveQuality === 'medium' ? 24 : 30;
    const frameInterval = 1000 / targetFPS;
    
    const updateParticles = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);
        setParticles((prev) =>
          prev
            .map((p) => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.2,
              vx: p.vx * 0.98,
              life: p.life - 0.02,
            }))
            .filter((p) => p.life > 0)
        );
      }
      frameRef.current = requestAnimationFrame(updateParticles);
    };

    if (particles.length > 0) {
      frameRef.current = requestAnimationFrame(updateParticles);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [particles.length, prefersReducedMotion, isVisible, effectiveQuality]);

  if (particles.length === 0 || prefersReducedMotion || effectiveQuality === 'low') return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: effectiveQuality === 'high' 
              ? `0 0 ${particle.size * 2}px ${particle.color}`
              : 'none',
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            opacity: particle.life,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
});

// ==================== 浮动气泡 - 优化版 ====================
export const FloatingBubbles = memo(({
  count = 12,
  colors = ['var(--accent-primary)', 'var(--accent-secondary)'],
}: {
  count?: number;
  colors?: string[];
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { getParticleCount, effectiveQuality } = usePerformance();
  
  // 根据性能级别限制数量
  const bubbleCount = getParticleCount(Math.min(count, 15));
  
  const bubbles = useMemo(() => 
    Array.from({ length: bubbleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 20 + 10,
      duration: effectiveQuality === 'low' 
        ? Math.random() * 5 + 15 // 低性能：更慢的动画
        : Math.random() * 10 + 10,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    })),
    [bubbleCount, colors, effectiveQuality]
  );

  if (prefersReducedMotion || effectiveQuality === 'low') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bubbles.slice(0, 3).map((bubble) => (
          <div
            key={bubble.id}
            className="absolute rounded-full"
            style={{
              left: `${bubble.x}%`,
              width: bubble.size,
              height: bubble.size,
              background: `radial-gradient(circle at 30% 30%, ${bubble.color}60, ${bubble.color}20)`,
              opacity: 0.3,
              top: `${(bubble.id / bubbles.length) * 100}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            left: `${bubble.x}%`,
            width: bubble.size,
            height: bubble.size,
            background: `radial-gradient(circle at 30% 30%, ${bubble.color}60, ${bubble.color}20)`,
            boxShadow: effectiveQuality === 'high' 
              ? `0 0 20px ${bubble.color}30, inset 0 0 10px ${bubble.color}20`
              : 'none',
            willChange: 'transform, opacity',
          }}
          initial={{ y: '110vh', opacity: 0 }}
          animate={isVisible ? {
            y: '-10vh',
            opacity: [0, 0.6, 0.6, 0],
          } : {}}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
});

// ==================== 火花效果 - 优化版 ====================
export const SparkEffect = memo(({
  children,
  sparkCount = 3,
  color = 'var(--accent-primary)',
}: {
  children: React.ReactNode;
  sparkCount?: number;
  color?: string;
}) => {
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isHovered, setIsHovered] = useState(false);
  const sparkIdRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { effectiveQuality } = usePerformance();

  // 低性能模式禁用火花效果
  const actualSparkCount = effectiveQuality === 'low' ? 0 : effectiveQuality === 'medium' ? 2 : sparkCount;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered || prefersReducedMotion || effectiveQuality === 'low') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 降低生成频率
    const threshold = effectiveQuality === 'medium' ? 0.95 : 0.9;
    if (Math.random() > threshold) {
      sparkIdRef.current += 1;
      const id = sparkIdRef.current;
      setSparks((prev) => [...prev.slice(-actualSparkCount), { id, x, y }]);
      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, 600);
    }
  }, [isHovered, actualSparkCount, prefersReducedMotion, effectiveQuality]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      {!prefersReducedMotion && effectiveQuality !== 'low' && (
        <AnimatePresence>
          {sparks.map((spark) => (
            <motion.div
              key={spark.id}
              className="absolute pointer-events-none"
              style={{ left: spark.x, top: spark.y }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
                y: [0, -20],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div
                className="w-1 h-1 rounded-full"
                style={{
                  background: color,
                  boxShadow: effectiveQuality === 'high' 
                    ? `0 0 6px ${color}, 0 0 12px ${color}`
                    : `0 0 3px ${color}`,
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
});

// ==================== 拖尾效果 - 优化版 ====================
export const TrailEffect = memo(({
  children,
  length = 4,
  color = 'var(--accent-primary)',
}: {
  children: React.ReactNode;
  length?: number;
  color?: string;
}) => {
  const [positions, setPositions] = useState<Array<{ x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { effectiveQuality } = usePerformance();

  // 根据性能级别调整拖尾长度
  const actualLength = effectiveQuality === 'low' ? 0 : effectiveQuality === 'medium' ? 3 : length;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !isHovered.current || prefersReducedMotion || effectiveQuality === 'low') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setPositions((prev) => [...prev.slice(-actualLength), { x, y }]);
    });
  }, [actualLength, prefersReducedMotion, effectiveQuality]);

  useEffect(() => {
    if (prefersReducedMotion || effectiveQuality === 'low') return;
    
    const interval = setInterval(() => {
      setPositions((prev) => prev.slice(1));
    }, 60);
    
    return () => {
      clearInterval(interval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion, effectiveQuality]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; setPositions([]); }}
      onMouseMove={handleMouseMove}
    >
      {effectiveQuality !== 'low' && !prefersReducedMotion && positions.map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            width: (i + 1) * 2,
            height: (i + 1) * 2,
            background: color,
            opacity: (i + 1) / actualLength * 0.5,
            transform: 'translate(-50%, -50%)',
            boxShadow: effectiveQuality === 'high' ? `0 0 ${(i + 1) * 2}px ${color}` : 'none',
          }}
        />
      ))}
      {children}
    </div>
  );
});

// ==================== 冲击波效果 - 优化版 ====================
export const ShockwaveEffect = memo(({
  trigger,
  x = '50%',
  y = '50%',
  color = 'var(--accent-primary)',
}: {
  trigger: boolean;
  x?: string | number;
  y?: string | number;
  color?: string;
}) => {
  const [waves, setWaves] = useState<number[]>([]);
  const idRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    if (trigger && !prefersReducedMotion && effectiveQuality !== 'low') {
      idRef.current += 1;
      const id = idRef.current;
      setWaves((prev) => [...prev, id]);
      setTimeout(() => {
        setWaves((prev) => prev.filter((w) => w !== id));
      }, 1000);
    }
  }, [trigger, prefersReducedMotion, effectiveQuality]);

  if (prefersReducedMotion || effectiveQuality === 'low') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {waves.map((wave) => (
          <motion.div
            key={wave}
            className="absolute rounded-full border-2"
            style={{
              left: x,
              top: y,
              borderColor: color,
              transform: 'translate(-50%, -50%)',
              willChange: 'width, height, opacity',
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

// ==================== 星座连线效果 - 优化版 ====================
export const ConstellationEffect = memo(({
  count = 12,
  connectionDistance = 120,
  color = 'var(--accent-primary)',
}: {
  count?: number;
  connectionDistance?: number;
  color?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isVisible = usePageVisibility();
  const { getParticleCount, effectiveQuality, targetFrameRate } = usePerformance();
  
  // 根据性能级别限制点数
  const pointCount = getParticleCount(Math.min(count, 20));

  useEffect(() => {
    if (prefersReducedMotion || !isVisible || effectiveQuality === 'low') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = effectiveQuality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    
    const resizeHandler = () => {
      requestAnimationFrame(resize);
    };
    window.addEventListener('resize', resizeHandler);

    // 初始化点
    pointsRef.current = Array.from({ length: pointCount }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });

    let lastTime = performance.now();
    const frameInterval = 1000 / targetFrameRate;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= frameInterval && isVisible) {
        lastTime = currentTime - (deltaTime % frameInterval);
        
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        ctx.clearRect(0, 0, width, height);
        const points = pointsRef.current;

        // 更新位置
        points.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        });

        // 绘制连线 - 优化：限制连接数
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < points.length; i++) {
          // 连接到鼠标
          const dMouse = Math.hypot(points[i].x - mouseRef.current.x, points[i].y - mouseRef.current.y);
          if (dMouse < connectionDistance) {
            ctx.globalAlpha = (1 - dMouse / connectionDistance) * 0.4;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            ctx.stroke();
          }

          // 点之间连接 - 限制连接数
          let connections = 0;
          const maxConnections = effectiveQuality === 'high' ? 2 : 1;
          for (let j = i + 1; j < points.length && connections < maxConnections; j++) {
            const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
            if (d < connectionDistance) {
              ctx.globalAlpha = (1 - d / connectionDistance) * 0.25;
              ctx.beginPath();
              ctx.moveTo(points[i].x, points[i].y);
              ctx.lineTo(points[j].x, points[j].y);
              ctx.stroke();
              connections++;
            }
          }
        }

        // 绘制点
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = color;
        points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.globalAlpha = 1;
      }
      
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pointCount, connectionDistance, color, prefersReducedMotion, isVisible, effectiveQuality, targetFrameRate]);

  if (prefersReducedMotion || effectiveQuality === 'low') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
    />
  );
});

// Display names
ParticleBurst.displayName = 'ParticleBurst';
FloatingBubbles.displayName = 'FloatingBubbles';
SparkEffect.displayName = 'SparkEffect';
TrailEffect.displayName = 'TrailEffect';
ShockwaveEffect.displayName = 'ShockwaveEffect';
ConstellationEffect.displayName = 'ConstellationEffect';
