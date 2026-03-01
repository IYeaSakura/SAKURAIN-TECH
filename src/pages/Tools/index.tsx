/**
 * Toolbox Main Page
 * 
 * Central hub for all developer tools
 * Features:
 * - Tool grid with category filtering
 * - Search functionality
 * - Responsive design
 * - Easy to extend with new tools
 * 
 * @author SAKURAIN
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router';
import {
  Search,
  Grid3X3,
  Star,
  ArrowLeft,
} from 'lucide-react';
import { Footer } from '@/components/sections/Footer';
import { SectionTitle } from '@/components/atoms';
import { GridBackground, AmbientGlow } from '@/components/effects';
import { useAnimationEnabled } from '@/hooks';

// Import tool registry and types
import { registerTools, getAllTools, getTool, getToolsByCategory, searchTools, CATEGORIES } from './registry';
import { allTools } from './tools';
import type { ToolMeta, ToolCategory } from './types';
import { useKeyboardShortcuts } from './hooks';

// Register all tools
registerTools(allTools);

// CSS clip-path helper
const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// Tool Card Component
interface ToolCardProps {
  tool: ToolMeta;
  onClick: () => void;
  index: number;
}

function ToolCardComponent({ tool, onClick, index }: ToolCardProps) {
  const animationEnabled = useAnimationEnabled();
  const Icon = tool.icon;

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={animationEnabled ? { scale: 1.02, y: -4 } : undefined}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div
        className="relative p-5 h-full transition-colors"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--border-subtle)',
          clipPath: clipPathRounded(8),
        }}
      >
        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-1">
          {tool.isNew && (
            <span
              className="px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                clipPath: clipPathRounded(2),
              }}
            >
              新
            </span>
          )}
          {tool.isPopular && (
            <span
              className="px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                clipPath: clipPathRounded(2),
              }}
            >
              热门
            </span>
          )}
        </div>

        {/* Icon */}
        <div
          className="w-12 h-12 flex items-center justify-center mb-4 transition-colors group-hover:scale-110"
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-subtle)',
            clipPath: clipPathRounded(6),
            color: 'var(--accent-primary)',
          }}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3
          className="font-bold text-lg mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {tool.name}
        </h3>

        {/* Description */}
        <p
          className="text-sm line-clamp-2"
          style={{ color: 'var(--text-muted)' }}
        >
          {tool.description}
        </p>

        {/* Hover indicator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            clipPath: clipPathRounded(0),
          }}
        />
      </div>
    </motion.div>
  );
}

// Tool Detail View
interface ToolDetailViewProps {
  toolId: string;
  onBack: () => void;
}

function ToolDetailView({ toolId, onBack }: ToolDetailViewProps) {
  const animationEnabled = useAnimationEnabled();
  const tool = getTool(toolId);

  if (!tool) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--text-muted)' }}>工具未找到</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2"
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
            clipPath: clipPathRounded(4),
          }}
        >
          返回工具箱
        </button>
      </div>
    );
  }

  const { Component } = tool;

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, x: 20 } : undefined}
      animate={animationEnabled ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.3 }}
    >
      {/* Back button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 mb-6 transition-colors"
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          clipPath: clipPathRounded(6),
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        返回工具箱
      </motion.button>

      {/* Tool component */}
      <Component />
    </motion.div>
  );
}

// Main Toolbox Page
export default function ToolboxPage() {
  const animationEnabled = useAnimationEnabled();
  const navigate = useNavigate();
  const { toolId } = useParams<{ toolId?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onPaste: (text) => {
      // This will be handled by individual tools
      const event = new CustomEvent('toolpaste', { detail: text });
      window.dispatchEvent(event);
    },
    onCopy: () => {
      // This will be handled by individual tools
      const event = new CustomEvent('toolcopy');
      window.dispatchEvent(event);
      return null;
    },
    enabled: !!toolId,
  });

  // Get filtered tools
  const filteredTools = useMemo(() => {
    let tools = getAllTools().map(t => t.meta);

    // Filter by category
    if (selectedCategory !== 'all') {
      tools = getToolsByCategory(selectedCategory).map(t => t.meta);
    }

    // Filter by search
    if (searchQuery.trim()) {
      tools = searchTools(searchQuery).map(t => t.meta);
    }

    return tools;
  }, [selectedCategory, searchQuery]);

  // Handle tool click
  const handleToolClick = useCallback((id: string) => {
    navigate(`/tools/${id}`);
  }, [navigate]);

  // Handle back
  const handleBack = useCallback(() => {
    navigate('/tools');
  }, [navigate]);

  // Get popular tools for quick access
  const popularTools = useMemo(() => {
    return getAllTools()
      .filter(t => t.meta.isPopular)
      .map(t => t.meta)
      .slice(0, 4);
  }, []);

  // If viewing a specific tool
  if (toolId) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <GridBackground />
        <AmbientGlow position="top-left" color="var(--accent-primary)" size={400} opacity={0.1} />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <ToolDetailView toolId={toolId} onBack={handleBack} />
        </div>

        <Footer
          data={{
            copyright: '© 2026 SAKURAIN',
            slogan: '更专业，更可靠，更高效',
            links: [
              { label: '首页', href: '/' },
              { label: '博客', href: '/blog' },
              { label: '算法可视化', href: '/algo-viz' },
            ],
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <GridBackground />
      
      {/* Background effects */}
      <AmbientGlow position="top-left" color="var(--accent-primary)" size={400} opacity={0.1} />
      <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={300} opacity={0.08} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <SectionTitle
          title="开发者工具箱"
          subtitle="高效便捷的在线工具集合，助力日常开发工作"
        />

        {/* Quick access - Popular tools */}
        {popularTools.length > 0 && (
          <motion.div
            initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
            animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                快速访问
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {popularTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <motion.button
                    key={tool.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleToolClick(tool.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 transition-colors"
                    style={{
                      background: 'var(--bg-card)',
                      border: '2px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      clipPath: clipPathRounded(6),
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    {tool.name}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Search and filter */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          {/* Search */}
          <div className="relative mb-6">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索工具..."
              className="w-full pl-12 pr-4 py-3 focus:outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                clipPath: clipPathRounded(8),
              }}
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
              style={{
                background: selectedCategory === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                color: selectedCategory === 'all' ? 'white' : 'var(--text-primary)',
                clipPath: clipPathRounded(4),
              }}
            >
              <Grid3X3 className="w-4 h-4" />
              全部
            </button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: selectedCategory === cat.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: selectedCategory === cat.id ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tools grid */}
        <motion.div
          initial={animationEnabled ? { opacity: 0 } : undefined}
          animate={animationEnabled ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTools.map((tool, index) => (
                  <ToolCardComponent
                    key={tool.id}
                    tool={tool}
                    onClick={() => handleToolClick(tool.id)}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20">
              <p style={{ color: 'var(--text-muted)' }}>未找到匹配的工具</p>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={animationEnabled ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            共 {getAllTools().length} 个工具 · {CATEGORIES.length} 个分类
          </p>
        </motion.div>
      </div>

      <Footer
        data={{
          copyright: '© 2026 SAKURAIN',
          slogan: '更专业，更可靠，更高效',
          links: [
            { label: '首页', href: '/' },
            { label: '博客', href: '/blog' },
            { label: '算法可视化', href: '/algo-viz' },
          ],
        }}
      />
    </div>
  );
}
