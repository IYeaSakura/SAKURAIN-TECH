import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  delay?: number;
}

export function SectionTitle({ 
  title, 
  subtitle, 
  align = 'center', 
  className,
  delay = 0,
}: SectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };

  const titleVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      rotateX: -30,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const subtitleVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.2,
      },
    },
  };

  const lineVariants = {
    hidden: { 
      scaleX: 0,
    },
    visible: {
      scaleX: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.3,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'mb-12 sm:mb-16',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Decorative line above title */}
      <motion.div
        className={cn(
          'h-1 w-20 mb-6',
          align === 'center' ? 'mx-auto' : ''
        )}
        style={{ 
          background: 'var(--accent-primary)',
          transformOrigin: align === 'center' ? 'center' : 'left',
        }}
        variants={lineVariants}
      />

      {/* Main Title */}
      <div className="overflow-hidden" style={{ perspective: '1000px' }}>
        <motion.h2
          className="mb-4 sm:mb-6 font-primary"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textAlign: align,
            color: 'var(--accent-primary)',
            textShadow: '4px 4px 0 color-mix(in srgb, var(--accent-primary) 40%, black)',
            transformStyle: 'preserve-3d',
          }}
          variants={titleVariants}
        >
          {title}
        </motion.h2>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          className="font-primary max-w-2xl text-body-lg"
          style={{
            color: 'var(--text-muted)',
            margin: align === 'center' ? '0 auto' : '0',
            textAlign: align,
          }}
          variants={subtitleVariants}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
