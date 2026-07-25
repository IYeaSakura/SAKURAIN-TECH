/**
 * 博客展示层纯函数工具（格式化/统计）。
 * Phase 2 起，文章数据由服务端内容管线 @/lib/content/blog 提供，
 * 原有的客户端 fetch + 手写 frontmatter 解析已移除。
 */

export function formatDate(dateString: string, locale: 'en' | 'zh' = 'zh'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return locale === 'en' ? 'Today' : '今天';
  if (days === 1) return locale === 'en' ? 'Yesterday' : '昨天';
  if (days < 7) return locale === 'en' ? `${days} days ago` : `${days} 天前`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return locale === 'en' ? `${weeks} weeks ago` : `${weeks} 周前`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return locale === 'en' ? `${months} months ago` : `${months} 月前`;
  }

  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateCard(dateString: string): string {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

export function formatDateDetail(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function getReadingTime(content: string): number {
  const chineseCharsPerMinute = 400;
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  return Math.ceil(chineseChars / chineseCharsPerMinute);
}

export function getWordCount(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}
