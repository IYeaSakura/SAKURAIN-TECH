/**
 * Mobile Context - Unified mobile detection for the entire application
 * 
 * Design principles:
 * 1. Single source of truth for mobile state
 * 2. CSS-first approach with JS only for dynamic behavior
 * 3. Prevent flash of incorrect content (FOIC) via inline script
 * 4. Performance optimized: single resize listener, debounced updates
 */

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

const MOBILE_BREAKPOINT = 768;

interface MobileContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

const defaultContextValue: MobileContextValue = {
  isMobile: true, // Default to mobile for SSR safety
  isTablet: false,
  isDesktop: false,
  screenWidth: 375,
  screenHeight: 667,
};

const MobileContext = createContext<MobileContextValue>(defaultContextValue);

export function MobileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MobileContextValue>(() => {
    // Check for pre-rendered value from inline script
    if (typeof window !== 'undefined') {
      const stored = (window as Window & { __MOBILE_STATE__?: MobileContextValue }).__MOBILE_STATE__;
      if (stored) {
        return stored;
      }
      // Fallback: compute on first render
      const width = window.innerWidth;
      const height = window.innerHeight;
      return {
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < 1024,
        isDesktop: width >= 1024,
        screenWidth: width,
        screenHeight: height,
      };
    }
    return defaultContextValue;
  });

  useEffect(() => {
    let rafId: number | null = null;
    let ticking = false;

    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState(prev => {
        // Only update if values changed
        if (prev.screenWidth === width && prev.screenHeight === height) {
          return prev;
        }
        return {
          isMobile: width < MOBILE_BREAKPOINT,
          isTablet: width >= MOBILE_BREAKPOINT && width < 1024,
          isDesktop: width >= 1024,
          screenWidth: width,
          screenHeight: height,
        };
      });
      ticking = false;
    };

    const handleResize = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(updateState);
        ticking = true;
      }
    };

    // Initial update
    updateState();

    // Listen for resize with RAF throttling
    window.addEventListener('resize', handleResize, { passive: true });

    // Listen for orientation change
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobileContext(): MobileContextValue {
  const context = useContext(MobileContext);
  if (!context) {
    console.warn('useMobileContext must be used within MobileProvider');
    return defaultContextValue;
  }
  return context;
}

// Convenience hooks
export function useIsMobile(): boolean {
  return useMobileContext().isMobile;
}

export function useIsTablet(): boolean {
  return useMobileContext().isTablet;
}

export function useIsDesktop(): boolean {
  return useMobileContext().isDesktop;
}

export function useScreenSize(): { width: number; height: number } {
  const { screenWidth, screenHeight } = useMobileContext();
  return { width: screenWidth, height: screenHeight };
}
