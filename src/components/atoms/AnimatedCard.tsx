import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedCard({ children, className, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(
        'bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-10 cursor-pointer',
        className
      )}
      whileHover={{ 
        y: -8, 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        transition: { duration: 0.4 }
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
