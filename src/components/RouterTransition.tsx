import { useEffect, useState, useRef, Suspense, useTransition, useCallback } from 'react';
import { useLocation, useNavigation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '@/contexts/PerformanceContext';

/**
 * 路由加载占位符 - 骨架屏样式
 */
export function RouteLoader() {
  const { effectiveQuality } = usePerformance();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 像素风格加载动画 */}
      <div className="relative">
        {/* 外层旋转 */}
        <motion.div
          className="w-16 h-16 rounded-lg"
          style={{
            border: '4px solid var(--bg-tertiary)',
            borderTopColor: 'var(--accent-primary)',
            borderRightColor: 'var(--accent-secondary)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: effectiveQuality === 'low' ? 2 : 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* 内层反向旋转 */}
        <motion.div
          className="absolute inset-2 rounded"
          style={{
            border: '3px solid transparent',
            borderBottomColor: 'var(--accent-tertiary)',
            borderLeftColor: 'var(--accent-primary)',
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: effectiveQuality === 'low' ? 3 : 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* 加载文字 */}
      <motion.div 
        className="mt-6 text-center space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p 
          className="font-pixel text-lg tracking-wider"
          style={{ color: 'var(--accent-primary)' }}
        >
          LOADING...
        </p>
        <p 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          正在加载页面资源
        </p>
      </motion.div>

      {/* 进度条 */}
      <div className="mt-8 w-48 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
          }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{
            duration: effectiveQuality === 'low' ? 1.5 : 1,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* 骨架屏预览 */}
      <motion.div 
        className="mt-12 w-full max-w-2xl space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* 模拟标题 */}
        <div 
          className="h-8 rounded w-2/3 mx-auto animate-pulse"
          style={{ background: 'var(--bg-card)' }}
        />
        {/* 模拟段落 */}
        <div className="space-y-2">
          <div 
            className="h-4 rounded w-full animate-pulse"
            style={{ background: 'var(--bg-card)', animationDelay: '0.1s' }}
          />
          <div 
            className="h-4 rounded w-5/6 mx-auto animate-pulse"
            style={{ background: 'var(--bg-card)', animationDelay: '0.2s' }}
          />
          <div 
            className="h-4 rounded w-4/6 mx-auto animate-pulse"
            style={{ background: 'var(--bg-card)', animationDelay: '0.3s' }}
          />
        </div>
        {/* 模拟卡片 */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="h-24 rounded-lg animate-pulse"
              style={{ 
                background: 'var(--bg-card)',
                animationDelay: `${0.4 + i * 0.1}s`
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * 简化版路由加载器 - 用于快速切换
 */
export function MiniRouteLoader() {
  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="px-6 py-4 rounded-xl flex items-center gap-3"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div 
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
        <span 
          className="font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          页面切换中...
        </span>
      </motion.div>
    </div>
  );
}

/**
 * 路由过渡包装器 - 处理路由切换动画
 */
interface RouterTransitionProps {
  children: React.ReactNode;
}

export function RouterTransition({ children }: RouterTransitionProps) {
  const location = useLocation();
  const navigation = useNavigation();
  const { effectiveQuality } = usePerformance();
  
  const [isPending, startTransition] = useTransition();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);

  // 监听路由变化
  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    // 如果是同一路由，不触发过渡
    if (currentPath === prevPath) {
      setDisplayLocation(location);
      return;
    }

    // 开始过渡
    setIsTransitioning(true);

    // 使用 startTransition 延迟状态更新，让浏览器有机会渲染加载状态
    startTransition(() => {
      // 低性能设备：给浏览器更多时间处理
      const delay = effectiveQuality === 'low' ? 50 : 0;
      
      setTimeout(() => {
        setDisplayLocation(location);
        prevPathRef.current = currentPath;
        
        // 页面加载完成后，稍微延迟再结束过渡状态
        const endDelay = effectiveQuality === 'low' ? 200 : 100;
        setTimeout(() => {
          setIsTransitioning(false);
        }, endDelay);
      }, delay);
    });
  }, [location, effectiveQuality]);

  const isLoading = navigation.state === 'loading' || isPending || isTransitioning;

  return (
    <div className="relative">
      {/* 全局加载指示器 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <MiniRouteLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 页面内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={displayLocation.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: effectiveQuality === 'low' ? 0.15 : 0.2,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          style={{
            willChange: effectiveQuality === 'low' ? 'auto' : 'opacity, transform',
          }}
        >
          <Suspense fallback={<RouteLoader />}>
            {children}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * 预加载指示器 Hook
 */
export function usePreloadIndicator() {
  const [isPreloading, setIsPreloading] = useState(false);
  const { effectiveQuality } = usePerformance();

  const preload = useCallback(async (importFn: () => Promise<any>) => {
    if (effectiveQuality === 'low') {
      // 低性能设备：直接加载，不显示预加载状态
      return importFn();
    }

    setIsPreloading(true);
    try {
      const result = await importFn();
      // 稍微延迟关闭，让用户感知到加载完成
      await new Promise(resolve => setTimeout(resolve, 100));
      return result;
    } finally {
      setIsPreloading(false);
    }
  }, [effectiveQuality]);

  return { isPreloading, preload };
}
