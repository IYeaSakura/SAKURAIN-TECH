'use client';

import dynamic from 'next/dynamic';
import { RouteLoader } from '@/components/RouteLoader';

/**
 * Phase 1：算法可视化为重度客户端页面（单步执行引擎 / 全屏 / 定时器），
 * 按迁移原则用 ssr:false 动态加载，避免 SSR 阶段的浏览器 API 访问。
 */
const AlgoVizPage = dynamic(() => import('./index'), {
  ssr: false,
  loading: () => <RouteLoader />,
});

export default function AlgoVizLoader() {
  return <AlgoVizPage />;
}
