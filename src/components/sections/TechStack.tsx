import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Server, Database, Layout, Brain, Cloud, type LucideIcon } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import type { SiteData } from '@/types';

interface TechStackProps {
  data: SiteData['techStack'];
}

const iconMap: Record<string, LucideIcon> = {
  Cpu,
  Server,
  Database,
  Layout,
  Brain,
  Cloud,
};

const getIcon = (iconName: string): LucideIcon => iconMap[iconName] || Cpu;

// Memoized skill bar component
const SkillBar = memo(({
  skill,
  categoryIndex,
  skillIndex,
}: {
  skill: { name: string; level: number };
  categoryIndex: number;
  skillIndex: number;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {skill.name}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {skill.level}%
      </span>
    </div>
    <div
      className="h-2 rounded-full overflow-hidden"
      style={{ background: 'color-mix(in srgb, var(--bg-tertiary) 50%, transparent)' }}
    >
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${skill.level}%` }}
        viewport={{ margin: '-50px' }}
        transition={{
          duration: 1,
          delay: categoryIndex * 0.1 + skillIndex * 0.1,
          ease: 'easeOut',
        }}
        className="h-full rounded-full"
        style={{
          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
        }}
      />
    </div>
  </div>
));

SkillBar.displayName = 'SkillBar';

// Memoized category card component
const CategoryCard = memo(({
  category,
  index,
}: {
  category: SiteData['techStack']['categories'][0];
  index: number;
}) => {
  const Icon = useMemo(() => getIcon(category.icon), [category.icon]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div
        className="h-full p-6 rounded-2xl transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 30%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 20%, transparent), color-mix(in srgb, var(--accent-secondary) 20%, transparent))',
            }}
          >
            <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {category.name}
          </h3>
        </div>

        {/* Skills */}
        <div className="space-y-4">
          {category.skills.map((skill, skillIndex) => (
            <SkillBar
              key={skill.name}
              skill={skill}
              categoryIndex={index}
              skillIndex={skillIndex}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

CategoryCard.displayName = 'CategoryCard';

// Memoized tech tag component
const TechTag = memo(({
  tech,
  index,
}: {
  tech: string;
  index: number;
}) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ margin: '-50px' }}
    transition={{ duration: 0.3, delay: index * 0.03 }}
    className="px-4 py-2 text-sm rounded-xl transition-all cursor-default"
    style={{
      background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 30%, transparent)';
      e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-primary) 10%, transparent)';
      e.currentTarget.style.color = 'var(--text-primary)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border-subtle)';
      e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-card) 50%, transparent)';
      e.currentTarget.style.color = 'var(--text-secondary)';
    }}
  >
    {tech}
  </motion.span>
));

TechTag.displayName = 'TechTag';

export const TechStack = memo(function TechStack({ data }: TechStackProps) {
  const uniqueTechs = useMemo(() =>
    Array.from(new Set(data.categories.flatMap(c => c.skills.map(s => s.name)))),
    [data.categories]
  );

  return (
    <section id="tech-stack" className="relative py-24 lg:py-32">
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

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.categories.map((category, index) => (
            <CategoryCard
              key={category.name}
              category={category}
              index={index}
            />
          ))}
        </div>

        {/* Tech Tags Cloud */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
              我们的技术生态
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {uniqueTechs.map((tech, index) => (
              <TechTag key={tech} tech={tech} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
});
