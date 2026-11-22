import { useState, useEffect } from 'react';

interface ConfigState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// 同一份静态 JSON 常被不同组件重复请求（site-data / playlist 等）。
// 以 URL 为键缓存进行中的 Promise 与结果，失败时移除缓存以便下次重试。
const configCache = new Map<string, Promise<unknown>>();

function loadConfig<T>(url: string): Promise<T> {
  const cached = configCache.get(url);
  if (cached) return cached as Promise<T>;

  const pending = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      return response.json() as Promise<T>;
    })
    .catch((error: unknown) => {
      configCache.delete(url);
      throw error;
    });

  configCache.set(url, pending);
  return pending;
}

export function useConfig<T>(url: string): ConfigState<T> {
  const [state, setState] = useState<ConfigState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });

    loadConfig<T>(url)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [url]);

  return state;
}
