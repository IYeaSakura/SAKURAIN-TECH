'use client';

/**
 * ColophonSection — how this site is built, hosted and designed.
 *
 * Embedded into the About page so the colophon content lives alongside the
 * personal introduction.
 */

import { useMemo } from 'react';
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
import { useAnimationEnabled, useTranslation } from '@/hooks';

interface StackItem {
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface StackGroup {
  key: string;
  items: StackItem[];
}

const getStack = (t: ReturnType<typeof useTranslation>['t']): StackGroup[] => [
  {
    key: 'framework',
    items: [
      { name: 'Next.js 15', desc: t.about.colophon.stack.nextjs, icon: FileCode },
      { name: 'TypeScript', desc: t.about.colophon.stack.typescript, icon: FileCode },
      { name: 'React 19', desc: t.about.colophon.stack.react, icon: FileCode },
    ],
  },
  {
    key: 'style',
    items: [
      { name: 'Tailwind CSS', desc: t.about.colophon.stack.tailwind, icon: Paintbrush },
      { name: 'Framer Motion', desc: t.about.colophon.stack.framer, icon: Zap },
      { name: 'JetBrains Mono', desc: t.about.colophon.stack.jetbrains, icon: Type },
      { name: 'VT323 / Press Start 2P', desc: t.about.colophon.stack.pixelFonts, icon: Type },
    ],
  },
  {
    key: 'hosting',
    items: [
      { name: 'EdgeOne', desc: t.about.colophon.stack.edgeone, icon: Cloud },
      { name: 'Cloudflare', desc: t.about.colophon.stack.cloudflare, icon: Globe },
      { name: 'GitHub Actions', desc: t.about.colophon.stack.githubActions, icon: GitBranch },
    ],
  },
  {
    key: 'tools',
    items: [
      { name: 'gray-matter', desc: t.about.colophon.stack.grayMatter, icon: Package },
      { name: 'Remark / Rehype', desc: t.about.colophon.stack.remark, icon: Package },
      { name: 'Lucide Icons', desc: t.about.colophon.stack.lucide, icon: Package },
    ],
  },
];

const getDesignNotes = (t: ReturnType<typeof useTranslation>['t']) => [
  {
    title: t.about.colophon.designNotes.neoBrutalism.title,
    content: t.about.colophon.designNotes.neoBrutalism.content,
  },
  {
    title: t.about.colophon.designNotes.contentFirst.title,
    content: t.about.colophon.designNotes.contentFirst.content,
  },
  {
    title: t.about.colophon.designNotes.terminalMode.title,
    content: t.about.colophon.designNotes.terminalMode.content,
  },
];

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';

export function ColophonSection() {
  const animationEnabled = useAnimationEnabled();
  const { t } = useTranslation();

  const stack = useMemo(() => getStack(t), [t]);
  const designNotes = useMemo(() => getDesignNotes(t), [t]);

  const categoryLabels: Record<string, string> = {
    framework: t.about.colophon.categories.framework,
    style: t.about.colophon.categories.style,
    hosting: t.about.colophon.categories.hosting,
    tools: t.about.colophon.categories.tools,
  };

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
        {t.about.colophon.title}
      </h2>

      {/* Design notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {designNotes.map((note, index) => (
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
        {stack.map((group, groupIndex) => (
          <div key={group.key}>
            <h3
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
            >
              {categoryLabels[group.key] || group.key}
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
          <p>{t.about.colophon.footerNote}</p>
        </div>
      </div>
    </motion.section>
  );
}
