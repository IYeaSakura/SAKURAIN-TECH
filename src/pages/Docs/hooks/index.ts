import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TocItem, HeadingItem } from '../types';

export interface SearchResult {
  type: 'heading' | 'content';
  text: string;
  id?: string;
  lineIndex?: number;  // 行号，用于精确定位
  preview?: string;
}

export function useDocument(path: string) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [flatHeadings, setFlatHeadings] = useState<HeadingItem[]>([]);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${path}?v=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        
        if (!cancelled) {
          setContent(text);
          setLines(text.split('\n'));
          const { toc: parsedToc, headings } = parseToc(text);
          setToc(parsedToc);
          setFlatHeadings(headings);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [path]);

  // 预构建标题行号映射（用于快速查找）
  const headingLineMap = useMemo(() => {
    const map = new Map<string, number>();
    flatHeadings.forEach(h => {
      const lineIndex = lines.findIndex(line => {
        const match = line.match(/^(\s{0,3})(#{1,4})\s+(.+?)(?:\r)?$/);
        return match && match[3].trim() === h.text;
      });
      if (lineIndex >= 0) {
        map.set(h.id, lineIndex);
      }
    });
    return map;
  }, [flatHeadings, lines]);

  // 搜索文档内容 - 优化版本，使用 debounce 和限制结果
  const searchContent = useCallback((query: string, maxResults: number = 20): SearchResult[] => {
    if (!query.trim() || !content || lines.length === 0) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];
    const seen = new Set<string>();
    
    // 限制搜索范围，大文件只搜索前5000行
    const searchLimit = Math.min(lines.length, 5000);

    // 搜索标题（O(1) 查找）
    flatHeadings.forEach((h) => {
      if (results.length >= maxResults) return;
      if (h.text.toLowerCase().includes(lowerQuery)) {
        const lineIndex = headingLineMap.get(h.id) ?? 0;
        const key = `heading-${h.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            type: 'heading',
            text: h.text,
            id: h.id,
            lineIndex
          });
        }
      }
    });

    // 搜索内容（限制结果数）
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 1);
    
    for (let lineIndex = 0; lineIndex < searchLimit && results.length < maxResults; lineIndex++) {
      const line = lines[lineIndex];
      // 快速跳过标题行和短行
      if (line.length < 10 || line.match(/^(\s{0,3})(#{1,4})\s+/)) continue;
      
      const cleanLine = line.trim().toLowerCase();
      // 快速预检查：至少包含一个查询词
      const hasMatch = queryWords.length > 0 
        ? queryWords.some(word => cleanLine.includes(word))
        : cleanLine.includes(lowerQuery);
      
      if (!hasMatch) continue;
      
      // 找到最近的标题（二分查找优化）
      let nearestHeading = flatHeadings[0];
      for (let i = flatHeadings.length - 1; i >= 0; i--) {
        const h = flatHeadings[i];
        const hLineIndex = headingLineMap.get(h.id);
        if (hLineIndex !== undefined && hLineIndex < lineIndex) {
          nearestHeading = h;
          break;
        }
      }
      
      const preview = line.trim().substring(0, 80) + (line.length > 80 ? '...' : '');
      const key = `content-${lineIndex}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          type: 'content',
          text: preview,
          id: nearestHeading?.id,
          lineIndex,
          preview
        });
      }
    }

    return results;
  }, [content, lines, flatHeadings, headingLineMap]);

  // 滚动到指定元素（精确跳转）
  const scrollToElement = useCallback((element: Element, container?: Element | null) => {
    if (!container) return;
    const offset = 100;
    const top = element.getBoundingClientRect().top + container.scrollTop - offset;
    container.scrollTo({ top, behavior: 'smooth' });
  }, []);

  // 滚动到指定行（通过行号找到最近的标题元素）
  const scrollToLine = useCallback((lineIndex: number, containerSelector?: string) => {
    const container = containerSelector 
      ? document.querySelector(containerSelector) 
      : document.querySelector('main');
    
    if (!container) return;

    // 找到目标行之前的所有标题
    let targetHeadingId: string | null = null;
    
    for (let i = 0; i <= Math.min(lineIndex, lines.length - 1); i++) {
      const line = lines[i];
      const match = line.match(/^(\s{0,3})(#{1,4})\s+(.+?)(?:\r)?$/);
      if (match) {
        const text = match[3].trim();
        const heading = flatHeadings.find(h => h.text === text);
        if (heading) {
          targetHeadingId = heading.id;
        }
      }
    }

    // 如果找到了标题，直接滚动到该标题元素
    if (targetHeadingId) {
      const element = document.getElementById(targetHeadingId);
      if (element) {
        scrollToElement(element, container);
        return;
      }
    }

    // 兜底方案：估算元素位置
    const paragraphs = container.querySelectorAll('p, li, h1, h2, h3, h4, pre, blockquote, [data-heading="true"]');
    let elementIndex = 0;
    let currentLine = 0;
    
    for (let i = 0; i < lines.length && currentLine < lineIndex; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (line.match(/^(#{1,4})\s+/)) {
        currentLine++;
        elementIndex++;
      } else if (line.startsWith('```')) {
        currentLine++;
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          currentLine++;
          i++;
        }
        currentLine++;
        elementIndex++;
      } else if (line) {
        currentLine++;
        if (lines[i+1]?.trim() === '') {
          elementIndex++;
        }
      }
    }

    const targetElement = paragraphs[Math.min(elementIndex, paragraphs.length - 1)];
    if (targetElement) {
      scrollToElement(targetElement, container);
    }
  }, [lines, flatHeadings, scrollToElement]);

  // 根据标题 ID 滚动（带持续跳转机制）
  const scrollToHeadingById = useCallback((headingId: string, containerSelector?: string) => {
    const container = containerSelector 
      ? document.querySelector(containerSelector) 
      : document.querySelector('main');
    
    if (!container) return;

    // 获取目标元素
    const getTargetElement = () => document.getElementById(headingId);
    
    // 持续跳转机制：持续滚动直到到达目标或超时
    const startTime = Date.now();
    const maxDuration = 3000; // 最多持续3秒
    const checkInterval = 50; // 每50ms检查一次
    
    // 记录目标位置
    let targetTop: number | null = null;
    let stableCount = 0; // 位置稳定计数
    
    const scrollLoop = () => {
      const element = getTargetElement();
      const elapsed = Date.now() - startTime;
      
      // 超时检查
      if (elapsed > maxDuration) {
        return;
      }
      
      if (element) {
        // 计算目标位置
        const newTargetTop = element.getBoundingClientRect().top + container.scrollTop - 100;
        
        // 如果这是第一次获取目标位置，或者位置变化了，就继续滚动
        if (targetTop === null || Math.abs(newTargetTop - targetTop) > 5) {
          targetTop = newTargetTop;
          stableCount = 0;
          container.scrollTo({ top: targetTop, behavior: 'auto' }); // 使用 auto 避免动画冲突
        } else {
          // 位置稳定了
          stableCount++;
          // 位置稳定且已经滚动到目标附近，停止
          if (stableCount >= 3) {
            return;
          }
        }
        
        // 检查是否已经在视口内
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top >= containerRect.top + 80 && rect.bottom <= containerRect.bottom) {
          return;
        }
      }
      
      // 继续下一轮
      setTimeout(scrollLoop, checkInterval);
    };
    
    // 启动持续跳转
    scrollLoop();
  }, [scrollToElement]);

  return { content, loading, error, toc, flatHeadings, searchContent, scrollToLine, scrollToHeadingById, lines };
}

export function useReadingProgress(chapterId: string) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(`reading-progress-${chapterId}`);
    if (saved) {
      setProgress(parseFloat(saved));
    }
  }, [chapterId]);

  const saveProgress = (value: number) => {
    setProgress(value);
    localStorage.setItem(`reading-progress-${chapterId}`, value.toString());
  };

  return { progress, saveProgress };
}

