import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { memo } from 'react';

export const ScrollProgress = memo(function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  
  // Use simpler animation if user prefers reduced motion
  const scaleX = useSpring(scrollYProgress, {
    stiffness: shouldReduceMotion ? 300 : 100,
    damping: shouldReduceMotion ? 30 : 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left will-change-transform"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary))',
      }}
    />
  );
});
