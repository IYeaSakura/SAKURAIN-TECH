import { useState, useEffect, useRef, useCallback } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

// 防抖函数 - 减少 resize 事件触发频率
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function useWindowSize(debounceMs = 200): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  // 使用 ref 存储最新的尺寸，避免频繁触发重渲染
  const sizeRef = useRef(windowSize);

  const debouncedSetSize = useCallback(
    debounce((newSize: WindowSize) => {
      setWindowSize(newSize);
    }, debounceMs),
    [debounceMs]
  );

  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      sizeRef.current = newSize;
      debouncedSetSize(newSize);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedSetSize]);

  return windowSize;
}

export function useIsMobile(): boolean {
  const { width } = useWindowSize(300);
  return width < 768;
}

export function useIsTablet(): boolean {
  const { width } = useWindowSize(300);
  return width >= 768 && width < 1024;
}

export function useIsDesktop(): boolean {
  const { width } = useWindowSize(300);
  return width >= 1024;
}
