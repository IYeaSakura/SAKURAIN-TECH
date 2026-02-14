import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '@/contexts/PerformanceContext';

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading: boolean;
  minDisplayTime?: number;
}

/**
 * 页面过渡组件 - 确保加载占位符至少显示一段时间，避免闪烁
 */
export function PageTransition({ 
  children, 
  isLoading, 
  minDisplayTime = 300 
}: PageTransitionProps) {
  const [showContent, setShowContent] = useState(!isLoading);
  const [showLoader, setShowLoader] = useState(isLoading);
  const loadStartTime = useRef(Date.now());
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    if (isLoading) {
      // 开始加载
      loadStartTime.current = Date.now();
      setShowContent(false);
      setShowLoader(true);
    } else {
      // 加载完成，计算是否需要继续显示占位符
      const elapsed = Date.now() - loadStartTime.current;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      if (remaining > 0) {
        // 继续显示占位符，避免闪烁
        const timer = setTimeout(() => {
          setShowLoader(false);
          // 低性能设备：稍微延迟显示内容，让浏览器有时间清理
          const contentDelay = effectiveQuality === 'low' ? 50 : 0;
          setTimeout(() => setShowContent(true), contentDelay);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        // 已经过了最小显示时间，直接切换
        setShowLoader(false);
        setShowContent(true);
      }
    }
  }, [isLoading, minDisplayTime, effectiveQuality]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {showLoader && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50"
          >
            <PageLoader />
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        initial={false}
        animate={{ 
          opacity: showContent ? 1 : 0,
          y: showContent ? 0 : 10
        }}
        transition={{ 
          duration: effectiveQuality === 'low' ? 0.15 : 0.25,
          ease: [0.25, 0.1, 0.25, 1]
        }}
        style={{ 
          visibility: showContent ? 'visible' : 'hidden',
          willChange: effectiveQuality === 'low' ? 'auto' : 'opacity, transform'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * 页面加载占位符
 */
function PageLoader() {
  return (
    <div 
      className="min-h-[50vh] flex flex-col items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 骨架屏内容 */}
      <div className="w-full max-w-4xl px-6 space-y-8">
        {/* 标题占位 */}
        <div className="space-y-4">
          <div 
            className="h-8 rounded w-3/4 animate-pulse"
            style={{ background: 'var(--bg-tertiary)' }}
          />
          <div 
            className="h-4 rounded w-1/2 animate-pulse"
            style={{ background: 'var(--bg-tertiary)' }}
          />
        </div>
        
        {/* 内容占位 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="h-32 rounded-lg animate-pulse"
              style={{ 
                background: 'var(--bg-card)',
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* 加载文字 */}
      <div className="mt-8 flex items-center gap-2">
        <div 
          className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
        <span 
          className="text-sm font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          加载中...
        </span>
      </div>
    </div>
  );
}

/**
 * 智能延迟加载组件 - 等主线程空闲后再渲染复杂内容
 */
interface DeferredRenderProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
  priority?: 'high' | 'normal' | 'low';
}

export function DeferredRender({ 
  children, 
  delay = 0, 
  fallback = null,
  priority = 'normal'
}: DeferredRenderProps) {
  const [shouldRender, setShouldRender] = useState(delay === 0);
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    if (delay === 0) return;

    // 根据性能级别调整延迟
    const actualDelay = effectiveQuality === 'low' 
      ? delay * 1.5 
      : effectiveQuality === 'medium' 
        ? delay * 1.2 
        : delay;

    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    if (priority === 'low' && 'requestIdleCallback' in window) {
      // 低优先级：等主线程空闲
      const idleCallbackId = (window as any).requestIdleCallback(() => {
        timeoutId = setTimeout(() => setShouldRender(true), actualDelay);
      }, { timeout: 2000 });
      
      return () => {
        (window as any).cancelIdleCallback(idleCallbackId);
        clearTimeout(timeoutId);
      };
    } else {
      // 正常优先级：使用 RAF + setTimeout
      rafId = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => setShouldRender(true), actualDelay);
      });

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeoutId);
      };
    }
  }, [delay, priority, effectiveQuality]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * 分块渲染组件 - 将子元素分批渲染，避免一次性渲染过多内容
 */
interface StagedRenderProps {
  children: React.ReactNode[];
  batchSize?: number;
  batchDelay?: number;
  fallback?: React.ReactNode;
}

export function StagedRender({ 
  children, 
  batchSize = 3, 
  batchDelay = 100,
  fallback = null 
}: StagedRenderProps) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    if (visibleCount >= children.length) return;

    // 根据性能调整批次大小和延迟
    const actualBatchSize = effectiveQuality === 'low' 
      ? Math.floor(batchSize * 0.5) 
      : batchSize;
    const actualDelay = effectiveQuality === 'low' 
      ? batchDelay * 1.5 
      : batchDelay;

    const timer = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + actualBatchSize, children.length));
    }, actualDelay);

    return () => clearTimeout(timer);
  }, [visibleCount, children.length, batchSize, batchDelay, effectiveQuality]);

  return (
    <>
      {children.slice(0, visibleCount)}
      {visibleCount < children.length && fallback}
    </>
  );
}

/**
 * 页面准备状态 Hook
 */
export function usePageReady() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { effectiveQuality } = usePerformance();

  const markReady = useCallback(() => {
    setIsLoading(false);
    // 稍微延迟标记为 ready，确保渲染完成
    const delay = effectiveQuality === 'low' ? 100 : 50;
    setTimeout(() => setIsReady(true), delay);
  }, [effectiveQuality]);

  const markLoading = useCallback(() => {
    setIsLoading(true);
    setIsReady(false);
  }, []);

  return { isReady, isLoading, markReady, markLoading };
}
