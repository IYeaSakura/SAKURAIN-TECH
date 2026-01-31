import { memo } from 'react';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Code, CheckCircle, Headphones, ArrowRight } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import { AmbientGlow } from '@/components/effects';
import type { SiteData } from '@/types';

interface ProcessProps {
  data: SiteData['process'];
}

const iconMap: Record<string, typeof Search> = {
  Search,
  Lightbulb,
  Code,
  CheckCircle,
  Headphones,
};

const getIcon = (iconName: string) => iconMap[iconName] || Code;

const ProcessStep = memo(({
  step,
  index,
  isLast,
}: {
  step: SiteData['process']['steps'][0];
  index: number;
  isLast: boolean;
}) => {
  const Icon = getIcon(step.icon);

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative flex items-start gap-4 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} md:flex-row`}
    >
      {/* Timeline Line */}
      {!isLast && (
        <>
          <div 
            className="absolute left-6 top-14 w-0.5 h-full hidden md:block"
            style={{ 
              background: 'linear-gradient(to bottom, var(--accent-primary), transparent)',
              height: 'calc(100% + 2rem)',
            }}
          />
          {/* Animated pulse on timeline */}
          <motion.div
            className="absolute left-6 top-14 w-0.5 hidden md:block"
            style={{ 
              background: 'var(--accent-primary)',
              height: '20px',
              filter: 'blur(2px)',
            }}
            animate={{ 
              top: ['56px', 'calc(100% + 2rem)'],
              opacity: [1, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: index * 0.5,
              ease: 'easeOut',
            }}
          />
        </>
      )}

      {/* Step Number & Icon */}
      <div className="relative flex-shrink-0">
        {/* Glow effect behind icon */}
        <motion.div
          className="absolute inset-0 -z-10"
          style={{
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="w-12 h-12 flex items-center justify-center relative"
          style={{
            background: 'var(--accent-primary)',
            border: '3px solid',
            borderColor: 'color-mix(in srgb, var(--accent-primary) 120%, white) color-mix(in srgb, var(--accent-primary) 80%, black) color-mix(in srgb, var(--accent-primary) 80%, black) color-mix(in srgb, var(--accent-primary) 120%, white)',
            boxShadow: 'inset -2px -2px 0 color-mix(in srgb, var(--accent-primary) 60%, black), inset 2px 2px 0 color-mix(in srgb, var(--accent-primary) 120%, white), 0 0 20px var(--accent-glow), 0 0 40px var(--accent-glow)',
          }}
          whileHover={{ scale: 1.1 }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
        <div 
          className="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center font-primary"
          style={{
            background: 'var(--mc-gold)',
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            color: 'white',
            border: '2px solid',
            borderColor: 'color-mix(in srgb, var(--mc-gold) 120%, white) color-mix(in srgb, var(--mc-gold) 80%, black) color-mix(in srgb, var(--mc-gold) 80%, black) color-mix(in srgb, var(--mc-gold) 120%, white)',
          }}
        >
          {step.id}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 md:pb-12">
        <motion.div
          className="p-6 mc-panel relative overflow-hidden group"
          whileHover={{ y: -4, boxShadow: '0 20px 40px -10px var(--accent-glow)' }}
        >
          {/* Hover glow effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 60%)',
            }}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3 
              className="font-primary"
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {step.title}
            </h3>
            <span 
              className="font-primary"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {step.duration}
            </span>
          </div>
          <p 
            className="mb-4 font-primary"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}
          >
            {step.description}
          </p>

          {/* Details */}
          <div className="flex flex-wrap gap-2">
            {step.details.map((detail, idx) => (
              <span
                key={idx}
                className="font-primary"
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  padding: '4px 10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  letterSpacing: '0.02em',
                }}
              >
                {detail}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

ProcessStep.displayName = 'ProcessStep';

export const Process = memo(function Process({ data }: ProcessProps) {
  return (
    <section id="process" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Ambient glow effects */}
      <AmbientGlow position="top-right" color="var(--accent-primary)" size={400} opacity={0.1} />
      <AmbientGlow position="bottom-left" color="var(--accent-secondary)" size={300} opacity={0.08} />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Process Steps */}
        <div className="relative">
          {data.steps.map((step, index) => (
            <ProcessStep
              key={step.id}
              step={step}
              index={index}
              isLast={index === data.steps.length - 1}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mt-12 text-center"
        >
          <motion.button
            onClick={() => {
              const element = document.querySelector('#contact');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mc-btn mc-btn-gold font-primary inline-flex items-center gap-2"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            开始您的项目
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
});
