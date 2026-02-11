import { useIsMobile } from './use-mobile';

export function useAnimationEnabled() {
  const isMobile = useIsMobile();
  return !isMobile;
}
