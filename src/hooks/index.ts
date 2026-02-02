// 配置相关 hooks
export { useConfig } from './useConfig';

// 滚动相关 hooks
export { useScrollProgress, useInView } from './useScrollProgress';

// 交互相关 hooks
export { useMagnetic } from './useMagnetic';
export { useLenis, scrollTo } from './useLenis';

// 响应式 hooks
export { useWindowSize, useIsMobile, useIsTablet, useIsDesktop } from './useWindowSize';
// use-mobile hook 导出的是 useIsMobile
export { useIsMobile as useMobile } from './use-mobile';

// 主题相关 hooks
export { useTheme } from './useTheme';

// 性能相关 hooks - 优先从 lib/performance 导出
export {
  // 基础性能 hooks
  usePrefersReducedMotion,
  usePageVisibility,
  useThrottledMousePosition,
  useThrottledScroll,
  useIsLowPowerDevice,
  useFPSMonitor,
  useInView as useIntersectionObserver,
  
  // 工具函数
  throttle,
  debounce,
} from '@/lib/performance';

// 保留原有的性能 hooks 以兼容旧代码
export {
  usePerformanceMonitor,
  useIdleCallback,
  useVirtualList
} from './usePerformance';
