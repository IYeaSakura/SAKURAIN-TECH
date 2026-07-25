import { useState, useEffect, useCallback, useRef } from 'react';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  isTransitioning: boolean;
  toggleTheme: (event?: React.MouseEvent<HTMLElement>) => void;
}

const THEME_STORAGE_KEY = 'sakurain-theme';

// 检查浏览器是否支持 View Transition API
const supportsViewTransition = typeof document !== 'undefined' && 
  'startViewTransition' in document;

export function useTheme(): ThemeState {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const clickPositionRef = useRef({ x: 0, y: 0 });
  const rippleRef = useRef<HTMLDivElement | null>(null);

  // 初始化主题
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && (stored === 'light' || stored === 'dark')) {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // 创建涟漪效果 - 使用 CSS 动画替代 JS 动画
  const createRipple = useCallback((x: number, y: number, isDark: boolean) => {
    // 移除之前的涟漪
    if (rippleRef.current) {
      rippleRef.current.remove();
    }

    const colors = isDark 
      ? ['#6366f1', '#8b5cf6', '#06b6d4'] // Indigo, Violet, Cyan for dark
      : ['#f59e0b', '#f97316', '#eab308']; // Amber, Orange, Yellow for light

    // 创建容器
    const container = document.createElement('div');
    container.className = 'theme-ripple-container';
    container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;

    // 主涟漪 - 使用 CSS 动画
    const mainRipple = document.createElement('div');
    mainRipple.className = 'theme-ripple-main';
    mainRipple.style.cssText = `
      position: absolute;
      top: ${y}px;
      left: ${x}px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: radial-gradient(circle, ${colors[0]} 0%, ${colors[1]} 50%, transparent 70%);
      transform: translate(-50%, -50%) scale(0);
      opacity: 0.9;
      animation: theme-ripple-expand 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      will-change: transform, opacity;
    `;

    // 次级涟漪
    const secondaryRipple = document.createElement('div');
    secondaryRipple.className = 'theme-ripple-secondary';
    secondaryRipple.style.cssText = `
      position: absolute;
      top: ${y}px;
      left: ${x}px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid ${colors[2]};
      transform: translate(-50%, -50%) scale(0);
      opacity: 0.7;
      animation: theme-ripple-expand 1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
      will-change: transform, opacity;
    `;

    container.appendChild(mainRipple);
    container.appendChild(secondaryRipple);
    document.body.appendChild(container);
    rippleRef.current = container;

    // 清理
    setTimeout(() => {
      container.style.opacity = '0';
      container.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        container.remove();
        if (rippleRef.current === container) {
          rippleRef.current = null;
        }
      }, 300);
    }, 700);
  }, []);

  const toggleTheme = useCallback(async (event?: React.MouseEvent<HTMLElement>) => {
    if (isTransitioning) return;

    // 获取点击位置
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      clickPositionRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    } else {
      clickPositionRef.current = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }

    setIsTransitioning(true);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const { x, y } = clickPositionRef.current;

    // 添加过渡类 - 使用更长的过渡时间实现丝滑效果
    document.body.classList.add('theme-transitioning');

    // 创建涟漪效果
    createRipple(x, y, newTheme === 'dark');

    // 使用 View Transition API 如果可用
    if (supportsViewTransition && document.startViewTransition) {
      try {
        const transition = document.startViewTransition(() => {
          setTheme(newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        });

        await transition.ready;
        
        // 动画完成后清理
        setTimeout(() => {
          document.body.classList.remove('theme-transitioning');
          setIsTransitioning(false);
        }, 600);
      } catch {
        // 降级到普通切换
        performFallbackTransition(newTheme);
      }
    } else {
      // 降级方案
      performFallbackTransition(newTheme);
    }
  }, [theme, isTransitioning, createRipple]);

  // 降级过渡方案
  const performFallbackTransition = useCallback((newTheme: Theme) => {
    // 短暂延迟让涟漪动画开始
    setTimeout(() => {
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }, 100);

    // 清理
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 800);
  }, []);

  return { theme, isTransitioning, toggleTheme };
}
