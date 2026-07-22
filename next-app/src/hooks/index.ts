// 配置相关 hooks
export { useConfig } from './useConfig';
export { useNavigation } from './useNavigation';

// 滚动相关 hooks
export { useScrollProgress, useInView } from './useScrollProgress';

// 交互相关 hooks
export { useMagnetic } from './useMagnetic';

// 响应式 hooks - 统一从 MobileContext 导出
export { useIsMobile, useIsTablet, useIsDesktop, useScreenSize, useMobileContext } from '@/contexts/MobileContext';
// Legacy alias for backwards compatibility
export { useIsMobile as useMobile } from '@/contexts/MobileContext';

// 动画控制 hook
export { useAnimationEnabled } from './useAnimationEnabled';

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


