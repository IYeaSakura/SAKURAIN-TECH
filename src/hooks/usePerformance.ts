import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  memory?: number;
  longTasks: number;
}

// 性能监控 hook - 用于开发和生产环境监控
export function usePerformanceMonitor(enabled = false) {
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 0,
    longTasks: 0,
  });
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || import.meta.env.PROD) return;

    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        metricsRef.current.fps = Math.round((frameCountRef.current * 1000) / delta);
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // 如果 FPS 过低，输出警告
        if (metricsRef.current.fps < 30) {
          console.warn(`Low FPS detected: ${metricsRef.current.fps}`);
        }
      }

      rafRef.current = requestAnimationFrame(measureFPS);
    };

    rafRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  // 监听长任务
  useEffect(() => {
    if (!enabled || typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            metricsRef.current.longTasks++;
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      return () => observer.disconnect();
    } catch (e) {
      // 浏览器不支持 longtask 类型
    }
  }, [enabled]);

  return metricsRef;
}

// 使用 requestIdleCallback 或 setTimeout 执行非紧急任务
export function useIdleCallback() {
  const scheduleWork = useCallback((callback: () => void, timeout?: number) => {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback(callback, { timeout });
    } else {
      return setTimeout(callback, timeout || 1);
    }
  }, []);

  const cancelWork = useCallback((id: number) => {
    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  }, []);

  return { scheduleWork, cancelWork };
}

// 虚拟列表 hook - 用于大量数据渲染
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  overscan = 5
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    container.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
  };
}

