/**
 * Mobile Context - Unified mobile detection for the entire application
 *
 * Design principles:
 * 1. Single source of truth for mobile state
 * 2. CSS-first approach with JS only for dynamic behavior
 * 3. Prevent flash of incorrect content (FOIC) via SSR-safe defaults
 * 4. Performance optimized: single resize listener, debounced updates
 * 5. Hydration safety: SSR and the first client render share the same default
 *    value; real viewport measurements are applied only after mount via effect.
 */

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

const MOBILE_BREAKPOINT = 768;

interface MobileContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  /** True only after the component has mounted on the client. */
  mounted: boolean;
}

/**
 * SSR-safe default value. Both server rendering and the first client render
 * must use identical state so that hydration can succeed. Real viewport data
 * is applied inside useEffect after the component mounts.
 */
const defaultContextValue: MobileContextValue = {
  isMobile: true, // Default to mobile for SSR safety
  isTablet: false,
  isDesktop: false,
  screenWidth: 375,
  screenHeight: 667,
  mounted: false,
};

const MobileContext = createContext<MobileContextValue>(defaultContextValue);

export function MobileProvider({ children }: { children: ReactNode }) {
  // Always start with the SSR-safe default; never read window during render.
  const [state, setState] = useState<MobileContextValue>(defaultContextValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

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
          mounted: true,
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

  const value = useMemo(
    () => ({ ...state, mounted }),
    [state, mounted]
  );

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

/**
 * Returns true after the component has mounted on the client. Use this to gate
 * any render output that must differ between SSR and the client (e.g. viewport
 * dependent visual effects).
 */
export function useMobileMounted(): boolean {
  return useMobileContext().mounted;
}

/**
 * Returns true only when running on the client and the viewport is not mobile.
 * This is the preferred gate for desktop-only JSX such as cursor effects,
 * ambient glows and light beams.
 */
export function useIsDesktopClient(): boolean {
  const { mounted, isMobile } = useMobileContext();
  return mounted && !isMobile;
}
