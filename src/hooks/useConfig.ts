import { useState, useEffect } from 'react';

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
