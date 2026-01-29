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
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
  >
    {/* Popular Badge */}
    {plan.popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div
          className="px-4 py-1 text-sm font-medium text-white rounded-full"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          }}
        >
          推荐
        </div>
      </div>
    )}

    <div
      className="h-full p-6 lg:p-8 rounded-2xl border transition-all"
      style={{
        background: plan.popular
          ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent-primary) 10%, transparent), color-mix(in srgb, var(--accent-secondary) 10%, transparent))'
          : 'var(--bg-card)',
        borderColor: plan.popular
          ? 'color-mix(in srgb, var(--accent-primary) 30%, transparent)'
          : 'var(--border-subtle)',
      }}
      onMouseEnter={(e) => {
        if (!plan.popular) {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 30%, transparent)';
        }
      }}
      onMouseLeave={(e) => {
        if (!plan.popular) {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }
      }}
    >
      {/* Plan Name */}
      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mb-6">
        <span className="text-3xl lg:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {plan.price}
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Performance Params */}
      {plan.params && (
        <div
          className="pt-6"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(plan.params).map(([key, value]) => (
              <div
                key={key}
                className="p-2 rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)' }}
              >
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{key}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <motion.a
        href="#contact"
        className="block w-full mt-6 py-3 text-center rounded-xl font-medium transition-all"
        style={{
          background: plan.popular
            ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
            : 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)',
          color: plan.popular ? 'white' : 'var(--text-primary)',
          border: plan.popular ? 'none' : '1px solid var(--border-subtle)',
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onMouseEnter={(e) => {
          if (!plan.popular) {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-tertiary) 80%, transparent)';
          }
        }}
        onMouseLeave={(e) => {
          if (!plan.popular) {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)';
          }
        }}
      >
        开始咨询
      </motion.a>
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
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all"
      style={{
        background: isActive
          ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
          : 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
        color: isActive ? 'white' : 'var(--text-muted)',
        border: isActive ? 'none' : '1px solid var(--border-subtle)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-card) 50%, transparent)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      <Icon className="w-5 h-5" />
      {category.name}
    </motion.button>
  );
});

CategoryTab.displayName = 'CategoryTab';

export const Pricing = memo(function Pricing({ data }: PricingProps) {
  const [activeCategory, setActiveCategory] = useState(data.categories[0].id);
  const currentCategory = data.categories.find(c => c.id === activeCategory);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

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
          className="text-center text-sm mb-10"
          style={{ color: 'var(--text-muted)' }}
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
          {data.categories.map((category) => (
            <CategoryTab
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {currentCategory?.plans.map((plan, index) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
