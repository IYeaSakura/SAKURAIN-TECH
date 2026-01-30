import { memo, useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Cpu, Server, Database, Layout, Brain, Cloud } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface TechStackProps {
  data: SiteData['techStack'];
}

const iconMap: Record<string, typeof Cpu> = {
  Cpu,
  Server,
  Database,
  Layout,
  Brain,
  Cloud,
};

const getIcon = (iconName: string) => iconMap[iconName] || Cpu;

const SkillBar = memo(({
  skill,
  index,
  color,
  isInView,
}: {
  skill: { name: string; level: number };
  index: number;
  color: string;
  isInView: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <motion.span 
          className="font-primary"
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: isHovered ? color : 'var(--text-primary)',
            letterSpacing: '0.02em',
          }}
          animate={{ color: isHovered ? color : 'var(--text-primary)' }}
        >
          {skill.name}
        </motion.span>
        <motion.span
          className="font-primary"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: isHovered ? color : 'var(--text-muted)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
        >
          <motion.span
            key={isInView ? 'visible' : 'hidden'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {skill.level}%
          </motion.span>
        </motion.span>
      </div>
      <div 
        className="h-3 overflow-hidden relative"
        style={{ 
          background: 'var(--bg-secondary)',
          border: '2px solid',
          borderColor: 'color-mix(in srgb, var(--bg-secondary) 60%, black) color-mix(in srgb, var(--bg-secondary) 150%, white) color-mix(in srgb, var(--bg-secondary) 150%, white) color-mix(in srgb, var(--bg-secondary) 60%, black)',
          boxShadow: 'inset 2px 2px 0 rgba(0, 0, 0, 0.2)',
        }}
      >
        <motion.div
          className="h-full relative"
          style={{ 
            background: `linear-gradient(to right, ${color}, ${color}80)`,
            borderRight: `2px solid ${color}`,
          }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${skill.level}%` } : {}}
          transition={{ duration: 1.2, delay: index * 0.1 + 0.2, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
});

SkillBar.displayName = 'SkillBar';

const CategoryCard = memo(({
  category,
  index,
}: {
  category: SiteData['techStack']['categories'][0];
  index: number;
}) => {
  const Icon = getIcon(category.icon);
  const colors = ['#0E639C', '#6A9955', '#9B59B6', '#CE9178', '#4EC9B0', '#569CD6'];
  const color = colors[index % colors.length];
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
      }}
      className="mc-panel p-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        y: -8, 
        boxShadow: `0 20px 40px -15px ${color}30`,
        borderColor: color,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          className="mc-icon-box"
          style={{
            borderColor: color,
            boxShadow: `inset -3px -3px 0 ${color}40, inset 3px 3px 0 ${color}80`,
          }}
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
          animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </motion.div>
        <h3 
          className="font-primary"
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            color: isHovered ? color : 'var(--text-primary)',
            letterSpacing: '-0.01em',
            transition: 'color 0.3s',
          }}
        >
          {category.name}
        </h3>
      </div>

      {/* Skills */}
      <div className="space-y-1">
        <AnimatePresence>
          {category.skills.slice(0, isExpanded ? undefined : 4).map((skill, idx) => (
            <SkillBar
              key={skill.name}
              skill={skill}
              index={idx}
              color={color}
              isInView={isInView}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Expand/Collapse Button */}
      {category.skills.length > 4 && (
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 pt-4 font-primary"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: color,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderTop: '2px solid var(--border-subtle)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span
            animate={{ y: isExpanded ? [0, -2, 0] : [0, 2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-flex items-center gap-2"
          >
            {isExpanded ? '收起' : `查看全部 ${category.skills.length} 项技能`}
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              ▼
            </motion.span>
          </motion.span>
        </motion.button>
      )}
    </motion.div>
  );
});

CategoryCard.displayName = 'CategoryCard';

export const TechStack = memo(function TechStack({ data }: TechStackProps) {
  return (
    <section id="tech-stack" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.categories.map((category, index) => (
            <CategoryCard
              key={category.name}
              category={category}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
