import React from 'react';
import { motion } from 'framer-motion';
import { useMagnetic } from '@/hooks/useMagnetic';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  href?: string;
}

export function MagneticButton({
  children,
  className,
  variant = 'primary',
  onClick,
  href,
}: MagneticButtonProps) {
  const buttonRef = useMagnetic<HTMLButtonElement | HTMLAnchorElement>({
    strength: 0.2,
    ease: 0.1,
    radius: 100,
  });

  const baseStyles = 'inline-flex items-center justify-center px-6 py-3 rounded-full font-medium text-sm transition-colors duration-300';
  
  const variantStyles = {
    primary: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]',
    secondary: 'bg-white text-[#111827] border border-[rgba(0,0,0,0.08)] hover:border-[#2563eb] hover:text-[#2563eb]',
    outline: 'bg-transparent text-[#111827] border border-[rgba(0,0,0,0.08)] hover:border-[#2563eb] hover:text-[#2563eb]',
  };

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      ref={buttonRef as React.RefObject<HTMLButtonElement & HTMLAnchorElement>}
      href={href}
      onClick={onClick}
      className={cn(baseStyles, variantStyles[variant], className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </Component>
  );
}
