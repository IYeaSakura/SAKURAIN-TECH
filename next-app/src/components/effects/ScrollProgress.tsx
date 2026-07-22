import { useEffect, useState, useRef, memo } from 'react';
import { usePrefersReducedMotion } from '@/lib/performance';
import { usePerformance } from '@/contexts/PerformanceContext';

export const ScrollProgress = memo(function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { effectiveQuality, targetFrameRate } = usePerformance();
  const rafRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    // 低性能模式禁用或简化
    if (effectiveQuality === 'low') return;

    const frameInterval = 1000 / (prefersReducedMotion ? 30 : targetFrameRate);

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      
      // 仅在进度变化时更新状态
      if (Math.abs(scrollProgress - lastScrollRef.current) > 0.001) {
        lastScrollRef.current = scrollProgress;
        setProgress(scrollProgress);
      }
    };

    const handleScroll = () => {
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame((currentTime) => {
        const deltaTime = currentTime - lastFrameTimeRef.current;
        
        if (deltaTime >= frameInterval) {
          lastFrameTimeRef.current = currentTime - (deltaTime % frameInterval);
          updateProgress();
        }
        
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion, effectiveQuality, targetFrameRate]);

  // 低性能模式使用 CSS transition 替代 transform
  if (effectiveQuality === 'low') {
    return (
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
        style={{
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
          transition: 'width 0.1s linear',
        }}
      />
    );
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left will-change-transform"
      style={{
        transform: `scaleX(${progress})`,
        background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary))',
        transition: prefersReducedMotion ? 'none' : 'transform 0.05s linear',
      }}
    />
  );
});
