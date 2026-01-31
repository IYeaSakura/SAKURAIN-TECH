import { memo, Suspense, lazy, type ComponentType } from 'react';
import { motion } from 'framer-motion';

interface LazySectionProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  props?: Record<string, any>;
  fallback?: React.ReactNode;
}

// 通用的加载占位组件
const DefaultFallback = memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-[300px] flex items-center justify-center"
  >
    <div
      className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
    />
  </motion.div>
));

DefaultFallback.displayName = 'DefaultFallback';

// 懒加载包装组件 - 减少初始加载时间
export const LazySection = memo(function LazySection({
  component,
  props = {},
  fallback,
}: LazySectionProps) {
  const LazyComponent = lazy(component);

  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
});

// 用于延迟加载非首屏内容的 hook
export function useLazyLoad(threshold = 0.1) {
  return {
    threshold,
    triggerOnce: true,
    rootMargin: '100px', // 提前 100px 开始加载
  };
}
