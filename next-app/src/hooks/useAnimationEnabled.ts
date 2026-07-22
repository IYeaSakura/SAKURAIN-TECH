import { useIsMobile } from '@/contexts/MobileContext';

export function useAnimationEnabled() {
  const isMobile = useIsMobile();
  return !isMobile;
}
