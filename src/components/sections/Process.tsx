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

export function Process({ data }: ProcessProps) {
  return (
    <section id="process" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]" />
      
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
              <div className="h-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
            {data.steps.map((step: typeof data.steps[0], index: number) => {
              const Icon = getIcon(step.icon);
              const isLast = index === data.steps.length - 1;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="group relative p-6 rounded-2xl bg-[#151520] border border-white/5 hover:border-indigo-500/30 transition-all duration-300 h-full">
                    {/* Step Number */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                      {step.id}
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mb-4 mt-2">
                      <Icon />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{step.description}</p>

                    {/* Details */}
                    <ul className="space-y-2 mb-4">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-center gap-2 text-sm text-slate-500">
                          <div className="w-1 h-1 rounded-full bg-indigo-400" />
                          {detail}
                        </li>
                      ))}
                    </ul>

                    {/* Duration */}
                    <div className="pt-4 border-t border-white/5">
                      <span className="text-xs text-slate-500">
                        预计周期: <span className="text-indigo-400">{step.duration}</span>
                      </span>
                    </div>
                  </div>

                  {/* Arrow to next - Desktop */}
                  {!isLast && (
                    <div className="hidden lg:flex absolute top-20 -right-2 z-10">
                      <ArrowRight className="w-5 h-5 text-indigo-500/50" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400 mb-6">
            标准化的流程确保每个项目都能高质量交付
          </p>
          <motion.a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
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
}
