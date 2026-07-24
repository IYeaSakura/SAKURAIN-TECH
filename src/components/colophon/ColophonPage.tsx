'use client';

/**
 * Colophon page —— how this site is built, hosted and maintained.
 *
 * Rendered with the site-wide brutalist design: sharp corners, thick borders,
 * pixel offset shadows and monospace labels.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileCode,
  Paintbrush,
  Server,
  Globe,
  Ruler,
  Type,
  GitBranch,
  Cloud,
  Zap,
  Package,
} from 'lucide-react';
import { useAnimationEnabled, useNavigation } from '@/hooks';

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
      '界面以粗边框、硬边角、像素偏移阴影为主，避免过度圆润与光晕。色彩高对比，信息层级通过边框与间距建立，而非半透明遮罩。',
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

export function ColophonPage() {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center font-mono">
          <div
            className="w-10 h-10 border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>{'>'} loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 lg:py-28">
        {/* Header */}
        <motion.header
          initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <button
            onClick={() => navigateTo('/')}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-70 mb-6"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
          <div className="flex items-center gap-3 mb-3">
            <Ruler className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            <h1
              className="text-3xl sm:text-4xl font-bold uppercase"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
            >
              Colophon
            </h1>
          </div>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            这个网站是如何构建、托管与设计的说明书。
          </p>
        </motion.header>

        {/* Design notes */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            设计说明
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DESIGN_NOTES.map((note, index) => (
              <div
                key={index}
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
              </div>
            ))}
          </div>
        </motion.section>

        {/* Stack groups */}
        <div className="space-y-10">
          {STACK.map((group, groupIndex) => (
            <motion.section
              key={group.key}
              initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: groupIndex * 0.05 }}
            >
              <h2
                className="text-sm font-bold uppercase tracking-wider mb-4"
                style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {group.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
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
                          <h3
                            className="font-bold text-sm mb-1"
                            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                          >
                            {item.name}
                          </h3>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={animationEnabled ? { opacity: 0 } : undefined}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-12 p-4 rounded-sm text-xs leading-relaxed"
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
              所有内容源文件保存在 content/ 目录，构建期同步到 public/，请勿直接修改 public/ 下的生成产物。
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
