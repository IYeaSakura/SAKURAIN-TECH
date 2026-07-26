'use client';

/**
 * SkillsWidget —— highlights the top skills from site-data.json.
 *
 * Displays the first few skills across every category as tags and
 * links to the tech stack page for the full list.
 */

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ArrowRight } from 'lucide-react';
import { useTranslation, useAnimationEnabled, useNavigation } from '@/hooks';

interface SiteData {
  siteStack?: { name: string; level: number }[];
  techStack?: {
    categories: {
      name: string;
      skills: { name: string; level: number }[];
    }[];
  };
}

export function SkillsWidget() {
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const [data, setData] = useState<SiteData | null>(null);

  useEffect(() => {
    fetch('/data/site-data.json')
      .then((res) => res.json())
      .then((json: SiteData) => setData(json))
      .catch((error) => console.error('Failed to load site data:', error));
  }, []);

  const topSkills = useMemo(() => {
    if (data?.siteStack) {
      return [...data.siteStack].sort((a, b) => b.level - a.level).slice(0, 8);
    }
    if (!data?.techStack) return [];
    return data.techStack.categories
      .flatMap((category) => category.skills)
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);
  }, [data]);

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="h-full min-h-[160px] p-5 border-2 flex flex-col"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" style={{ color: 'var(--accent-tertiary)' }} />
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {t.widgets.skills}
          </span>
        </div>
        <button
          onClick={() => navigateTo('/about')}
          className="text-[10px] font-mono uppercase flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent-primary)' }}
        >
          {t.common.more}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 flex flex-wrap content-start gap-2">
        {topSkills.map((skill) => (
          <span
            key={skill.name}
            className="px-2.5 py-1 text-[10px] font-mono uppercase border-2"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
            }}
          >
            {skill.name}
          </span>
        ))}
        {topSkills.length === 0 && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t.common.loading}
          </span>
        )}
      </div>
    </motion.div>
  );
}
