import { memo, useState, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Sparkles, Zap, Brain, BarChart3, Globe, Shield, GraduationCap, Gamepad2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface PricingProps {
  data: SiteData['pricing'];
}

const categoryIcons: Record<string, typeof Brain> = {
  '博弈系统': Brain,
  '数据分析': BarChart3,
  '网站开发': Globe,
  '毕业设计': GraduationCap,
  'Minecraft插件': Gamepad2,
  'WAF安全': Shield,
};

const getCategoryIcon = (categoryName: string) => categoryIcons[categoryName] || Zap;

const colorMap: Record<string, { primary: string; secondary: string; glow: string }> = {
  '博弈系统': { primary: '#9B59B6', secondary: '#8E44AD', glow: 'rgba(155, 89, 182, 0.4)' },
  '数据分析': { primary: '#3498DB', secondary: '#2980B9', glow: 'rgba(52, 152, 219, 0.4)' },
  '网站开发': { primary: '#27AE60', secondary: '#229954', glow: 'rgba(39, 174, 96, 0.4)' },
  '毕业设计': { primary: '#E67E22', secondary: '#D35400', glow: 'rgba(230, 126, 34, 0.4)' },
  'Minecraft插件': { primary: '#1ABC9C', secondary: '#16A085', glow: 'rgba(26, 188, 156, 0.4)' },
  'WAF安全': { primary: '#E74C3C', secondary: '#C0392B', glow: 'rgba(231, 76, 60, 0.4)' },
};

const getColors = (categoryName: string) => {
  return colorMap[categoryName] || { primary: '#0E639C', secondary: '#094575', glow: 'rgba(14, 99, 156, 0.4)' };
};

// Flatten all plans with their indices
const getAllPlans = (categories: SiteData['pricing']['categories']) => {
  const allPlans: Array<{
    plan: SiteData['pricing']['categories'][0]['plans'][0];
    categoryName: string;
    categoryId: string;
    categoryIndex: number;
    globalIndex: number;
  }> = [];
  
  let globalIndex = 0;
  categories.forEach((category, categoryIndex) => {
    category.plans.forEach((plan) => {
      allPlans.push({
        plan,
        categoryName: category.name,
        categoryId: category.id,
        categoryIndex,
        globalIndex: globalIndex++,
      });
    });
  });
  
  return allPlans;
};

// Get the recommended (popular) plan index in a category
const getRecommendedPlanIndex = (categories: SiteData['pricing']['categories'], categoryIndex: number) => {
  let index = 0;
  for (let i = 0; i < categoryIndex; i++) {
    index += categories[i].plans.length;
  }
  const category = categories[categoryIndex];
  const popularIndex = category.plans.findIndex(p => p.popular);
  return index + (popularIndex >= 0 ? popularIndex : 0);
};

// Plan Card Component
const PlanCard = memo(({
  plan,
  categoryName,
  categoryColor,
  isActive,
  onClick,
}: {
  plan: SiteData['pricing']['categories'][0]['plans'][0];
  categoryName: string;
  categoryColor: { primary: string; secondary: string; glow: string };
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = getCategoryIcon(categoryName);
  
  return (
    <motion.div
      className="w-72 flex-shrink-0 cursor-pointer"
      onClick={onClick}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Card Container with Glow */}
      <motion.div
        className="relative rounded-2xl overflow-hidden h-full"
        style={{
          background: 'var(--bg-card)',
          transformOrigin: 'center center',
        }}
        animate={{
          scale: isActive ? 1.03 : 1,
          boxShadow: isActive
            ? `0 0 50px ${categoryColor.glow}, 0 25px 60px -10px rgba(0,0,0,0.5)`
            : '0 4px 20px -5px rgba(0,0,0,0.2)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Animated Border */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{
            border: `2px solid ${isActive ? categoryColor.primary : 'var(--border-subtle)'}`,
          }}
        />

        {/* Glow Effect */}
        <motion.div
          className="absolute -inset-1 rounded-2xl pointer-events-none blur-xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${categoryColor.glow}, transparent 60%)`,
          }}
          animate={{ opacity: isActive ? 0.8 : 0 }}
        />

        {/* Category Header Bar */}
        <div
          className="relative px-5 py-3 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${categoryColor.primary}20, ${categoryColor.primary}05)`,
            borderBottom: `1px solid ${categoryColor.primary}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `${categoryColor.primary}20`,
                border: `1px solid ${categoryColor.primary}40`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color: categoryColor.primary }} />
            </div>
            <span className="font-primary text-sm font-bold tracking-wide" style={{ color: categoryColor.primary }}>
              {categoryName}
            </span>
          </div>
          
          {/* Popular Badge */}
          {plan.popular && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                background: 'var(--mc-gold)',
                boxShadow: '0 2px 10px rgba(255, 215, 0, 0.4)',
              }}
            >
              <Sparkles className="w-3 h-3 text-black" />
              <span className="font-primary text-[10px] font-black text-black uppercase">推荐</span>
            </motion.div>
          )}
        </div>

        {/* Card Content */}
        <div className="relative p-5">
          {/* Plan Name & Price */}
          <div className="text-center mb-5">
            <motion.h3 
              className="font-primary text-xl font-black mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {plan.name}
            </motion.h3>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-primary text-3xl font-black" style={{ color: categoryColor.primary }}>
                {plan.price}
              </span>
              {plan.price !== '面议' && plan.price !== '定制' && (
                <span className="font-primary text-sm" style={{ color: 'var(--text-muted)' }}>起</span>
              )}
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-5">
            {plan.features.slice(0, 4).map((feature, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${categoryColor.primary}15` }}
                >
                  <Check className="w-3 h-3" style={{ color: categoryColor.primary }} />
                </div>
                <span className="font-primary text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {feature}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Params Grid */}
          {plan.params && (
            <div 
              className="grid grid-cols-3 gap-2 p-3 rounded-xl mb-5"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {Object.entries(plan.params).slice(0, 3).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    {key}
                  </div>
                  <div className="font-primary text-sm font-bold" style={{ color: categoryColor.primary }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <motion.button
            className="w-full py-3 font-primary font-bold uppercase tracking-wider text-sm relative overflow-hidden group"
            style={{
              background: isActive ? categoryColor.primary : 'transparent',
              color: isActive ? '#fff' : categoryColor.primary,
              border: `2px solid ${categoryColor.primary}`,
              borderRadius: '12px',
            }}
            whileHover={{ 
              scale: 1.02,
              background: categoryColor.primary,
              color: '#fff',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              const element = document.querySelector('#contact');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {/* Shine Effect */}
            <motion.div
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              选择方案
            </span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
});

// Category Tab Button
const CategoryTab = memo(({
  category,
  isActive,
  onClick,
  index,
  planCount,
}: {
  category: SiteData['pricing']['categories'][0];
  isActive: boolean;
  onClick: () => void;
  index: number;
  planCount: number;
}) => {
  const colors = getColors(category.name);
  const Icon = getCategoryIcon(category.name);

  return (
    <motion.button
      onClick={onClick}
      className="relative px-5 py-3 rounded-xl font-primary font-bold text-sm"
      style={{
        color: isActive ? '#fff' : 'var(--text-secondary)',
        background: isActive ? colors.primary : 'var(--bg-card)',
        border: `2px solid ${isActive ? colors.primary : 'var(--border-subtle)'}`,
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{category.name}</span>
        <span className="sm:hidden">{category.name.slice(0, 2)}</span>
        <span
          className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black"
          style={{
            background: isActive ? 'rgba(255,255,255,0.2)' : colors.primary + '20',
            color: isActive ? '#fff' : colors.primary,
          }}
        >
          {planCount}
        </span>
      </span>
      
      {/* Active Glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-xl"
          style={{ background: colors.glow, filter: 'blur(12px)' }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
});

// Centered Carousel - Shows 5 cards with center focus
const CenteredCarousel = memo(({
  allPlans,
  activeIndex,
  onSelect,
  isInView,
}: {
  allPlans: ReturnType<typeof getAllPlans>;
  activeIndex: number;
  onSelect: (index: number) => void;
  isInView: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalPlans = allPlans.length;
  
  // Calculate visible cards (center + 2 on each side = 5 total)
  const visibleCount = 5;
  const halfVisible = Math.floor(visibleCount / 2); // 2

  // Get indices for visible cards with wrapping
  const getVisibleIndices = () => {
    const indices = [];
    for (let i = -halfVisible; i <= halfVisible; i++) {
      let idx = activeIndex + i;
      // Wrap around
      idx = ((idx % totalPlans) + totalPlans) % totalPlans;
      indices.push(idx);
    }
    return indices;
  };

  // Navigation
  const navigate = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (activeIndex - 1 + totalPlans) % totalPlans
      : (activeIndex + 1) % totalPlans;
    onSelect(newIndex);
  }, [activeIndex, totalPlans, onSelect]);

  // Handle wheel events
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      navigate('next');
    } else {
      navigate('prev');
    }
  }, [navigate]);

  const visibleIndices = getVisibleIndices();

  // Card entrance animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const getCardVariants = (positionIndex: number) => ({
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.8,
      rotateY: positionIndex < halfVisible ? -15 : positionIndex > halfVisible ? 15 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: positionIndex === halfVisible ? 1.03 : positionIndex === 0 || positionIndex === visibleCount - 1 ? 0.85 : 0.92,
      rotateY: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 20,
        delay: Math.abs(positionIndex - halfVisible) * 0.05,
      },
    },
  });

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <motion.button
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--accent-primary)',
          boxShadow: '0 4px 30px var(--accent-glow)',
        }}
        onClick={() => navigate('prev')}
        whileHover={{ scale: 1.1, x: -2 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ delay: 0.5 }}
      >
        <ChevronLeft className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
      </motion.button>

      <motion.button
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--accent-primary)',
          boxShadow: '0 4px 30px var(--accent-glow)',
        }}
        onClick={() => navigate('next')}
        whileHover={{ scale: 1.1, x: 2 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        transition={{ delay: 0.5 }}
      >
        <ChevronRight className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
      </motion.button>

      {/* Cards Container with Mask */}
      <motion.div 
        ref={containerRef}
        className="relative overflow-hidden py-4"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          perspective: '1000px',
        }}
        onWheel={handleWheel}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Cards Track */}
        <div className="flex justify-center items-center gap-6">
          {visibleIndices.map((planIndex, positionIndex) => {
            const { plan, categoryName } = allPlans[planIndex];
            const colors = getColors(categoryName);
            const isCenter = positionIndex === halfVisible;
            const isEdge = positionIndex === 0 || positionIndex === visibleCount - 1;
            
            return (
              <motion.div
                key={`${planIndex}-${positionIndex}`}
                variants={getCardVariants(positionIndex)}
                style={{
                  opacity: isEdge ? 0.6 : 1,
                }}
              >
                <PlanCard
                  plan={plan}
                  categoryName={categoryName}
                  categoryColor={colors}
                  isActive={isCenter}
                  onClick={() => onSelect(planIndex)}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Progress Dots */}
      <motion.div 
        className="flex justify-center gap-2 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.6 }}
      >
        {allPlans.map((_, idx) => (
          <motion.button
            key={idx}
            className="w-2 h-2 rounded-full"
            style={{
              background: idx === activeIndex ? 'var(--accent-primary)' : 'var(--border-subtle)',
            }}
            animate={{
              scale: idx === activeIndex ? 1.5 : 1,
            }}
            onClick={() => onSelect(idx)}
            whileHover={{ scale: 1.8 }}
          />
        ))}
      </motion.div>
    </div>
  );
});

export const Pricing = memo(function Pricing({ data }: PricingProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { margin: '-100px' });
  
  const allPlans = getAllPlans(data.categories);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  
  const totalPlans = allPlans.length;
  const totalCategories = data.categories.length;

  const handleCategoryClick = useCallback((categoryIndex: number) => {
    setActiveCategoryIndex(categoryIndex);
    const recommendedIndex = getRecommendedPlanIndex(data.categories, categoryIndex);
    setActivePlanIndex(recommendedIndex);
  }, [data.categories]);

  const handlePlanSelect = useCallback((globalIndex: number) => {
    setActivePlanIndex(globalIndex);
    const plan = allPlans[globalIndex];
    if (plan) {
      setActiveCategoryIndex(plan.categoryIndex);
    }
  }, [allPlans]);

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <section id="pricing" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-0 w-96 h-96 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants}>
          <SectionTitle title={data.title} subtitle={data.subtitle} />
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-8 mb-8"
        >
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full" 
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-primary text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{totalCategories}</span> 个分类
            </span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full" 
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--mc-gold)' }} />
            <span className="font-primary text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{totalPlans}</span> 个方案
            </span>
          </motion.div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {data.categories.map((category, index) => (
            <CategoryTab
              key={category.id}
              category={category}
              isActive={activeCategoryIndex === index}
              onClick={() => handleCategoryClick(index)}
              index={index}
              planCount={category.plans.length}
            />
          ))}
        </motion.div>

        {/* Centered Carousel */}
        <CenteredCarousel
          allPlans={allPlans}
          activeIndex={activePlanIndex}
          onSelect={handlePlanSelect}
          isInView={isInView}
        />

        {/* Disclaimer */}
        <motion.p
          variants={itemVariants}
          className="mt-8 text-center font-primary text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          * {data.disclaimer}
        </motion.p>

        {/* Hint */}
        <motion.p
          variants={itemVariants}
          className="mt-2 text-center font-primary text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          点击箭头或滚轮切换 · 点击卡片选择方案 · 共 {totalPlans} 个方案
        </motion.p>
      </motion.div>
    </section>
  );
});
