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
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary))',
          }}
        >
          {title}
        </span>
      </h2>
      {subtitle && (
        <p
          className="text-lg max-w-2xl mx-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
