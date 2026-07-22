'use client';

import dynamic from 'next/dynamic';
import { RouteLoader } from '@/components/RouteLoader';

/** Phase 1：博客详情为重度客户端页面，ssr:false 动态加载 */
const BlogPostPage = dynamic(() => import('./BlogPostPage'), {
  ssr: false,
  loading: () => <RouteLoader />,
});

export default function BlogPostPageLoader() {
  return <BlogPostPage />;
}
