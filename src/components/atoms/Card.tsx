import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = true, glow = false, onClick }: CardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-2xl p-6',
        'bg-[#151520] border border-white/5',
        glow && 'shadow-lg shadow-indigo-500/10',
        className
      )}
      onClick={onClick}
      whileHover={hover ? { 
        y: -4,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.2)',
      } : undefined}
      transition={{ duration: 0.3 }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
