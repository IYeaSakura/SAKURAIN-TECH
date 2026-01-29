import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Cpu, Database, Globe, type LucideIcon } from 'lucide-react';
import { GridBackground } from '@/components/effects';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface PricingProps {
  data: SiteData['pricing'];
}

const categoryIcons: Record<string, LucideIcon> = {
  'game-theory': Cpu,
  'data-analysis': Database,
  'web-dev': Globe,
};

const getCategoryIcon = (id: string): LucideIcon => categoryIcons[id] || Zap;

export function Pricing({ data }: PricingProps) {
  const [activeCategory, setActiveCategory] = useState(data.categories[0].id);
  const currentCategory = data.categories.find(c => c.id === activeCategory);

  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      <GridBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-slate-500 mb-10"
        >
          {data.disclaimer}
        </motion.p>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {data.categories.map((category: typeof data.categories[0]) => {
            const Icon = getCategoryIcon(category.id);
            const isActive = activeCategory === category.id;
            
            return (
              <motion.button
                key={category.id as string}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                {category.name}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {currentCategory?.plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium rounded-full">
                    推荐
                  </div>
                </div>
              )}

              <div
                className={`h-full p-6 lg:p-8 rounded-2xl border ${
                  plan.popular
                    ? 'bg-gradient-to-b from-indigo-500/10 to-violet-500/10 border-indigo-500/30'
                    : 'bg-[#151520] border-white/5 hover:border-white/10'
                } transition-all`}
              >
                {/* Plan Name */}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl lg:text-4xl font-bold text-white">{plan.price}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Performance Params */}
                {plan.params && (
                  <div className="pt-6 border-t border-white/5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {Object.entries(plan.params).map(([key, value]) => (
                        <div key={key} className="p-2 rounded-lg bg-white/5">
                          <div className="text-xs text-slate-500 mb-1">{key}</div>
                          <div className="text-sm font-medium text-indigo-400">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <motion.a
                  href="#contact"
                  className={`block w-full mt-6 py-3 text-center rounded-xl font-medium transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:shadow-lg hover:shadow-indigo-500/25'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  开始咨询
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
