import { useState, useEffect } from 'react';

export interface ArchivePost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  cover: string;
  featured: boolean;
}

export interface ArchiveList {
  months: string[];
  postsByDate?: Record<string, number>;
}

const monthCache = new Map<string, ArchivePost[]>();

export function useBlogArchive() {
  const [data, setData] = useState<ArchiveList>({ months: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArchive() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/blog/archive.json');
        if (!response.ok) {
          throw new Error('Failed to fetch archive data');
        }

        const archiveData = await response.json();
        setData(archiveData);
      } catch (err) {
        console.error('Failed to load blog archive:', err);
        setError('加载归档数据失败');
      } finally {
        setLoading(false);
      }
    }

    fetchArchive();
  }, []);

  return { data, loading, error };
}

export function useMonthArchive(yearMonth: string) {
  const [data, setData] = useState<ArchivePost[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!yearMonth) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchMonthArchive() {
      try {
        setLoading(true);
        setError(null);

        if (monthCache.has(yearMonth)) {
          setData(monthCache.get(yearMonth)!);
          setLoading(false);
          return;
        }

        const response = await fetch(`/blog/archives/index-${yearMonth}.json`);
        if (!response.ok) {
          throw new Error('Failed to fetch month archive data');
        }

        const monthData = await response.json();
        monthCache.set(yearMonth, monthData);
        setData(monthData);
      } catch (err) {
        console.error(`Failed to load blog archive for ${yearMonth}:`, err);
        setError(`加载 ${yearMonth} 归档数据失败`);
      } finally {
        setLoading(false);
      }
    }

    fetchMonthArchive();
  }, [yearMonth]);

  return { data, loading, error };
}

export function useMultipleMonthArchives(months: string[]) {
  const [data, setData] = useState<ArchivePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMultipleArchives() {
      try {
        setLoading(true);
        setError(null);
        
        const allPosts: ArchivePost[] = [];
        const monthsToFetch = months.filter(month => !monthCache.has(month));
        
        for (const month of monthsToFetch) {
          try {
            const response = await fetch(`/blog/archives/index-${month}.json`);
            if (response.ok) {
              const monthData = await response.json();
              monthCache.set(month, monthData);
              allPosts.push(...monthData);
            }
          } catch (err) {
            console.error(`Failed to load blog archive for ${month}:`, err);
          }
        }
        
        for (const month of months) {
          if (monthCache.has(month) && !monthsToFetch.includes(month)) {
            allPosts.push(...monthCache.get(month)!);
          }
        }
        
        setData(allPosts);
      } catch (err) {
        console.error('Failed to load multiple blog archives:', err);
        setError('加载归档数据失败');
      } finally {
        setLoading(false);
      }
    }

    if (months.length > 0) {
      fetchMultipleArchives();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [months]);

  return { data, loading, error };
}
