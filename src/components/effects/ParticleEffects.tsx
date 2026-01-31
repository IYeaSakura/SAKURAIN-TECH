import { memo, useEffect, useState, useCallback, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

// ==================== 粒子爆发效果 ====================
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

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
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
  }, [trigger, count, colors]);

  useEffect(() => {
    const updateParticles = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2, // 重力
            vx: p.vx * 0.98, // 摩擦力
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
      );
      frameRef.current = requestAnimationFrame(updateParticles);
    };

    if (particles.length > 0) {
      frameRef.current = requestAnimationFrame(updateParticles);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [particles.length]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            x: particle.x,
            y: particle.y,
            opacity: particle.life,
          }}
        />
      ))}
    </div>
  );
});

// ==================== 浮动气泡 ====================
export const FloatingBubbles = memo(({
  count = 15,
  colors = ['var(--accent-primary)', 'var(--accent-secondary)'],
}: {
  count?: number;
  colors?: string[];
}) => {
  const [bubbles, setBubbles] = useState<Array<{
    id: number;
    x: number;
    size: number;
    duration: number;
    delay: number;
    color: string;
  }>>([]);

  useEffect(() => {
    const newBubbles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setBubbles(newBubbles);
  }, [count, colors]);

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
            boxShadow: `0 0 20px ${bubble.color}30, inset 0 0 10px ${bubble.color}20`,
          }}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{
            y: '-10vh',
            opacity: [0, 0.6, 0.6, 0],
            x: [0, Math.sin(bubble.id) * 30, 0],
          }}
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

// ==================== 火花效果 ====================
export const SparkEffect = memo(({
  children,
  sparkCount = 5,
  color = 'var(--accent-primary)',
}: {
  children: React.ReactNode;
  sparkCount?: number;
  color?: string;
}) => {
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (Math.random() > 0.8) {
      const id = parseInt(useId().replace(/[^0-9]/g, '')) + Date.now();
      setSparks((prev) => [...prev.slice(-sparkCount), { id, x, y }]);
      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, 600);
    }
  }, [isHovered, sparkCount]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
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
              x: [0, (Math.random() - 0.5) * 30],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div
              className="w-1 h-1 rounded-full"
              style={{
                background: color,
                boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

// ==================== 拖尾效果 ====================
export const TrailEffect = memo(({
  children,
  length = 5,
  color = 'var(--accent-primary)',
}: {
  children: React.ReactNode;
  length?: number;
  color?: string;
}) => {
  const [positions, setPositions] = useState<Array<{ x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !isHovered.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPositions((prev) => [...prev.slice(-length), { x, y }]);
  }, [length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => prev.slice(1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; setPositions([]); }}
      onMouseMove={handleMouseMove}
    >
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            width: (i + 1) * 2,
            height: (i + 1) * 2,
            background: color,
            opacity: (i + 1) / length * 0.5,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${(i + 1) * 2}px ${color}`,
          }}
        />
      ))}
      {children}
    </div>
  );
});

// ==================== 冲击波效果 ====================
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

  useEffect(() => {
    if (trigger) {
      const id = parseInt(useId().replace(/[^0-9]/g, '')) + Date.now();
      setWaves((prev) => [...prev, id]);
      setTimeout(() => {
        setWaves((prev) => prev.filter((w) => w !== id));
      }, 1000);
    }
  }, [trigger]);

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
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 500, height: 500, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

// ==================== 星座连线效果 ====================
export const ConstellationEffect = memo(({
  count = 15,
  connectionDistance = 150,
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 初始化点
    pointsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const points = pointsRef.current;

      // 更新位置
      points.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      // 绘制连线
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < points.length; i++) {
        // 连接到鼠标
        const dMouse = Math.hypot(points[i].x - mouseRef.current.x, points[i].y - mouseRef.current.y);
        if (dMouse < connectionDistance) {
          ctx.globalAlpha = (1 - dMouse / connectionDistance) * 0.5;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
        }

        // 点之间连接
        for (let j = i + 1; j < points.length; j++) {
          const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
          if (d < connectionDistance) {
            ctx.globalAlpha = (1 - d / connectionDistance) * 0.3;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      // 绘制点
      points.forEach((p) => {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count, connectionDistance, color]);

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
