import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowPathProps {
  className?: string;
  pathD: string;
}

export function GlowPath({ className, pathD }: GlowPathProps) {
  const pathRef = useRef<SVGPathElement>(null);
  
  const { scrollYProgress } = useScroll();

  const pathLength = useTransform(scrollYProgress, [0, 0.8], [0, 1]);

  return (
    <svg
      className={cn('absolute inset-0 w-full h-full', className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
    >
      {/* Background path */}
      <path
        d={pathD}
        className="stroke-[rgba(0,0,0,0.08)]"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      />
      {/* Animated glow path */}
      <motion.path
        ref={pathRef}
        d={pathD}
        className="stroke-[#2563eb]"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        style={{
          pathLength,
          filter: 'drop-shadow(0 0 4px rgba(37, 99, 235, 0.5))',
        }}
      />
    </svg>
  );
}
