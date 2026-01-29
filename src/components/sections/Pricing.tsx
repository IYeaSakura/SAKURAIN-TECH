import { useState, memo, useMemo, useCallback } from 'react';
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

// Memoized plan card component
const PlanCard = memo(({
  plan,
  index,
}: {
  plan: SiteData['pricing']['categories'][0]['plans'][0];
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ margin: '-50px' }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
  >
    {/* Popular Badge */}
    {plan.popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="mc-badge mc-badge-gold">
          推荐
        </div>
      </div>
    )}

    <div className="h-full mc-panel p-6">
      {/* Plan Name */}
      <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mb-6">
        <span className="text-3xl lg:text-4xl font-bold mc-glow-emerald">
          {plan.price}
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Performance Params */}
      {plan.params && (
        <div
          className="pt-6"
          style={{ borderTop: '2px solid var(--border-subtle)' }}
        >
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(plan.params).map(([key, value]) => (
              <div
                key={key}
                className="p-2 mc-stat-box"
                style={{ padding: '8px' }}
              >
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{key}</div>
                <div className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <a
        href="#contact"
        className={`block w-full mt-6 py-3 text-center font-medium transition-all ${
          plan.popular ? 'mc-btn mc-btn-gold' : 'mc-btn mc-btn-secondary'
        }`}
      >
        开始咨询
      </a>
    </div>
  </motion.div>
));

PlanCard.displayName = 'PlanCard';

// Memoized category tab component
const CategoryTab = memo(({
  category,
  isActive,
  onClick,
}: {
  category: SiteData['pricing']['categories'][0];
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = useMemo(() => getCategoryIcon(category.id), [category.id]);

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 transition-all ${
        isActive ? 'mc-btn' : 'mc-btn mc-btn-secondary'
      }`}
      style={{
        opacity: isActive ? 1 : 0.7,
      }}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:inline">{category.name}</span>
    </button>
  );
});

CategoryTab.displayName = 'CategoryTab';

export const Pricing = memo(function Pricing({ data }: PricingProps) {
  const [activeCategory, setActiveCategory] = useState(data.categories[0].id);

  const activeCategoryData = useMemo(() =>
    data.categories.find(c => c.id === activeCategory) || data.categories[0],
    [activeCategory, data.categories]
  );

  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden">
      <GridBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="价格方案"
          subtitle="透明定价，按需选择"
        />

        {/* Category Tabs */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {data.categories.map((category) => (
            <CategoryTab
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onClick={() => handleCategoryChange(category.id)}
            />
          ))}
        </div>

        {/* Plans Grid */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {activeCategoryData.plans.map((plan, index) => (
            <PlanCard key={plan.name} plan={plan} index={index} />
          ))}
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ margin: '-50px' }}
          className="mt-12 text-center mc-panel p-4 inline-block"
        >
          <p style={{ color: 'var(--text-muted)' }}>
            {data.disclaimer}
          </p>
        </motion.div>
      </div>
    </section>
  );
});
