import { useState, useEffect } from 'react';
import type {
  ThemeConfig,
  SiteConfig,
  HeroContent,
  StatsConfig,
  ServicesConfig,
  TechStackConfig,
  PricingConfig,
  ProcessConfig,
  CasesConfig,
  NavigationConfig,
} from '@/types';

interface ConfigState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useConfig<T>(url: string): ConfigState<T> {
  const [state, setState] = useState<ConfigState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const data = await response.json();
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    fetchConfig();
  }, [url]);

  return state;
}

export function useThemeConfig() {
  return useConfig<ThemeConfig>('/data/theme.json');
}

export function useSiteConfig() {
  return useConfig<SiteConfig>('/data/site.json');
}

export function useHeroConfig() {
  return useConfig<HeroContent>('/data/hero.json');
}

export function useStatsConfig() {
  return useConfig<StatsConfig>('/data/stats.json');
}

export function useServicesConfig() {
  return useConfig<ServicesConfig>('/data/services.json');
}

export function useTechStackConfig() {
  return useConfig<TechStackConfig>('/data/tech-stack.json');
}

export function useTechMatrixConfig() {
  return useConfig<any>('/data/tech-matrix.json');
}

export function usePricingConfig() {
  return useConfig<PricingConfig>('/data/pricing.json');
}

export function useProcessConfig() {
  return useConfig<ProcessConfig>('/data/process.json');
}

export function useCasesConfig() {
  return useConfig<CasesConfig>('/data/cases.json');
}

export function useNavigationConfig() {
  return useConfig<NavigationConfig>('/data/navigation.json');
}
