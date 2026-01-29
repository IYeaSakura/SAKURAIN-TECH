import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TechBadgeProps {
  name: string;
  className?: string;
}

export function TechBadge({ name, className }: TechBadgeProps) {
  return (
    <motion.span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
        'bg-[rgba(0,0,0,0.04)] text-[#6b7280]',
        'transition-all duration-300',
        className
      )}
      whileHover={{
        backgroundColor: '#2563eb',
        color: '#ffffff',
      }}
      transition={{ duration: 0.3 }}
    >
      {name}
    </motion.span>
  );
}
