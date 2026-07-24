'use client';

/**
 * Settings page — user-controlled visual preferences.
 *
 * Lets visitors pick a color theme, adjust border/shadow intensity, and
 * toggle reduced motion. All changes are persisted to localStorage and
 * applied immediately via CSS custom properties.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  Palette,
  BoxSelect,
  CloudSun,
  ZapOff,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { useSettings } from '@/hooks';
import { useNavigation, useAnimationEnabled } from '@/hooks';
import { COLOR_THEMES } from '@/config/color-themes';
import { Footer } from '@/components/sections/Footer';

function IntensitySlider({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--text-muted)' }}
        >
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="2"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(90deg, var(--accent-primary) ${(value / 2) * 100}%, var(--bg-tertiary) ${(value / 2) * 100}%)`,
          border: '2px solid var(--border-subtle)',
        }}
      />
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  onClick,
}: {
  theme: (typeof COLOR_THEMES)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative text-left p-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{
        background: isActive ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        border: `2px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
        boxShadow: isActive
          ? '4px 4px 0 var(--accent-primary)'
          : '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 border-2"
          style={{
            background: theme.preview,
            borderColor: 'var(--border-subtle)',
          }}
        />
        {isActive && (
          <div
            className="w-5 h-5 flex items-center justify-center"
            style={{
              background: 'var(--accent-primary)',
              border: '2px solid var(--border-subtle)',
            }}
          >
            <Check className="w-3 h-3" style={{ color: 'var(--bg-primary)' }} />
          </div>
        )}
      </div>
      <h3
        className="text-sm font-bold mb-1"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
      >
        {theme.name}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {theme.description}
      </p>
    </button>
  );
}

function PreviewCard() {
  return (
    <div
      className="p-5 transition-all"
      style={{
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 border-2 flex items-center justify-center"
          style={{
            background: 'var(--accent-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <Palette className="w-5 h-5" style={{ color: 'var(--bg-primary)' }} />
        </div>
        <div>
          <h4
            className="text-sm font-bold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            Preview Card
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            实时预览当前主题与强度
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span
          className="text-xs px-2 py-1 border-2"
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          Primary
        </span>
        <span
          className="text-xs px-2 py-1 border-2"
          style={{
            background: 'var(--accent-secondary)',
            color: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          Secondary
        </span>
        <span
          className="text-xs px-2 py-1 border-2"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          Tertiary
        </span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    colorTheme,
    borderIntensity,
    shadowIntensity,
    reducedMotion,
    setColorTheme,
    setBorderIntensity,
    setShadowIntensity,
    setReducedMotion,
    resetSettings,
  } = useSettings();
  const { navigateTo } = useNavigation();
  const animationEnabled = useAnimationEnabled();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-32 pb-12">
          <div className="h-8 w-32 bg-[var(--bg-tertiary)] border-2 border-[var(--border-subtle)] animate-pulse mb-8" />
          <div className="space-y-4">
            <div className="h-32 bg-[var(--bg-secondary)] border-2 border-[var(--border-subtle)] animate-pulse" />
            <div className="h-32 bg-[var(--bg-secondary)] border-2 border-[var(--border-subtle)] animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-32 lg:pt-40 pb-12">
        {/* Header */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <button
            onClick={() => navigateTo('/')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
          <h1
            className="text-3xl sm:text-5xl font-bold uppercase tracking-tight mb-3"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
          >
            设置
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            自定义配色、边框强度与交互偏好。所有更改会立即生效并保存在本地。
          </p>
        </motion.section>

        {/* Theme selection */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div
            className="p-5 mb-6"
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-subtle)',
              boxShadow: '4px 4px 0 var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Palette className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                配色主题
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COLOR_THEMES.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={colorTheme === theme.id}
                  onClick={() => setColorTheme(theme.id)}
                />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Intensity controls */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div
            className="p-5"
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-subtle)',
              boxShadow: '4px 4px 0 var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <BoxSelect className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                样式强度
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <IntensitySlider
                label="边框粗细"
                value={borderIntensity}
                onChange={setBorderIntensity}
                icon={BoxSelect}
              />
              <IntensitySlider
                label="阴影强度"
                value={shadowIntensity}
                onChange={setShadowIntensity}
                icon={CloudSun}
              />
            </div>
            <PreviewCard />
          </div>
        </motion.section>

        {/* Motion & reset */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <div
            className="p-5"
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-subtle)',
              boxShadow: '4px 4px 0 var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <ZapOff className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                无障碍
              </h2>
            </div>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                减少动画效果
              </span>
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className="w-12 h-6 border-2 transition-colors relative"
                style={{
                  background: reducedMotion ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-3.5 h-3.5 border-2 transition-transform"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-subtle)',
                    transform: reducedMotion ? 'translateX(24px)' : 'translateX(0)',
                  }}
                />
              </button>
            </label>

            <div className="mt-6 pt-5" style={{ borderTop: '2px solid var(--border-subtle)' }}>
              <button
                onClick={resetSettings}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: '3px 3px 0 var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <RotateCcw className="w-4 h-4" />
                恢复默认
              </button>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer
        data={{
          copyright: `© ${new Date().getFullYear()} SAKURAIN`,
          slogan: '用代码构建未来',
          links: [],
        }}
      />
    </div>
  );
}