function parseToc(markdown: string): { toc: TocItem[]; headings: HeadingItem[] } {
  const lines = markdown.split(/\r?\n/);
  const toc: TocItem[] = [];
  const headings: HeadingItem[] = [];
  const stack: TocItem[] = [];

  for (const line of lines) {
    // 匹配 # ## ### #### (h1-h4)，支持可选的前导空格和结尾 \r
    const match = line.match(/^(\s{0,3})(#{1,4})\s+(.+?)(?:\r)?$/);
    if (!match) continue;

    const level = match[2].length;
    const text = match[3].trim();
    const id = generateHeadingId(text);
    
    headings.push({ level, text, id });

    // TOC 只包含 h2-h4
    if (level === 1) continue;
    
    const item: TocItem = { level, text, id, children: [] };

    if (level === 2) {
      toc.push(item);
      stack.length = 0;
      stack.push(item);
    } else if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      if (level === parent.level + 1) {
        parent.children.push(item);
        if (level < 4) stack.push(item);
      } else {
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(item);
          if (level < 4) stack.push(item);
        } else {
          toc.push(item);
          stack.push(item);
        }
      }
    } else {
      toc.push(item);
      stack.push(item);
    }
  }

  return { toc, headings };
}

function generateHeadingId(text: string): string {
  if (!text || !text.trim()) return 'section';
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')           // 空格和下划线替换为连字符
    .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 保留字母、数字、下划线、中文、连字符
    .replace(/^-+|-+$/g, '')          // 移除首尾连字符
    .substring(0, 50) || 'heading';
}
