'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import type { ComponentType } from 'react';

/**
 * /tools/[toolId] 工具详情 Loader —— Phase 1：整页客户端组件，
 * ssr:false 动态加载；用 useParams 取 toolId 传给详情页。
 * toolId 不存在时由 ToolsApp 内部优雅降级（提示 + 返回工具箱）。
 */
const ToolDetailPage = dynamic<{ toolId: string }>(
  () =>
    import('./ToolsApp').then(
      (m) => m.ToolDetailPage as ComponentType<{ toolId: string }>,
    ),
  {
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
          <p style={{ color: 'var(--text-muted)' }}>{'>'} loading tool...</p>
        </div>
      </div>
    ),
  },
);

export default function ToolDetailLoader() {
  const params = useParams<{ toolId: string }>();
  const toolId = typeof params?.toolId === 'string' ? params.toolId : '';
  return <ToolDetailPage toolId={toolId} />;
}
