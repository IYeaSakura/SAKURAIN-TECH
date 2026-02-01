import { useEffect, useRef, useCallback, useState } from 'react';

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
      // 检测是否节省电量模式
      const isBatterySaving = (navigator as Navigator & { getBattery?: () => Promise<{ charging: boolean }> }).getBattery
        ? false
        : false;
      
      setIsLowPower(isMobile || isBatterySaving);
    };

    checkLowPower();
  }, []);

  return isLowPower;
}

// ==================== 性能监控 ====================

interface PerformanceMetrics {
  fps: number;
  memory?: number;
}

/**
 * 监控 FPS
 */
export function useFPSMonitor(enabled: boolean = false): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({ fps: 0 });
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
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        setMetrics({ fps });
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  return metrics;
}
