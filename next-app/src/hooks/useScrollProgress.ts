import { useState, useEffect, useRef, type RefObject } from 'react';

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current !== null) return;
      
      rafId.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0;
        
        if (Math.abs(scrollTop - lastScrollY.current) > 1) {
          setProgress(Math.min(Math.max(scrollProgress, 0), 1));
          lastScrollY.current = scrollTop;
        }
        
        rafId.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return progress;
}

export function useInView(
  elementRef: RefObject<Element | null>,
  options: IntersectionObserverInit = { threshold: 0.2, rootMargin: '0px' }
) {
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasAnimated(true);
        } else if (!hasAnimated) {
          setIsInView(false);
        }
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options, hasAnimated]);

  return isInView;
}
