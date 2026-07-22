'use client';

/**
 * ProjectsGrid —— 发丝级 1px 分隔线项目网格。
 *
 * 设计语言（参考 refact.cc 极简工程风）：
 * - grid gap-px + bg-border/40 实现发丝分隔线，卡片 bg-background 无圆角
 * - mono 编号徽章 P.01（按数组顺序），featured 标记
 * - 技术栈标签最多显示 4 个，超出折叠为 +N
 * - whileInView fade-up 错峰浮现（stagger 0.08s），尊重 prefers-reduced-motion
 * - hover：卡片 bg-muted/10、标题微移、右下角 DETAILS → 箭头滑动显色
 */
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import type { Project } from '@/data/projects';
import { ProjectModal } from './ProjectModal';

const STATUS_LABEL: Record<Project['status'], string> = {
  active: 'ACTIVE',
  maintained: 'MAINTAINED',
  archived: 'ARCHIVED',
  wip: 'WIP',
};

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

/** 无动效变体（prefers-reduced-motion） */
const cardVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
};

interface ProjectsGridProps {
  projects: Project[];
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [selected, setSelected] = useState<Project | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.div
        variants={reduceMotion ? undefined : containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/40 border border-border/40"
      >
        {projects.map((project, index) => {
          const visibleTech = project.tech.slice(0, 4);
          const extraTech = project.tech.length - visibleTech.length;

          return (
            <motion.article
              key={project.id}
              variants={reduceMotion ? cardVariantsReduced : cardVariants}
              className="group relative bg-background p-6 sm:p-8 cursor-pointer transition-colors hover:bg-muted/10"
              onClick={() => setSelected(project)}
              role="button"
              tabIndex={0}
              aria-label={`查看项目 ${project.name} 详情`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(project);
                }
              }}
            >
              {/* 顶部：编号 + featured + 状态 */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5">
                  P.{String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-2">
                  {project.featured && (
                    <Star
                      className="w-3.5 h-3.5 text-primary"
                      fill="currentColor"
                      aria-label="精选项目"
                    />
                  )}
                  <span className="font-mono uppercase tracking-widest text-muted-foreground text-xs">
                    {STATUS_LABEL[project.status]}
                  </span>
                </div>
              </div>

              {/* 标题（hover 微移） */}
              <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-1">
                {project.name}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {project.tagline}
              </p>

              {/* 技术栈标签（前 4 个 + 折叠） */}
              {project.tech.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {visibleTech.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-xs text-muted-foreground border border-border/40 px-1.5 py-0.5"
                    >
                      {tech}
                    </span>
                  ))}
                  {extraTech > 0 && (
                    <span className="font-mono text-xs text-muted-foreground border border-border/40 px-1.5 py-0.5">
                      +{extraTech}
                    </span>
                  )}
                </div>
              )}

              {/* 底部：分类 / 日期 + DETAILS → */}
              <div className="mt-6 flex items-end justify-between">
                <span className="font-mono uppercase tracking-widest text-muted-foreground text-xs">
                  {project.category} · {project.period}
                </span>
                <span className="font-mono text-xs text-muted-foreground flex items-center gap-1 transition-colors group-hover:text-primary">
                  DETAILS
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </>
  );
}
