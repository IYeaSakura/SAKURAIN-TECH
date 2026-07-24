'use client';

/**
 * Numbered module navigation inspired by refact.cc.
 * Each module shows an index, label, title and short description.
 */

import { motion } from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  Globe,
  Heart,
  Rss,
  User,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { useAnimationEnabled, useNavigation } from '@/hooks';

interface Module {
  index: string;
  label: string;
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  status?: string;
}

const modules: Module[] = [
  {
    index: '01',
    label: 'BLOG',
    title: '博客',
    desc: '技术文章、教程与深度思考',
    href: '/blog',
    icon: BookOpen,
    status: 'Active',
  },
  {
    index: '02',
    label: 'PROJECTS',
    title: '项目',
    desc: '开源作品与实验性 Demo',
    href: '/projects',
    icon: Briefcase,
    status: 'Stable',
  },
  {
    index: '03',
    label: 'EARTH',
    title: '地球Online',
    desc: '弹幕卫星与互动留言',
    href: '/earth-online',
    icon: Globe,
    status: 'Online',
  },
  {
    index: '04',
    label: 'SHUOSHUO',
    title: '说说',
    desc: '日常灵感、心情与碎碎念',
    href: '/shuoshuo',
    icon: FileText,
    status: 'Recent',
  },
  {
    index: '05',
    label: 'FRIENDS',
    title: '友链',
    desc: '朋友们的网站与连接',
    href: '/friends',
    icon: Heart,
    status: 'Connected',
  },
  {
    index: '06',
    label: 'CIRCLE',
    title: '朋友圈',
    desc: '动态与社交信息流',
    href: '/friends-circle',
    icon: Rss,
    status: 'Live',
  },
  {
    index: '07',
    label: 'ABOUT',
    title: '关于',
    desc: '了解更多关于我',
    href: '/about',
    icon: User,
    status: 'Verified',
  },
];

export function ModuleNav() {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();

  return (
    <div className="grid gap-px border border-border/40 bg-border/40 rounded-lg overflow-hidden">
      {modules.map((module, index) => {
        const Icon = module.icon;
        return (
          <motion.button
            key={module.href}
            onClick={() => navigateTo(module.href)}
            initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="group flex items-center gap-4 p-4 sm:p-5 bg-background/50 hover:bg-muted/10 transition-colors text-left w-full"
          >
            {/* Index badge */}
            <div className="hidden sm:flex flex-col items-center justify-center w-10 h-10 border border-primary/20 bg-primary/5 text-primary font-mono text-xs font-bold">
              {module.index}
            </div>

            {/* Icon */}
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--accent-primary)',
              }}
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="mono-label text-[10px]">{module.label}</span>
                {module.status && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/5">
                    {module.status}
                  </span>
                )}
              </div>
              <h3
                className="text-base sm:text-lg font-semibold group-hover:text-accent-primary transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {module.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {module.desc}
              </p>
            </div>

            {/* Arrow */}
            <div className="text-muted-foreground group-hover:text-accent-primary transition-colors">
              <span className="font-mono text-xs hidden sm:inline">→</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
