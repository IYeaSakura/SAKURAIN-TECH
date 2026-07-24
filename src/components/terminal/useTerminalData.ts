/**
 * useTerminalData — load the JSON indexes needed by terminal mode.
 *
 * Fetches /data/blog.json, /data/notes.json, /data/docs.json and
 * /data/site-data.json once on mount. These are static files generated at
 * build time, so the terminal can browse content without SSR.
 */

'use client';

import { useEffect, useState } from 'react';
import type { TerminalData } from './types';

export function useTerminalData(): TerminalData {
  const [data, setData] = useState<TerminalData>({
    blog: null,
    notes: null,
    docs: null,
    site: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [blogRes, notesRes, docsRes, siteRes] = await Promise.all([
          fetch('/data/blog.json'),
          fetch('/data/notes.json'),
          fetch('/data/docs.json'),
          fetch('/data/site-data.json'),
        ]);

        const [blog, notes, docs, site] = await Promise.all([
          blogRes.ok ? blogRes.json() : null,
          notesRes.ok ? notesRes.json() : null,
          docsRes.ok ? docsRes.json() : null,
          siteRes.ok ? siteRes.json() : null,
        ]);

        if (mounted) {
          setData({ blog, notes, docs, site, loading: false });
        }
      } catch (error) {
        console.error('[Terminal] failed to load content indexes:', error);
        if (mounted) {
          setData((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return data;
}
