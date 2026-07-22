'use client';

import dynamic from 'next/dynamic';

/**
 * Phase 1：地球Online 为重度客户端页面（Cesium/Three.js/浏览器 API 深度耦合），
 * 按迁移原则用 ssr:false 动态加载，避免 SSR 阶段的 window/document 访问。
 */
const EarthOnlinePage = dynamic(() => import('./EarthOnlinePage'), {
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
        <p style={{ color: 'var(--text-muted)' }}>{'>'} loading earth online...</p>
      </div>
    </div>
  ),
});

export default function EarthOnlineLoader() {
  return <EarthOnlinePage />;
}
