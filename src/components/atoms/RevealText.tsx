import { useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useInView } from '@/hooks/useScrollProgress';

interface RevealTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
  staggerDelay?: number;
  splitBy?: 'words' | 'chars' | 'lines';
}

export function RevealText({
  children,
  className,
  delay = 0,
  staggerDelay = 0.05,
  splitBy = 'words',
}: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { threshold: 0.2 });

  const splitText = () => {
    switch (splitBy) {
      case 'chars':
        return children.split('');
      case 'words':
        return children.split(' ');
      case 'lines':
        return children.split('\n');
      default:
        return children.split(' ');
    }
  };

  const items = splitText();

  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      y: '100%',
      opacity: 0,
    },
    visible: {
      y: '0%',
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        className={className}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {items.map((item, index) => (
          <span key={index} className="inline-block overflow-hidden">
            <motion.span
              variants={itemVariants}
              className="inline-block"
              style={{ whiteSpace: splitBy === 'words' ? 'pre' : 'normal' }}
            >
              {item}
              {splitBy === 'words' && index < items.length - 1 && '\u00A0'}
            </motion.span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
