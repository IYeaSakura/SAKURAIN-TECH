import { memo } from 'react';

export const GridBackground = memo(function GridBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in srgb, var(--accent-primary) 3%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--accent-primary) 3%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.3,
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 15%, transparent) 0%, transparent 70%)',
          opacity: 0.2,
        }}
      />

      {/* Floating orbs - Using CSS animations for better performance */}
      <div
        className="absolute top-20 left-20 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-secondary) 30%, transparent) 0%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: 0.1,
          animation: 'float1 8s ease-in-out infinite',
        }}
      />

      <div
        className="absolute bottom-40 right-20 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-tertiary) 30%, transparent) 0%, transparent 70%)',
          filter: 'blur(50px)',
          opacity: 0.1,
          animation: 'float2 10s ease-in-out infinite',
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.015,
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 30px); }
        }
      `}</style>
    </div>
  );
});
