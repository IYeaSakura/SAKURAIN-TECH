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

export interface ArchiveData {
  [yearMonth: string]: ArchivePost[];
}

export function useBlogArchive() {
  const [data, setData] = useState<ArchiveData>({});
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
    async function fetchMonthArchive() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/blog/index-${yearMonth}.json`);
        if (!response.ok) {
          throw new Error('Failed to fetch month archive data');
        }

        const monthData = await response.json();
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
