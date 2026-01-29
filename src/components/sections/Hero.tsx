import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Pickaxe } from 'lucide-react';
import { ParticleBackground } from '@/components/effects';
import type { SiteData } from '@/types';

interface HeroProps {
  data: SiteData['hero'];
}

// Memoized stat card component with Minecraft style
const StatCard = memo(({
  stat,
  index,
}: {
  stat: { value: string; label: string };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
    className="mc-stat-box"
  >
    <div className="mc-stat-value">
      {stat.value}
    </div>
    <div className="mc-stat-label">
      {stat.label}
    </div>
  </motion.div>
));

StatCard.displayName = 'StatCard';

export const Hero = memo(function Hero({ data }: HeroProps) {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get primary and secondary CTAs
  const primaryCta = data.cta.find(c => c.primary);
  const secondaryCta = data.cta.find(c => !c.primary);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mc-texture-stone">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, var(--bg-primary), transparent 30%, transparent 70%, var(--bg-primary))',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-8 mc-badge"
          >
            <Pickaxe className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <span>{data.badge}</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
            style={{
              fontSize: '4.5rem',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              textShadow: '4px 4px 0 color-mix(in srgb, var(--bg-secondary) 50%, black)',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            {data.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-10 mc-section-subtitle"
            style={{ 
              fontSize: '1.5rem',
              fontWeight: 600,
            }}
          >
            {data.description}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            {primaryCta && (
              <button
                onClick={() => scrollToSection(primaryCta.link)}
                className="mc-btn flex items-center gap-2"
              >
                {primaryCta.text}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {secondaryCta && (
              <button
                onClick={() => scrollToSection(secondaryCta.link)}
                className="mc-btn mc-btn-secondary"
              >
                {secondaryCta.text}
              </button>
            )}
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {data.stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        }}
      />
    </section>
  );
});
