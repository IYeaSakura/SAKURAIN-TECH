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
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = useCallback((event?: React.MouseEvent<HTMLElement>) => {
    if (isTransitioning) return;

    // Get click position
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

    // Add transitioning class for smooth color transitions
    document.body.classList.add('theme-transitioning');

    // Create multiple ripple effects for richer visual feedback
    const colors = newTheme === 'dark' 
      ? ['#6366f1', '#8b5cf6', '#06b6d4'] // Indigo, Violet, Cyan for dark
      : ['#2563eb', '#7c3aed', '#0891b2']; // Blue, Purple, Cyan for light

    // Create main ripple
    const mainRipple = document.createElement('div');
    mainRipple.className = 'theme-ripple-main';
    mainRipple.style.cssText = `
      position: fixed;
      top: ${clickPositionRef.current.y}px;
      left: ${clickPositionRef.current.x}px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${colors[0]};
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.8;
      transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease;
      box-shadow: 
        0 0 30px ${colors[0]}80,
        0 0 60px ${colors[0]}40,
        0 0 90px ${colors[0]}20;
    `;
    document.body.appendChild(mainRipple);

    // Create secondary ripples
    const secondaryRipples = colors.slice(1).map((color, i) => {
      const ripple = document.createElement('div');
      ripple.className = 'theme-ripple-secondary';
      ripple.style.cssText = `
        position: fixed;
        top: ${clickPositionRef.current.y}px;
        left: ${clickPositionRef.current.x}px;
        width: ${8 + i * 4}px;
        height: ${8 + i * 4}px;
        border-radius: 50%;
        background: transparent;
        border: 2px solid ${color};
        pointer-events: none;
        z-index: ${9998 - i};
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.6;
        transition: transform ${0.8 + i * 0.2}s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                    opacity ${0.4 + i * 0.1}s ease;
      `;
      document.body.appendChild(ripple);
      return ripple;
    });

    // Animate ripples
    requestAnimationFrame(() => {
      mainRipple.style.transform = 'translate(-50%, -50%) scale(8)';
      mainRipple.style.opacity = '0';
      
      secondaryRipples.forEach((ripple) => {
        ripple.style.transform = 'translate(-50%, -50%) scale(12)';
        ripple.style.opacity = '0';
      });
    });

    // Switch theme quickly for smooth transition
    setTimeout(() => {
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }, 100);

    // Cleanup
    setTimeout(() => {
      mainRipple.remove();
      secondaryRipples.forEach(r => r.remove());
      document.body.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 1000);
  }, [theme, isTransitioning]);

  return { theme, isTransitioning, toggleTheme };
}
