'use client';

/**
 * UsesSection — tools, hardware and services used every day.
 *
 * Embedded into the About page; the standalone /uses route has been removed.
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
  Wrench,
} from 'lucide-react';
import { useAnimationEnabled, useTranslation } from '@/hooks';
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

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';

export function UsesSection() {
  const animationEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const [data, setData] = useState<UsesData | null>(null);

  useEffect(() => {
    fetch('/data/uses.json')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return null;

  const sections = Object.entries(data).filter(([key]) => key !== 'updatedAt');
  const sectionLabels: Record<string, string> = {
    hardware: t.about.uses.hardware,
    software: t.about.uses.software,
    development: t.about.uses.development,
    services: t.about.uses.services,
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
        {t.about.uses.title}
      </h2>

      <div className="space-y-8">
        {sections.map(([key, items]) => {
          const usesItems = items as UsesData['hardware'];
          return (
            <div key={key}>
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
              >
                {sectionLabels[key] || key}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {usesItems.map((item, index) => {
                  const Icon = ICON_MAP[item.icon] || Wrench;
                  return (
                    <motion.div
                      key={index}
                      initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
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
          );
        })}
      </div>
    </motion.section>
  );
}
