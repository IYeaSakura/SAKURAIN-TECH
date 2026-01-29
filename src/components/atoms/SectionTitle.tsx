import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionTitle({ title, subtitle, align = 'center', className }: SectionTitleProps) {
  return (
    <motion.div
      className={cn(
        'mb-12',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.5 }}
    >
      <h2
        className="mc-section-title mb-4"
        style={{
          fontSize: '3.5rem',
          textAlign: align,
          fontWeight: 800,
          letterSpacing: '0.02em',
        }}
      >
        <span
          style={{
            color: 'var(--accent-primary)',
            textShadow: '4px 4px 0 color-mix(in srgb, var(--accent-primary) 40%, black)',
          }}
        >
          {title}
        </span>
      </h2>
      {subtitle && (
        <p
          className="mc-section-subtitle max-w-2xl"
          style={{
            color: 'var(--text-muted)',
            margin: align === 'center' ? '0 auto' : '0',
            textAlign: align,
          }}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
