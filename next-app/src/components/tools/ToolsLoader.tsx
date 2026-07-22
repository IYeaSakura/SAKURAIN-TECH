'use client';

import dynamic from 'next/dynamic';

/**
 * /tools 工具箱首页 Loader —— Phase 1：整页客户端组件，
 * 按迁移原则用 ssr:false 动态加载（framer-motion / 浏览器 API 深度耦合）。
 */
const ToolboxPage = dynamic(() => import('./ToolsApp'), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center font-mono">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>{'>'} loading tools...</p>
      </div>
    </div>
  ),
});

export default function ToolsLoader() {
  return <ToolboxPage />;
}
