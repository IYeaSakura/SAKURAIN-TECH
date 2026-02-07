import type { BlogPost, BlogIndex } from './types';

export async function getBlogIndex(): Promise<BlogIndex> {
  const response = await fetch('/blog/index.json');
  return response.json();
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`/blog/posts/${slug}.md`);
    if (!response.ok) return null;
    
    const text = await response.text();
    const { metadata, content } = parseMarkdownFrontmatter(text);
    
    return {
      slug,
      title: metadata.title || '',
      description: metadata.description || '',
      date: metadata.date || '',
      author: metadata.author || '',
      tags: metadata.tags || [],
      cover: metadata.cover || '',
      featured: metadata.featured || false,
      content,
    };
  } catch (error) {
    console.error(`Failed to load blog post: ${slug}`, error);
    return null;
  }
}

function parseMarkdownFrontmatter(text: string): { metadata: Partial<BlogPost>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = text.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, content: text };
  }
  
  const frontmatterText = match[1];
  const content = match[2];
  const metadata: Partial<BlogPost> = {};
  
  const lines = frontmatterText.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    
    if (key === 'tags') {
      metadata.tags = value.split(',').map(tag => tag.trim());
    } else if (key === 'featured') {
      metadata.featured = value === 'true';
    } else if (key === 'title') {
      metadata.title = value;
    } else if (key === 'description') {
      metadata.description = value;
    } else if (key === 'date') {
      metadata.date = value;
    } else if (key === 'author') {
      metadata.author = value;
    } else if (key === 'cover') {
      metadata.cover = value;
    }
  }
  
  return { metadata, content };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 月前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} 分钟阅读`;
}
