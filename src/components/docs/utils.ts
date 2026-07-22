import type { TocItem, HeadingAnchor } from './types';

// ==================== ID 生成工具函数 ====================
export const generateHeadingId = (text: string): string => {
  if (!text || !text.trim()) return 'section';
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')           // 空格和下划线替换为连字符
    .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 保留字母、数字、下划线、中文、连字符
    .replace(/^-+|-+$/g, '');          // 移除首尾连字符
};

// 递归提取 React children 中的纯文本
export const extractTextFromChildren = (children: any): string => {
  if (children == null) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (children.props && children.props.children) return extractTextFromChildren(children.props.children);
  return '';
};

// ==================== Markdown 解析 ====================
// 提取所有 heading 作为锚点
export const extractHeadings = (content: string): HeadingAnchor[] => {
  const lines = content.split(/\r?\n/);
  const headings: HeadingAnchor[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(\s{0,3})(#{2,4})\s+(.+)$/);
    if (match) {
      const text = match[3].trim();
      headings.push({
        id: generateHeadingId(text),
        level: match[2].length,
        text
      });
    }
  }
  return headings;
};

// 解析 Markdown 生成目录 - 跳过代码块内的内容
export const parseToc = (content: string): TocItem[] => {
  const lines = content.split(/\r?\n/);
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // 检测代码块开始/结束
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // 跳过代码块内的内容
    if (inCodeBlock) continue;

    // 匹配标题（必须是行首，前面可以有空白）
    const match = line.match(/^(\s{0,3})(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[2].length;
      const text = match[3].trim();
      const id = generateHeadingId(text);
      headings.push({ level, text, id });
    }
  }

  // 构建树形结构
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of headings) {
    const item: TocItem = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  }

  return root;
};

// 分割后的区块，包含解析好的 heading 信息
export interface ContentSection {
  headingLine: string | null;
  headingText: string | null;
  headingId: string | null;
  headingLevel: number | null;
  content: string;
}

// 将内容按标题分割，同时提取 heading 信息用于锚点
export const splitContentByHeadings = (content: string): ContentSection[] => {
  const lines = content.split(/\r?\n/);
  const sections: ContentSection[] = [];
  let currentHeadingLine: string | null = null;
  let currentHeadingText: string | null = null;
  let currentHeadingId: string | null = null;
  let currentHeadingLevel: number | null = null;
  let currentContent: string[] = [];
  let inCodeBlock = false;

  const pushSection = () => {
    if (currentHeadingLine || currentContent.length > 0) {
      sections.push({
        headingLine: currentHeadingLine,
        headingText: currentHeadingText,
        headingId: currentHeadingId,
        headingLevel: currentHeadingLevel,
        content: currentContent.join('\n')
      });
    }
  };

  for (const line of lines) {
    // 代码块检测
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      currentContent.push(line);
      continue;
    }

    // 标题检测（不在代码块内）
    const match = !inCodeBlock ? line.match(/^(\s{0,3})(#{2,4})\s+(.+?)(?:\r)?$/) : null;
    if (match) {
      pushSection();
      currentHeadingLine = line;
      currentHeadingText = match[3].trim();
      currentHeadingId = generateHeadingId(currentHeadingText);
      currentHeadingLevel = match[2].length;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  pushSection();
  return sections;
};
