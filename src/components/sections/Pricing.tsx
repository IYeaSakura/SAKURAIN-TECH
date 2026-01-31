import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Sparkles, Zap, Brain, BarChart3, Globe, Shield, GraduationCap, Gamepad2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import { FloatingBubbles, TwinklingStars, ConstellationEffect } from '@/components/effects';
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

// 7种预设色彩循环使用（避免相邻种类颜色相同）
const colorPalette: { primary: string; secondary: string; glow: string }[] = [
  { primary: '#3B82F6', secondary: '#2563EB', glow: 'rgba(59, 130, 246, 0.4)' },    // 科技蓝
  { primary: '#8B5CF6', secondary: '#7C3AED', glow: 'rgba(139, 92, 246, 0.4)' },    // 神秘紫
  { primary: '#10B981', secondary: '#059669', glow: 'rgba(16, 185, 129, 0.4)' },    // 活力绿
  { primary: '#F59E0B', secondary: '#D97706', glow: 'rgba(245, 158, 11, 0.4)' },    // 温暖橙
  { primary: '#EF4444', secondary: '#DC2626', glow: 'rgba(239, 68, 68, 0.4)' },      // 热情红
  { primary: '#06B6D4', secondary: '#0891B2', glow: 'rgba(6, 182, 212, 0.4)' },      // 清新青
  { primary: '#EC4899', secondary: '#DB2777', glow: 'rgba(236, 72, 153, 0.4)' },      // 浪漫粉
];

// 根据种类索引获取颜色（循环使用7种预设色）
const getColors = (categoryIndex: number) => {
  return colorPalette[categoryIndex % colorPalette.length];
};

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

// Get recommended plan index within a category (first popular plan, or first plan if none)
const getCategoryRecommendedIndex = (categories: SiteData['pricing']['categories'], categoryIndex: number) => {
  let index = 0;
  for (let i = 0; i < categoryIndex; i++) {
    index += categories[i].plans.length;
  }
  
  const category = categories[categoryIndex];
  if (!category) return index;
  
  // Find first popular plan in this category
  const popularPlanIndex = category.plans.findIndex(plan => plan.popular);
  if (popularPlanIndex !== -1) {
    return index + popularPlanIndex;
  }
  
  // Fallback to first plan
  return index;
};

