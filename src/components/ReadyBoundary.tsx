import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '@/contexts/PerformanceContext';

interface ReadyContextType {
  /** 注册一个需要等待的准备任务 */
  registerTask: (id: string) => void;
  /** 标记任务完成 */
  completeTask: (id: string) => void;
  /** 取消任务 */
  cancelTask: (id: string) => void;
  /** 是否全部就绪 */
  isReady: boolean;
  /** 准备进度 0-1 */
  progress: number;
}

const ReadyContext = createContext<ReadyContextType | null>(null);

export function useReadyContext() {
  const context = useContext(ReadyContext);
  if (!context) {
    throw new Error('useReadyContext must be used within a ReadyBoundary');
  }
  return context;
}

/**
 * 准备边界组件 - 管理页面内异步内容的加载状态
 */
interface ReadyBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minDisplayTime?: number;
  onReady?: () => void;
}

export function ReadyBoundary({ 
  children, 
  fallback,
  minDisplayTime = 200,
  onReady 
}: ReadyBoundaryProps) {
  const [tasks, setTasks] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showContent, setShowContent] = useState(false);
  const [showFallback, setShowFallback] = useState(true);
  const loadStartTime = useRef(Date.now());
  const { effectiveQuality } = usePerformance();

  const registerTask = useCallback((id: string) => {
    setTasks(prev => new Set([...prev, id]));
  }, []);

  const completeTask = useCallback((id: string) => {
    setCompletedTasks(prev => new Set([...prev, id]));
  }, []);

  const cancelTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCompletedTasks(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // 检查是否全部就绪
  const isReady = tasks.size === 0 || tasks.size === completedTasks.size;
  const progress = tasks.size === 0 ? 1 : completedTasks.size / tasks.size;

  // 控制内容显示
  useEffect(() => {
    if (isReady) {
      const elapsed = Date.now() - loadStartTime.current;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      const timer = setTimeout(() => {
        setShowFallback(false);
        // 给浏览器一帧时间来清理
        requestAnimationFrame(() => {
          const delay = effectiveQuality === 'low' ? 50 : 0;
          setTimeout(() => {
            setShowContent(true);
            onReady?.();
          }, delay);
        });
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isReady, minDisplayTime, onReady, effectiveQuality]);

  const value = {
    registerTask,
    completeTask,
    cancelTask,
    isReady,
    progress,
  };

  return (
    <ReadyContext.Provider value={value}>
      <div className="relative">
        <AnimatePresence mode="wait">
          {showFallback && fallback && (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-10"
            >
              {fallback}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={false}
          animate={{
            opacity: showContent ? 1 : 0,
            y: showContent ? 0 : 10,
          }}
          transition={{
            duration: effectiveQuality === 'low' ? 0.15 : 0.25,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          style={{
            visibility: showContent ? 'visible' : 'hidden',
          }}
        >
          {children}
        </motion.div>
      </div>
    </ReadyContext.Provider>
  );
}

/**
 * 准备任务 Hook - 用于组件注册自己的准备状态
 */
interface UseReadyTaskOptions {
  id: string;
  deps?: unknown[];
  ready?: boolean;
}

export function useReadyTask({ id, deps = [], ready = true }: UseReadyTaskOptions) {
  const context = useContext(ReadyContext);
  const { effectiveQuality } = usePerformance();
  
  // 如果不在 ReadyBoundary 内，直接返回 ready
  if (!context) {
    return { isReady: true };
  }

  const { registerTask, completeTask, cancelTask } = context;

  useEffect(() => {
    // 低性能设备：简化准备逻辑
    if (effectiveQuality === 'low') {
      return;
    }

    registerTask(id);
    return () => cancelTask(id);
  }, [id, effectiveQuality]);

  useEffect(() => {
    if (effectiveQuality === 'low') {
      return;
    }

    if (ready) {
      // 稍微延迟标记完成，确保组件已渲染
      const timer = setTimeout(() => {
        completeTask(id);
      }, effectiveQuality === 'medium' ? 50 : 0);
      return () => clearTimeout(timer);
    }
  }, [id, ready, ...deps, effectiveQuality]);

  return { isReady: context.isReady };
}

/**
 * 图片预加载 Hook
 */
export function useImagePreload(src: string | string[]) {
  const [loaded, setLoaded] = useState(false);
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    // 低性能设备：不预加载
    if (effectiveQuality === 'low') {
      setLoaded(true);
      return;
    }

    const sources = Array.isArray(src) ? src : [src];
    let loadedCount = 0;

    const promises = sources.map(source => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          resolve();
        };
        img.onerror = reject;
        img.src = source;
      });
    });

    Promise.all(promises).then(() => {
      setLoaded(true);
    }).catch(() => {
      // 即使出错也标记为加载完成
      setLoaded(true);
    });
  }, [src, effectiveQuality]);

  return loaded;
}

/**
 * 延迟渲染组件 - 等主线程空闲后再渲染复杂内容
 */
interface IdleRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
}

export function IdleRender({ children, fallback = null, timeout = 2000 }: IdleRenderProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    if (effectiveQuality === 'low') {
      // 低性能设备：延迟更久再渲染非关键内容
      const timer = setTimeout(() => setShouldRender(true), 500);
      return () => clearTimeout(timer);
    }

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => {
        setShouldRender(true);
      }, { timeout });
      
      return () => (window as any).cancelIdleCallback(id);
    } else {
      // 不支持 requestIdleCallback 的浏览器
      const timer = setTimeout(() => setShouldRender(true), 200);
      return () => clearTimeout(timer);
    }
  }, [timeout, effectiveQuality]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * 批量渲染组件 - 分批渲染列表项
 */
interface BatchRenderProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  batchSize?: number;
  batchDelay?: number;
  fallback?: React.ReactNode;
}

export function BatchRender<T>({ 
  items, 
  renderItem, 
  batchSize = 3, 
  batchDelay = 50,
  fallback = null 
}: BatchRenderProps<T>) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const { effectiveQuality } = usePerformance();

  useEffect(() => {
    if (visibleCount >= items.length) return;

    // 根据性能调整批次
    const actualBatchSize = effectiveQuality === 'low' 
      ? Math.floor(batchSize * 0.5) 
      : batchSize;
    const actualDelay = effectiveQuality === 'low' 
      ? batchDelay * 2 
      : batchDelay;

    const timer = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + actualBatchSize, items.length));
    }, actualDelay);

    return () => clearTimeout(timer);
  }, [visibleCount, items.length, batchSize, batchDelay, effectiveQuality]);

  return (
    <>
      {items.slice(0, visibleCount).map((item, index) => renderItem(item, index))}
      {visibleCount < items.length && fallback}
    </>
  );
}
