'use client';

/**
 * SystemMonitor —— 终端风格功能组件。
 *
 * 以 macOS 终端窗口的形式展示系统/构建指标，
 * 包括实时终端输出、服务状态、资源占用。
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, Circle } from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';

const SERVICES = [
  { name: 'next-build', status: 'running', uptime: '99.9%' },
  { name: 'content-sync', status: 'running', uptime: '100%' },
  { name: 'music-player', status: 'idle', uptime: '--' },
  { name: 'friends-check', status: 'running', uptime: '98.2%' },
];

const TERMINAL_LINES = [
  { type: 'input', content: 'npm run build' },
  { type: 'output', content: '> sakurain@2.0.0 build' },
  { type: 'output', content: '> next build' },
  { type: 'output', content: '✓ Creating optimized production build' },
  { type: 'output', content: '✓ Compiled successfully' },
  { type: 'output', content: '✓ Static HTML exported to dist/' },
  { type: 'input', content: 'deploy --prod' },
  { type: 'output', content: '[✓] Deployed to EdgeOne Pages' },
];

export function SystemMonitor() {
  const animationEnabled = useAnimationEnabled();
  const [currentLine, setCurrentLine] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentLine < TERMINAL_LINES.length) {
      const delay = TERMINAL_LINES[currentLine].type === 'input' ? 1200 : 600;
      const timer = setTimeout(() => setCurrentLine((p) => p + 1), delay);
      return () => clearTimeout(timer);
    }
    const reset = setTimeout(() => setCurrentLine(0), 5000);
    return () => clearTimeout(reset);
  }, [currentLine]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [currentLine]);

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 24 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="apple-bento overflow-hidden"
    >
      {/* Terminal window header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-black/5 dark:bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/90" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/90" />
          <div className="w-3 h-3 rounded-full bg-green-500/90" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">sakurain@studio: ~/project</span>
        </div>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Terminal output */}
        <div
          ref={terminalRef}
          className="lg:col-span-2 p-4 h-64 overflow-y-auto font-mono text-xs space-y-1"
          style={{ background: 'var(--bg-primary)' }}
        >
          {TERMINAL_LINES.slice(0, currentLine).map((line, index) => (
            <div key={index} className="flex items-start gap-2">
              {line.type === 'input' ? (
                <>
                  <span className="text-accent-primary">{'>'}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{line.content}</span>
                </>
              ) : (
                <span className="text-muted-foreground pl-4">{line.content}</span>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-accent-primary">{'>'}</span>
            <span className="apple-caret" />
          </div>
        </div>

        {/* Service status panel */}
        <div className="p-4 border-t lg:border-t-0 lg:border-l border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <span className="apple-mono-label">SERVICES</span>
          </div>
          <div className="space-y-3">
            {SERVICES.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/10"
              >
                <div className="flex items-center gap-2">
                  {service.status === 'running' ? (
                    <CheckCircle2 className="w-4 h-4 text-accent-secondary" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                    {service.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{service.uptime}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border/40">
            <div className="apple-mono-label mb-3">RESOURCES</div>
            <div className="space-y-3">
              <ResourceBar label="Build" value={78} />
              <ResourceBar label="Deploy" value={42} />
              <ResourceBar label="Cache" value={91} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ResourceBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
          }}
        />
      </div>
    </div>
  );
}
