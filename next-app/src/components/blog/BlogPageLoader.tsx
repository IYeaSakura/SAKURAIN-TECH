'use client';

import dynamic from 'next/dynamic';
import { RouteLoader } from '@/components/RouteLoader';

/** Phase 1：博客列表为重度客户端页面，ssr:false 动态加载 */
const BlogPage = dynamic(() => import('./BlogPage'), {
  ssr: false,
  loading: () => <RouteLoader />,
});

export default function BlogPageLoader() {
  return <BlogPage />;
}
