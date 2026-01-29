import { useState, useEffect, useCallback, useRef } from 'react';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  isTransitioning: boolean;
  toggleTheme: (event?: React.MouseEvent<HTMLElement>) => void;
}

const THEME_STORAGE_KEY = 'sakurain-theme';

export function useTheme(): ThemeState {
  const [theme, setTheme] = useState<Theme>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const clickPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && (stored === 'light' || stored === 'dark')) {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      // Default to light theme
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = useCallback((event?: React.MouseEvent<HTMLElement>) => {
    if (isTransitioning) return;

    // Store click position for the ripple effect
    if (event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      clickPositionRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    } else {
      // Default to center of screen if no event
      clickPositionRef.current = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }

    setIsTransitioning(true);

    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple';
    ripple.style.cssText = `
      position: fixed;
      top: ${clickPositionRef.current.y}px;
      left: ${clickPositionRef.current.x}px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${newTheme === 'dark' ? '#0a0a0f' : '#ffffff'};
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%) scale(0);
      transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      mix-blend-mode: normal;
    `;

    document.body.appendChild(ripple);

    // Force reflow
    void ripple.offsetHeight;

    // Calculate the maximum distance to cover the entire screen
    const maxDistance = Math.max(
      clickPositionRef.current.x,
      window.innerWidth - clickPositionRef.current.x,
      clickPositionRef.current.y,
      window.innerHeight - clickPositionRef.current.y
    );
    const scale = (maxDistance * 2) / 10;

    // Start the ripple animation
    requestAnimationFrame(() => {
      ripple.style.transform = `translate(-50%, -50%) scale(${scale})`;
    });

    // Switch theme halfway through the animation
    setTimeout(() => {
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }, 400);

    // Clean up after animation
    setTimeout(() => {
      ripple.remove();
      setIsTransitioning(false);
    }, 800);
  }, [theme, isTransitioning]);

  return { theme, isTransitioning, toggleTheme };
}