const PlanCard = memo(({
  plan,
  categoryName,
  categoryColor,
  isActive,
  onClick,
  style,
}: {
  plan: SiteData['pricing']['categories'][0]['plans'][0];
  categoryName: string;
  categoryColor: { primary: string; secondary: string; glow: string };
  isActive: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) => {
  const Icon = getCategoryIcon(categoryName);
  
  return (
    <motion.div
      className="w-64 flex-shrink-0 cursor-pointer"
      onClick={onClick}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2 }}
      style={style}
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden h-full"
        style={{
          background: 'var(--bg-card)',
          transformOrigin: 'center center',
        }}
        animate={{
          scale: isActive ? 1.05 : 1,
          boxShadow: isActive
            ? `0 0 40px ${categoryColor.glow}, 0 20px 50px -10px rgba(0,0,0,0.5)`
            : '0 4px 20px -5px rgba(0,0,0,0.2)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{
            border: `2px solid ${isActive ? categoryColor.primary : 'var(--border-subtle)'}`,
          }}
        />
        <motion.div
          className="absolute -inset-1 rounded-2xl pointer-events-none blur-xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${categoryColor.glow}, transparent 60%)`,
          }}
          animate={{ opacity: isActive ? 0.8 : 0 }}
        />
        <div
          className="relative px-4 py-2.5 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${categoryColor.primary}20, ${categoryColor.primary}05)`,
            borderBottom: `1px solid ${categoryColor.primary}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: `${categoryColor.primary}20`,
                border: `1px solid ${categoryColor.primary}40`,
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: categoryColor.primary }} />
            </div>
            <span className="font-primary text-xs font-bold tracking-wide" style={{ color: categoryColor.primary }}>
              {categoryName}
            </span>
          </div>
          {plan.popular && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--mc-gold)',
                boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
              }}
            >
              <Sparkles className="w-2.5 h-2.5 text-black" />
              <span className="font-primary text-[9px] font-black text-black uppercase">推荐</span>
            </motion.div>
          )}
        </div>
        <div className="relative p-4">
          <div className="text-center mb-4">
            <motion.h3 
              className="font-primary text-lg font-black mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {plan.name}
            </motion.h3>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-primary text-2xl font-black" style={{ color: categoryColor.primary }}>
                {plan.price}
              </span>
              {plan.price !== '面议' && plan.price !== '定制' && (
                <span className="font-primary text-xs" style={{ color: 'var(--text-muted)' }}>起</span>
              )}
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {plan.features.slice(0, 4).map((feature, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${categoryColor.primary}15` }}
                >
                  <Check className="w-2.5 h-2.5" style={{ color: categoryColor.primary }} />
                </div>
                <span className="font-primary text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {feature}
                </span>
              </motion.div>
            ))}
          </div>
          {plan.params && (
            <div 
              className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl mb-4"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {Object.entries(plan.params).slice(0, 3).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    {key}
                  </div>
                  <div className="font-primary text-xs font-bold" style={{ color: categoryColor.primary }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
          <motion.button
            className="w-full py-2.5 font-primary font-bold uppercase tracking-wider text-xs relative overflow-hidden group"
            style={{
              background: isActive ? categoryColor.primary : 'transparent',
              color: isActive ? '#fff' : categoryColor.primary,
              border: `2px solid ${categoryColor.primary}`,
              borderRadius: '10px',
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
            <motion.div
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
            />
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              选择方案
            </span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
});

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
  const colors = getColors(index);
  const Icon = getCategoryIcon(category.name);

  return (
    <motion.button
      onClick={onClick}
      className="relative px-4 py-2.5 rounded-xl font-primary font-bold text-sm"
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

// Infinite Carousel with seamless loop
const CardCarousel = memo(({
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
  const totalPlans = allPlans.length;
  const cardWidth = 264;
  const gap = 20;
  const itemWidth = cardWidth + gap;
  
  // For true infinite loop, we render many copies
  const copies = 5; // Number of copies for seamless loop
  const extendedPlans = Array(copies).fill(allPlans).flat();
  const totalExtended = extendedPlans.length;
  
  // Current visual position (can be any number, not bounded)
  const [visualIndex, setVisualIndex] = useState(() => activeIndex + totalPlans);
  const visualIndexRef = useRef(visualIndex);
  
  // Keep ref in sync with state
  useEffect(() => {
    visualIndexRef.current = visualIndex;
  }, [visualIndex]);
  
  // Ref to track if visualIndex change is from user navigation (not external activeIndex change)
  const isNavigatingRef = useRef(false);
  const lastActiveIndexRef = useRef(activeIndex);
  
  // Sync visual index when activeIndex changes from outside (category click)
  // Only run when activeIndex actually changes externally (not from our own onSelect)
  useEffect(() => {
    // Skip if this is the same activeIndex we already synced to
    if (activeIndex === lastActiveIndexRef.current && !isNavigatingRef.current) {
      return;
    }
    
    // Mark that we're responding to external change, not user navigation
    isNavigatingRef.current = false;
    lastActiveIndexRef.current = activeIndex;
    
    const currentVisual = visualIndexRef.current;
    
    // Find the closest occurrence of activeIndex to current visualIndex
    const baseOffset = Math.floor(currentVisual / totalPlans) * totalPlans;
    let targetIndex = baseOffset + activeIndex;
    
    // Choose the closest one to minimize animation distance
    if (Math.abs(targetIndex + totalPlans - currentVisual) < Math.abs(targetIndex - currentVisual)) {
      targetIndex += totalPlans;
    } else if (Math.abs(targetIndex - totalPlans - currentVisual) < Math.abs(targetIndex - currentVisual)) {
      targetIndex -= totalPlans;
    }
    
    setVisualIndex(targetIndex);
  }, [activeIndex, totalPlans]);  // 注意：不依赖 visualIndex，避免循环
  
  // Normalize visual index periodically to prevent overflow (without triggering onSelect)
  useEffect(() => {
    const minIndex = totalPlans;
    const maxIndex = totalPlans * (copies - 1);
    
    if (visualIndex < minIndex || visualIndex >= maxIndex) {
      // Normalize to middle copy
      const normalizedIndex = (visualIndex % totalPlans) + totalPlans;
      if (normalizedIndex !== visualIndex) {
        setVisualIndex(normalizedIndex);
      }
    }
  }, [visualIndex, totalPlans, copies]);
  
  // Navigation - mark as user navigation
  const navigate = useCallback((direction: 'prev' | 'next') => {
    isNavigatingRef.current = true;
    setVisualIndex(prev => prev + (direction === 'prev' ? -1 : 1));
  }, []);
  
  // Update real active index based on visual index (only when user is navigating)
  useEffect(() => {
    // Only update activeIndex when user is navigating (not when syncing from external change)
    if (!isNavigatingRef.current) return;
    
    const realIndex = ((visualIndex % totalPlans) + totalPlans) % totalPlans;
    if (realIndex !== activeIndex) {
      lastActiveIndexRef.current = realIndex;
      onSelect(realIndex);
    }
  }, [visualIndex, totalPlans, activeIndex, onSelect]);
  
  // Handle wheel events
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    navigate(e.deltaY > 0 ? 'next' : 'prev');
  }, [navigate]);

  // Calculate translateX to center the active visual card
  const containerWidth = itemWidth * 4;
  const translateX = (containerWidth / 2) - (visualIndex * itemWidth) - (cardWidth / 2);
  
  // Track initial animation
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
    }
  }, [isInView]);

  return (
    <div className="relative" style={{ zIndex: 50 }}>
      {/* Navigation Arrows */}
      <motion.button
        className="absolute left-2 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--accent-primary)',
          boxShadow: '0 4px 20px var(--accent-glow)',
        }}
        onClick={() => navigate('prev')}
        whileHover={{ scale: 1.1, x: -2 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ delay: 0.5 }}
      >
        <ChevronLeft className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
      </motion.button>

      <motion.button
        className="absolute right-2 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--accent-primary)',
          boxShadow: '0 4px 20px var(--accent-glow)',
        }}
        onClick={() => navigate('next')}
        whileHover={{ scale: 1.1, x: 2 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        transition={{ delay: 0.5 }}
      >
        <ChevronRight className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
      </motion.button>

      {/* Cards Container - 增加垂直空间避免hover被截断 */}
      <div 
        className="relative mx-auto overflow-visible"
        style={{
          maxWidth: `${itemWidth * 4 + gap}px`,
          zIndex: 50,
          paddingTop: '60px',
          paddingBottom: '60px',
          marginTop: '30px',
          marginBottom: '30px',
        }}
        onWheel={handleWheel}
      >
        {/* Viewport - 左右渐变遮罩，垂直方向无遮罩 */}
        <div 
          className="relative overflow-visible"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
          }}
        >
          {/* Cards Track - 增加最小高度确保卡片完全显示 */}
          <motion.div 
            className="flex items-center"
            style={{ 
              gap: `${gap}px`,
              width: `${totalExtended * itemWidth}px`,
              minHeight: '500px',
            }}
            animate={{
              x: translateX,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
          >
            {extendedPlans.map((planData, index) => {
              const { plan, categoryName, categoryIndex } = planData;
              const colors = getColors(categoryIndex);
              const isCenter = index === visualIndex;
              const distanceFromCenter = Math.abs(index - visualIndex);
              
              let scale = 0.85;
              let opacity = 0.4;
              if (isCenter) {
                scale = 1.05;
                opacity = 1;
              } else if (distanceFromCenter === 1) {
                scale = 0.95;
                opacity = 0.9;
              } else if (distanceFromCenter === 2) {
                scale = 0.88;
                opacity = 0.7;
              }
              
              const realIndex = index % totalPlans;
              
              return (
                <motion.div
                  key={`${plan.name}-${index}`}
                  className="flex-shrink-0"
                  style={{ 
                    width: cardWidth,
                    position: 'relative',
                    zIndex: isCenter ? 100 : 50 - distanceFromCenter,
                  }}
                  initial={!hasAnimated.current ? {
                    opacity: 0,
                    y: 60,
                    scale: 0.6,
                  } : false}
                  animate={{
                    opacity,
                    scale,
                    y: 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <PlanCard
                    plan={plan}
                    categoryName={categoryName}
                    categoryColor={colors}
                    isActive={isCenter}
                    onClick={() => onSelect(realIndex)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Progress Dots */}
      <motion.div 
        className="flex justify-center gap-2 mt-4"
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

  // 数据加载后，自动定位到第一个分类的推荐项目
  useEffect(() => {
    if (data.categories.length > 0) {
      const defaultIndex = getCategoryRecommendedIndex(data.categories, 0);
      setActivePlanIndex(defaultIndex);
    }
  }, [data.categories]);

  const handleCategoryClick = useCallback((categoryIndex: number) => {
    setActiveCategoryIndex(categoryIndex);
    const targetIndex = getCategoryRecommendedIndex(data.categories, categoryIndex);
    setActivePlanIndex(targetIndex);
  }, [data.categories]);

  const handlePlanSelect = useCallback((globalIndex: number) => {
    setActivePlanIndex(globalIndex);
    const plan = allPlans[globalIndex];
    if (plan) {
      setActiveCategoryIndex(plan.categoryIndex);
    }
  }, [allPlans]);

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
    <section id="pricing" ref={sectionRef} className="relative py-24 lg:py-32 overflow-visible">
      {/* 浮动气泡背景 */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <FloatingBubbles count={12} colors={['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)']} />
      </div>
      
      {/* 闪烁星星 */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={30} color="var(--accent-primary)" />
      </div>
      
      {/* 星座连线效果 - 仅在桌面端显示 */}
      <div className="absolute inset-0 pointer-events-none opacity-20 hidden lg:block">
        <ConstellationEffect count={15} connectionDistance={150} color="var(--accent-secondary)" />
      </div>
      
      {/* 柔和的环境光晕 */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div 
          className="absolute top-1/4 left-0 w-96 h-96 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <motion.div 
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible"
        style={{ zIndex: 10 }}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants}>
          <SectionTitle title={data.title} subtitle={data.subtitle} />
        </motion.div>

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

        <CardCarousel
          allPlans={allPlans}
          activeIndex={activePlanIndex}
          onSelect={handlePlanSelect}
          isInView={isInView}
        />

        <motion.p
          variants={itemVariants}
          className="mt-8 text-center font-primary text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          * {data.disclaimer}
        </motion.p>

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
