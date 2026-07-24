'use client';

/**
 * ModuleNav —— Apple 风格模块导航（Bento 网格）。
 *
 * 将终端风格的编号、状态标签融入圆角卡片网格，
 * 每个卡片都是一个可点击的功能入口。
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
  gradient: string;
}

const modules: Module[] = [
  {
    index: '01',
    label: 'BLOG',
    title: '博客',
    desc: '技术文章与深度思考',
    href: '/blog',
    icon: BookOpen,
    status: 'Active',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    index: '02',
    label: 'PROJECTS',
    title: '项目',
    desc: '开源作品与 Demo',
    href: '/projects',
    icon: Briefcase,
    status: 'Stable',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    index: '03',
    label: 'EARTH',
    title: '地球Online',
    desc: '弹幕卫星与互动',
    href: '/earth-online',
    icon: Globe,
    status: 'Online',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    index: '04',
    label: 'SHUOSHUO',
    title: '说说',
    desc: '日常灵感与随记',
    href: '/shuoshuo',
    icon: FileText,
    status: 'Recent',
    gradient: 'from-orange-500/20 to-yellow-500/20',
  },
  {
    index: '05',
    label: 'FRIENDS',
    title: '友链',
    desc: '朋友们的网站',
    href: '/friends',
    icon: Heart,
    status: 'Connected',
    gradient: 'from-red-500/20 to-rose-500/20',
  },
  {
    index: '06',
    label: 'CIRCLE',
    title: '朋友圈',
    desc: '动态与信息流',
    href: '/friends-circle',
    icon: Rss,
    status: 'Live',
    gradient: 'from-indigo-500/20 to-violet-500/20',
  },
  {
    index: '07',
    label: 'ABOUT',
    title: '关于',
    desc: '了解更多关于我',
    href: '/about',
    icon: User,
    status: 'Verified',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
];

export function ModuleNav() {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {modules.map((module, index) => {
        const Icon = module.icon;
        return (
          <motion.button
            key={module.href}
            onClick={() => navigateTo(module.href)}
            initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="group relative apple-bento p-4 text-left flex flex-col gap-3 overflow-hidden"
          >
            {/* 渐变背景 */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />

            <div className="relative z-10 flex items-start justify-between">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform group-hover:scale-110"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--accent-primary)',
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{module.index}</span>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {module.title}
                </span>
                {module.status && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/5">
                    {module.status}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {module.desc}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
