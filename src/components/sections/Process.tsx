import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Code, CheckCircle, Headphones, ArrowRight, type LucideIcon } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface ProcessProps {
  data: SiteData['process'];
}

const iconMap: Record<string, LucideIcon> = {
  Search,
  Lightbulb,
  Code,
  CheckCircle,
  Headphones,
};

const getIcon = (iconName: string): LucideIcon => iconMap[iconName] || Code;

// Memoized process step card
const ProcessStep = memo(({
  step,
  index,
  isLast,
}: {
  step: SiteData['process']['steps'][0];
  index: number;
  isLast: boolean;
}) => {
  const Icon = useMemo(() => getIcon(step.icon), [step.icon]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
    >
      {/* Step Card */}
      <div
        className="group relative p-6 rounded-2xl border transition-all duration-300 h-full"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 30%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
      >
        {/* Step Number */}
        <div
          className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          }}
        >
          {step.id}
        </div>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mt-2"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 20%, transparent), color-mix(in srgb, var(--accent-secondary) 20%, transparent))',
          }}
        >
          <Icon className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {step.title}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {step.description}
        </p>

        {/* Details */}
        <ul className="space-y-2 mb-4">
          {step.details.map((detail) => (
            <li key={detail} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: 'var(--accent-primary)' }}
              />
              {detail}
            </li>
          ))}
        </ul>

        {/* Duration */}
        <div
          className="pt-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            预计周期: <span style={{ color: 'var(--accent-primary)' }}>{step.duration}</span>
          </span>
        </div>
      </div>

      {/* Arrow to next - Desktop */}
      {!isLast && (
        <div className="hidden lg:flex absolute top-20 -right-2 z-10">
          <ArrowRight
            className="w-5 h-5"
            style={{ color: 'color-mix(in srgb, var(--accent-primary) 50%, transparent)' }}
          />
        </div>
      )}
    </motion.div>
  );
});

ProcessStep.displayName = 'ProcessStep';

export const Process = memo(function Process({ data }: ProcessProps) {
  return (
    <section id="process" className="relative py-24 lg:py-32">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary), var(--bg-primary))',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Process Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5">
            <div className="max-w-5xl mx-auto px-12">
              <div
                className="h-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent-primary) 30%, transparent), transparent)',
                }}
              />
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
            {data.steps.map((step, index) => (
              <ProcessStep
                key={step.id}
                step={step}
                index={index}
                isLast={index === data.steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            标准化的流程确保每个项目都能高质量交付
          </p>
          <motion.a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              boxShadow: '0 4px 20px color-mix(in srgb, var(--accent-primary) 25%, transparent)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            开始您的项目
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
});
