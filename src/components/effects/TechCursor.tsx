'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export function TechCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const cursorRef = useRef({ x: 0, y: 0 });
  const ringRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);

    const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);

      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  useEffect(() => {
    const animateRing = () => {
      const lerp = (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
      };
      
      ringRef.current.x = lerp(ringRef.current.x, cursorRef.current.x, 0.1);
      ringRef.current.y = lerp(ringRef.current.y, cursorRef.current.y, 0.1);
      
      requestAnimationFrame(animateRing);
    };

    animateRing();
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        className="fixed pointer-events-none z-[99999] hidden md:block"
        style={{
          left: cursorRef.current.x,
          top: cursorRef.current.y,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <circle
            cx="8"
            cy="8"
            r="3"
            fill="var(--accent-primary)"
          />
        </svg>
      </motion.div>

      <motion.div
        className="fixed pointer-events-none z-[99998] hidden md:block"
        style={{
          left: ringRef.current.x,
          top: ringRef.current.y,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0.8 : 0.5,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke="var(--accent-secondary)"
            strokeWidth="2"
            opacity="0.6"
          />
        </svg>
      </motion.div>
    </>
  );
}
