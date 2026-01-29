'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function TechCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
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

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        className="fixed pointer-events-none z-50 hidden md:block"
        style={{
          left: position.x,
          top: position.y,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <defs>
            <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.8" />
            </linearGradient>
            <filter id="cursorGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx="20"
            cy="20"
            r="8"
            fill="none"
            stroke="url(#cursorGradient)"
            strokeWidth="2"
            filter="url(#cursorGlow)"
          />

          <motion.circle
            cx="20"
            cy="20"
            r="4"
            fill="var(--accent-primary)"
            animate={{
              r: isHovering ? 6 : 4,
              opacity: isHovering ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
          />

          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '20px 20px' }}
          >
            {[0, 90, 180, 270].map((angle, idx) => (
              <line
                key={idx}
                x1="20"
                y1="20"
                x2={20 + 12 * Math.cos((angle * Math.PI) / 180)}
                y2={20 + 12 * Math.sin((angle * Math.PI) / 180)}
                stroke="var(--accent-primary)"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}
          </motion.g>
        </svg>
      </motion.div>

      <motion.div
        className="fixed pointer-events-none z-50 hidden md:block"
        style={{
          left: position.x,
          top: position.y,
        }}
        animate={{
          scale: isHovering ? 2 : 1,
          opacity: isHovering ? 0.3 : 0.1,
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="w-8 h-8 rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent-primary), transparent)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </motion.div>
    </>
  );
}
