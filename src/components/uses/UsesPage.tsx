'use client';

/**
 * Uses page — tools, hardware and services I use every day.
 *
 * Rendered with the site-wide brutalist design: sharp corners, thick borders,
 * pixel offset shadows and monospace labels.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Laptop,
  Keyboard,
  Monitor,
  Headphones,
  Mouse,
  Code2,
  Sparkles,
  Terminal,
  FileText,
  BookOpen,
  Palette,
  Globe,
  Layers,
  FileCode,
  Paintbrush,
  Server,
  Cpu,
  BrainCircuit,
  Container,
  GitBranch,
  Cloud,
  Shield,
  Triangle,
  Workflow,
  ArrowLeft,
  Wrench,
} from 'lucide-react';
import { useAnimationEnabled, useNavigation } from '@/hooks';
import type { UsesData } from '@/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Laptop,
  Keyboard,
  Monitor,
  Headphones,
  Mouse,
  Code2,
  Sparkles,
  Terminal,
  FileText,
  BookOpen,
  Palette,
  Globe,
  Layers,
  FileCode,
  Paintbrush,
  Server,
  Cpu,
  BrainCircuit,
  Container,
  GitBranch,
  Cloud,
  Shield,
  Triangle,
  Workflow,
};

const SECTION_LABELS: Record<string, string> = {
  hardware: '硬件装备',
  software: '日常软件',
  development: '技术栈',
  services: '云端服务',
};

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';

export function UsesPage() {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const [data, setData] = useState<UsesData | null>(null);

  useEffect(() => {
    fetch('/data/uses.json')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
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

  const sections = Object.entries(data).filter(([key]) => key !== 'updatedAt');

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
            <Wrench className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            <h1
              className="text-3xl sm:text-4xl font-bold uppercase"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
            >
              Uses
            </h1>
          </div>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            我日常使用的硬件、软件、技术栈与云服务。Last updated: {data.updatedAt}。
          </p>
        </motion.header>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map(([key, items], sectionIndex) => {
            const usesItems = items as UsesData['hardware'];
            return (
              <motion.section
                key={key}
                initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: sectionIndex * 0.05 }}
              >
                <h2
                  className="text-sm font-bold uppercase tracking-wider mb-4"
                  style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  {SECTION_LABELS[key] || key}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {usesItems.map((item, index) => {
                    const Icon = ICON_MAP[item.icon] || Wrench;
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
