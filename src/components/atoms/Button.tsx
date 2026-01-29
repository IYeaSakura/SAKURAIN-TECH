import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  href,
  onClick,
  className 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl';
  
  const variants = {
    primary: cn(
      'bg-gradient-to-r from-indigo-500 to-violet-500 text-white',
      'hover:from-indigo-400 hover:to-violet-400',
      'shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40',
      'border border-indigo-400/30'
    ),
    secondary: cn(
      'bg-white/5 text-white',
      'hover:bg-white/10',
      'border border-white/10 hover:border-white/20'
    ),
    ghost: 'text-slate-400 hover:text-white transition-colors',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </Component>
  );
}
