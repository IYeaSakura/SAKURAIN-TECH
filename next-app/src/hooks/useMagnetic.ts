import { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';

interface MagneticOptions {
  strength?: number;
  ease?: number;
  radius?: number;
}

export function useMagnetic<T extends HTMLElement>(options: MagneticOptions = {}) {
  const { strength = 0.3, ease = 0.1, radius = 100 } = options;
  const elementRef = useRef<T>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < radius) {
        const factor = 1 - distance / radius;
        positionRef.current = {
          x: distanceX * strength * factor,
          y: distanceY * strength * factor,
        };
      } else {
        positionRef.current = { x: 0, y: 0 };
      }

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          gsap.to(element, {
            x: positionRef.current.x,
            y: positionRef.current.y,
            duration: ease,
            ease: 'power2.out',
          });
          rafIdRef.current = null;
        });
      }
    },
    [strength, ease, radius]
  );

  const handleMouseLeave = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    positionRef.current = { x: 0, y: 0 };
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
    });
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const parent = element.parentElement || document;
    parent.addEventListener('mousemove', handleMouseMove as EventListener);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove as EventListener);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleMouseMove, handleMouseLeave]);

  return elementRef;
}
