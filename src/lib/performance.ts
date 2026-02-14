import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

/**
 * 性能优化工具函数库
 */

// ==================== 节流和防抖 ====================

/**
 * 节流函数 - 限制函数执行频率
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 防抖函数 - 延迟执行直到停止触发
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ==================== 动画帧管理 ====================

/**
 * 使用 RAF 进行节流的状态更新
 */
export function useRafState<T>(initialState: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialState);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<T | null>(null);

  const setRafState = useCallback((value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      pendingRef.current = (value as (prev: T) => T)(state);
    } else {
      pendingRef.current = value;
    }

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingRef.current !== null) {
          setState(pendingRef.current);
          pendingRef.current = null;
        }
        rafRef.current = null;
      });
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return [state, setRafState];
}

/**
 * 使用 RAF 的节流回调
 */
export function useRafCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  deps: unknown[] = []
): T {
  const rafRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      callbackRef.current(...args);
    });
  }, deps) as T;
}

// ==================== 视口检测 ====================

/**
 * 检测元素是否在视口内
 */
export function useInView(
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '-50px' }
): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isInView];
}

/**
 * 检测元素是否在视口内 (可切换)
 */
export function useInViewToggle(
  options: IntersectionObserverInit = { threshold: 0 }
): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isInView];
}

/**
 * 检测页面可见性
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

// ==================== 鼠标位置优化 ====================

interface MousePosition {
  x: number;
  y: number;
}

/**
 * 使用节流的鼠标位置跟踪
 */
export function useThrottledMousePosition(throttleMs: number = 16): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastUpdateRef.current < throttleMs) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
        lastUpdateRef.current = now;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [throttleMs]);

  return position;
}

// ==================== 滚动优化 ====================

interface ScrollInfo {
  scrollY: number;
  scrollProgress: number;
  direction: 'up' | 'down' | null;
}

/**
 * 使用 RAF 节流的滚动监听
 */
export function useThrottledScroll(throttleMs: number = 16): ScrollInfo {
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>({
    scrollY: 0,
    scrollProgress: 0,
    direction: null,
  });
  const rafRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();
      if (now - lastUpdateRef.current < throttleMs) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;
        const direction = scrollY > lastScrollRef.current ? 'down' : 'up';

        setScrollInfo({ scrollY, scrollProgress, direction });
        lastScrollRef.current = scrollY;
        lastUpdateRef.current = now;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [throttleMs]);

  return scrollInfo;
}

// ==================== 设备能力检测 ====================

/**
 * 检测设备是否支持减少动画
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * 检测设备是否为低性能设备
 */
export function useIsLowPowerDevice(): boolean {
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    // 检测低性能设备
    const checkLowPower = () => {
      // 检测是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // 检测硬件并发数
      const concurrency = navigator.hardwareConcurrency || 4;
      
      // 检测内存
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
      
      setIsLowPower(isMobile || concurrency < 4 || memory < 4);
    };

    checkLowPower();
  }, []);

  return isLowPower;
}

/**
 * 检测设备是否为移动端（基于屏幕宽度）
 * 用于移动端性能优化，关闭复杂光效
 */
export function useIsMobile(breakpoint: number = 1024): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // 初始检测
    checkMobile();

    // 监听窗口大小变化
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return isMobile;
}

// ==================== FPS 监控和自动降级 ====================

interface FPSMetrics {
  fps: number;
  isLow: boolean;
  averageFps: number;
}

interface FPSMonitorOptions {
  /** 触发降级的 FPS 阈值 */
  lowFPSThreshold?: number;
  /** 检测周期 (帧数) */
  sampleSize?: number;
  /** 降级回调 */
  onLowFPS?: () => void;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 监控 FPS 并自动降级
 */
export function useFPSMonitor(options: FPSMonitorOptions = {}): FPSMetrics {
  const {
    lowFPSThreshold = 30,
    sampleSize = 30,
    onLowFPS,
    enabled = true,
  } = options;

  const [fps, setFps] = useState(60);
  const [isLow, setIsLow] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const lowFPSCountRef = useRef(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let rafId: number;

    const measure = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        
        // 更新 FPS 历史
        fpsHistoryRef.current.push(currentFps);
        if (fpsHistoryRef.current.length > sampleSize) {
          fpsHistoryRef.current.shift();
        }

        // 计算平均 FPS
        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        
        setFps(currentFps);
        setIsLow(avgFps < lowFPSThreshold);

        // 检测持续低帧率
        if (avgFps < lowFPSThreshold) {
          lowFPSCountRef.current++;
          // 连续 3 秒低帧率则触发降级
          if (lowFPSCountRef.current >= 3 && !triggeredRef.current) {
            triggeredRef.current = true;
            onLowFPS?.();
          }
        } else {
          lowFPSCountRef.current = 0;
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, lowFPSThreshold, sampleSize, onLowFPS]);

  const averageFps = useMemo(() => {
    if (fpsHistoryRef.current.length === 0) return fps;
    return Math.round(fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length);
  }, [fps]);

  return { fps, isLow, averageFps };
}

// ==================== 性能监控 ====================

/**
 * 监控 FPS (简化版)
 */
export function useFPS(enabled: boolean = false): number {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    let rafId: number;

    const measure = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  return fps;
}

// ==================== 组件挂载优化 ====================

/**
 * 延迟加载钩子 - 用于非关键组件的延迟加载
 */
export function useDeferredMount(delay: number = 0): boolean {
  const [shouldMount, setShouldMount] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    
    const timer = setTimeout(() => {
      setShouldMount(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return shouldMount;
}

/**
 * 分批加载钩子 - 用于列表项的分批加载
 */
export function useBatchLoad<T>(
  items: T[],
  batchSize: number = 5,
  delay: number = 100
): T[] {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  useEffect(() => {
    if (visibleCount >= items.length) return;

    const timer = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + batchSize, items.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [items.length, visibleCount, batchSize, delay]);

  return items.slice(0, visibleCount);
}

// ==================== CSS 动画优化 ====================

/**
 * 获取性能优化的 CSS transform
 */
export function getOptimizedTransform(transform: string): string {
  return `${transform} translateZ(0)`;
}

/**
 * 创建 will-change 样式
 */
export function getWillChange(property: string): React.CSSProperties {
  return { willChange: property };
}
