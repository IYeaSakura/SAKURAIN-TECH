'use client';

import { memo, useState, useEffect } from 'react';
import { useTranslation } from '@/hooks';
import { usePerformance } from '@/contexts/PerformanceContext';

/**
 * Unified full-screen loading placeholder with staggered animations.
 * Prefer CSS animations to reduce JavaScript overhead.
 */
export const LoadingPlaceholder = memo(() => {
  const { t } = useTranslation();
  const { effectiveQuality } = usePerformance();
  const [animationPhase, setAnimationPhase] = useState(0);
  const isLowQuality = effectiveQuality === 'low';

  // Stagger animation starts to avoid jank from simultaneous transitions.
  useEffect(() => {
    if (isLowQuality) return; // Skip complex animations on low-performance devices.

    const timers = [
      setTimeout(() => setAnimationPhase(1), 100),   // spinner
      setTimeout(() => setAnimationPhase(2), 300),   // text fade-in
      setTimeout(() => setAnimationPhase(3), 500),   // progress bar
      setTimeout(() => setAnimationPhase(4), 700),   // skeleton screen
    ];

    return () => timers.forEach(clearTimeout);
  }, [isLowQuality]);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Static background grid - no animation */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--accent-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.03,
        }}
      />

      {/* Main loading animation - uses CSS instead of framer-motion */}
      <div className="relative">
        {/* Outer spinner */}
        <div
          className="w-16 h-16 rounded-lg"
          style={{
            border: '4px solid var(--bg-tertiary)',
            borderTopColor: 'var(--accent-primary)',
            borderRightColor: 'var(--accent-secondary)',
            animation: animationPhase >= 1 && !isLowQuality
              ? 'spin 1s linear infinite'
              : 'none',
          }}
        />

        {/* Inner reverse spinner - hidden on low-performance devices */}
        {!isLowQuality && (
          <div
            className="absolute inset-2 rounded"
            style={{
              border: '3px solid transparent',
              borderBottomColor: 'var(--accent-tertiary)',
              borderLeftColor: 'var(--accent-primary)',
              animation: animationPhase >= 1
                ? 'spin-reverse 1.5s linear infinite'
                : 'none',
            }}
          />
        )}
      </div>

      {/* Loading text - fades in */}
      <div
        className="mt-6 text-center space-y-2 transition-opacity duration-300"
        style={{ opacity: animationPhase >= 2 ? 1 : 0 }}
      >
        <p
          className="font-pixel text-lg tracking-wider"
          style={{ color: 'var(--accent-primary)' }}
        >
          LOADING...
        </p>
        <p
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          {t.common.initializingSystem}
        </p>
      </div>

      {/* Progress bar - CSS animation */}
      <div
        className="mt-8 w-48 h-1 rounded-full overflow-hidden transition-opacity duration-300"
        style={{
          background: 'var(--bg-tertiary)',
          opacity: animationPhase >= 3 ? 1 : 0,
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            animation: animationPhase >= 3
              ? 'progress 1.2s ease-in-out forwards'
              : 'none',
          }}
        />
      </div>

      {/* Skeleton preview - fades in with a delay */}
      <div
        className="mt-12 w-full max-w-md space-y-4 transition-opacity duration-500"
        style={{ opacity: animationPhase >= 4 ? 1 : 0 }}
      >
        {/* Mock title */}
        <div
          className="h-8 rounded w-2/3 mx-auto skeleton-pulse"
          style={{ background: 'var(--bg-card)' }}
        />
        {/* Mock paragraphs */}
        <div className="space-y-2">
          <div
            className="h-4 rounded w-full skeleton-pulse"
            style={{ background: 'var(--bg-card)', animationDelay: '0.1s' }}
          />
          <div
            className="h-4 rounded w-5/6 mx-auto skeleton-pulse"
            style={{ background: 'var(--bg-card)', animationDelay: '0.2s' }}
          />
        </div>
        {/* Mock cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-lg skeleton-pulse"
              style={{
                background: 'var(--bg-card)',
                animationDelay: `${0.3 + i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS animation keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 2s ease-in-out infinite;
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';

/**
 * Simplified loading placeholder for section-level loading states.
 */
export const SectionLoadingPlaceholder = memo(() => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center">
      <div
        className="w-10 h-10 rounded-lg"
        style={{
          border: '3px solid var(--bg-tertiary)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        {t.common.loadingSection}
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

SectionLoadingPlaceholder.displayName = 'SectionLoadingPlaceholder';
