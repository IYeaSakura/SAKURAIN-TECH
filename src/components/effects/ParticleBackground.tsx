import { useEffect, useRef, useCallback } from 'react';
import { useWindowSize } from '@/hooks';
import { usePerformance } from '@/contexts/PerformanceContext';
import { usePrefersReducedMotion } from '@/lib/performance';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);
  
  const { width, height } = useWindowSize();
  const { effectiveQuality, targetFrameRate, getParticleCount, canvasDPR } = usePerformance();
  const prefersReducedMotion = usePrefersReducedMotion();

  // 根据性能级别决定是否启用
  const isEnabled = effectiveQuality !== 'low' && !prefersReducedMotion;

  // Use passive event listener for mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Visibility check to pause animation when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no alpha
    if (!ctx) return;

    // Set canvas size with device pixel ratio consideration
    const dpr = canvasDPR;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Initialize particles - 根据性能级别调整数量
    const baseParticleCount = Math.floor(width / 40);
    const particleCount = getParticleCount(Math.min(baseParticleCount, 40));
    
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.3 + 0.1,
    }));

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const frameInterval = 1000 / targetFrameRate;

    const animate = (currentTime: number) => {
      // 帧率控制
      const deltaTime = currentTime - lastFrameTimeRef.current;
      
      if (deltaTime >= frameInterval && isVisibleRef.current) {
        lastFrameTimeRef.current = currentTime - (deltaTime % frameInterval);
        frameCountRef.current++;

        // Clear canvas with solid color for better performance
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        const particles = particlesRef.current;

        // Batch particle updates and rendering
        ctx.beginPath();
        for (let i = 0; i < particles.length; i++) {
          const particle = particles[i];

          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Bounce off edges
          if (particle.x < 0 || particle.x > width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > height) particle.vy *= -1;

          // Keep particles in bounds
          particle.x = Math.max(0, Math.min(width, particle.x));
          particle.y = Math.max(0, Math.min(height, particle.y));

          // Mouse interaction (only for every 10th particle, every 3rd frame)
          if (i % 10 === 0 && frameCountRef.current % 3 === 0) {
            const dx = mouseRef.current.x - particle.x;
            const dy = mouseRef.current.y - particle.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 22500) { // 150^2
              const dist = Math.sqrt(distSq);
              const force = (150 - dist) / 150 * 0.0005;
              particle.vx += dx * force;
              particle.vy += dy * force;
            }
          }

          // Draw particle
          ctx.moveTo(particle.x + particle.radius, particle.y);
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        }

        // Get accent color from CSS variable
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#6366f1';
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = effectiveQuality === 'medium' ? 0.3 : 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw connections (limited for performance)
        // 仅在高质量模式下显示连线
        if (effectiveQuality === 'high') {
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 0.5;

          for (let i = 0; i < particles.length; i += 3) {
            let connections = 0;
            for (let j = i + 1; j < particles.length && connections < 3; j += 3) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const distSq = dx * dx + dy * dy;

              if (distSq < 10000) { // 100^2
                const dist = Math.sqrt(distSq);
                ctx.globalAlpha = (1 - dist / 100) * 0.15;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
                connections++;
              }
            }
          }
          ctx.globalAlpha = 1;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [width, height, handleMouseMove, isEnabled, targetFrameRate, canvasDPR, effectiveQuality, getParticleCount]);

  // 如果禁用，不渲染 canvas
  if (!isEnabled) {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{ background: 'var(--bg-primary)' }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{
        background: 'var(--bg-primary)',
      }}
    />
  );
}
