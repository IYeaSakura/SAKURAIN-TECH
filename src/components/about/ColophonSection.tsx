'use client';

/**
 * ColophonSection — how this site is built, hosted and designed.
 *
 * Embedded into the About page so the colophon content lives alongside the
 * personal introduction.
 */

import { motion } from 'framer-motion';
import {
  FileCode,
  Paintbrush,
  Server,
  Globe,
  Type,
  GitBranch,
  Cloud,
  Zap,
  Package,
} from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';

interface StackItem {
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface StackGroup {
  key: string;
  label: string;
  items: StackItem[];
}

const STACK: StackGroup[] = [
  {
    key: 'framework',
    label: '框架与语言',
    items: [
      { name: 'Next.js 15', desc: 'React 全栈框架，静态导出', icon: FileCode },
      { name: 'TypeScript', desc: '类型安全与工程化', icon: FileCode },
      { name: 'React 19', desc: 'UI 组件与状态管理', icon: FileCode },
    ],
  },
  {
    key: 'style',
    label: '样式与字体',
    items: [
      { name: 'Tailwind CSS', desc: '原子化样式与响应式布局', icon: Paintbrush },
      { name: 'Framer Motion', desc: '交互动画与页面过渡', icon: Zap },
      { name: 'JetBrains Mono', desc: '等宽字体，代码与标签', icon: Type },
      { name: 'VT323 / Press Start 2P', desc: '像素字体，标题与强调', icon: Type },
    ],
  },
  {
    key: 'hosting',
    label: '托管与部署',
    items: [
      { name: 'EdgeOne', desc: '边缘函数、CDN 与静态托管', icon: Cloud },
      { name: 'Cloudflare', desc: 'DNS、Workers 与 R2 存储', icon: Globe },
      { name: 'GitHub Actions', desc: '自动化构建与发布', icon: GitBranch },
    ],
  },
  {
    key: 'tools',
    label: '内容工具',
    items: [
      { name: 'gray-matter', desc: 'Markdown 前置元数据解析', icon: Package },
      { name: 'Remark / Rehype', desc: 'Markdown 渲染与代码高亮', icon: Package },
      { name: 'Lucide Icons', desc: '轻量矢量图标', icon: Package },
    ],
  },
];

const DESIGN_NOTES = [
  {
    title: '新粗犷主义 + 像素风格',
    content:
      '界面以粗边框、硬边角、像素偏移阴影为主，避免过度圆润与光晕。色彩高对比，信息层级通过边框与间距建立。',
  },
  {
    title: '内容优先',
    content:
      '首页与个人页回归博客气质，突出文章、说说与照片。去掉产品化的营销文案，让站点更像数字花园。',
  },
  {
    title: '终端模式',
    content:
      '通过灵动岛可切换终端模式，使用 ls / cd / cat / open 等命令浏览内容，保留极客玩家的操作感。',
  },
];

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';

export function ColophonSection() {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.section
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-16"
    >
      <h2
        className="text-sm font-bold uppercase tracking-wider mb-4"
        style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
      >
        Colophon
      </h2>

      {/* Design notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {DESIGN_NOTES.map((note, index) => (
          <motion.div
            key={index}
            initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="p-4 rounded-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: PIXEL_BORDER,
              boxShadow: PIXEL_SHADOW,
            }}
          >
            <h3
              className="font-bold text-sm mb-2"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            >
              {note.title}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {note.content}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Stack groups */}
      <div className="space-y-8">
        {STACK.map((group, groupIndex) => (
          <div key={group.key}>
            <h3
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
            >
              {group.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: (groupIndex * 0.05) + (index * 0.03) }}
                    className="p-4 rounded-sm"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: PIXEL_BORDER,
                      boxShadow: PIXEL_SHADOW,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 flex items-center justify-center rounded-sm"
                        style={{ background: 'var(--bg-primary)', border: PIXEL_BORDER }}
                      >
                        <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-bold text-sm mb-1"
                          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                        >
                          {item.name}
                        </h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        className="mt-8 p-4 rounded-sm text-xs leading-relaxed"
        style={{
          background: 'var(--bg-secondary)',
          border: PIXEL_BORDER,
          boxShadow: PIXEL_SHADOW,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div className="flex items-start gap-3">
          <Server className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
          <p>
            站点源码托管于 GitHub，构建流程为：sync-content → check-friends → next build → submit-sitemap。
            所有内容源文件保存在 content/ 目录，构建期同步到 public/。
          </p>
        </div>
      </div>
    </motion.section>
  );
}
