import { memo } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion, useIsMobile } from '@/lib/performance';

interface GlowBadgeProps {
  text: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
}

export const GlowBadge = memo(function GlowBadge({
  text,
  icon,
  variant = 'primary',
  size = 'md',
}: GlowBadgeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const variantColors = {
    primary: {
      bg: 'var(--bg-card)',
      border: 'var(--accent-primary)',
      text: 'var(--accent-primary)',
      glow: 'var(--accent-primary)',
    },
    secondary: {
      bg: 'var(--bg-card)',
      border: 'var(--accent-secondary)',
      text: 'var(--accent-secondary)',
      glow: 'var(--accent-secondary)',
    },
    tertiary: {
      bg: 'var(--bg-card)',
      border: 'var(--accent-tertiary)',
      text: 'var(--accent-tertiary)',
      glow: 'var(--accent-tertiary)',
    },
  };

  const sizeStyles = {
    sm: {
      padding: 'px-2 py-1',
      fontSize: 'text-xs',
      iconSize: 'w-3 h-3',
    },
    md: {
      padding: 'px-3 py-1.5',
      fontSize: 'text-sm',
      iconSize: 'w-4 h-4',
    },
    lg: {
      padding: 'px-4 py-2',
      fontSize: 'text-base',
      iconSize: 'w-5 h-5',
    },
  };

  const colors = variantColors[variant];
  const styles = sizeStyles[size];

  if (prefersReducedMotion || isMobile) {
    return (
      <div className="inline-flex items-center gap-2 relative">
        <div
          className={`flex items-center gap-2 ${styles.padding} rounded-lg`}
          style={{
            background: colors.bg,
            border: `2px solid ${colors.border}`,
          }}
        >
          {icon && <span className={styles.iconSize}>{icon}</span>}
          <span
            className={`font-primary ${styles.fontSize} font-bold uppercase tracking-wider`}
            style={{ color: colors.text }}
          >
            {text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 relative"
    >
      <div
        className="absolute -inset-2 rounded-xl animate-pulse-glow"
        style={{
          background: `linear-gradient(45deg, ${colors.glow}, color-mix(in srgb, ${colors.glow} 70%, white))`,
          filter: 'blur(15px)',
          opacity: 0.4,
          zIndex: -1,
        }}
      />
      <div
        className={`flex items-center gap-2 ${styles.padding} rounded-lg transition-all duration-300 hover:scale-105 relative overflow-hidden group`}
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          boxShadow: `0 0 20px color-mix(in srgb, ${colors.glow} 40%, transparent), inset 0 0 10px color-mix(in srgb, ${colors.glow} 10%, transparent)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${colors.glow} 20%, transparent), transparent)`,
            transform: 'translateX(-100%)',
            animation: 'shine 1.5s ease-in-out infinite',
          }}
        />
        {icon && <span className={styles.iconSize}>{icon}</span>}
        <span
          className={`font-primary ${styles.fontSize} font-bold uppercase tracking-wider relative z-10`}
          style={{ color: colors.text }}
        >
          {text}
        </span>
      </div>
    </motion.div>
  );
});

GlowBadge.displayName = 'GlowBadge';
