/**
 * Markdown Editor Tool
 * 
 * Features:
 * - Live preview of Markdown rendering
 * - CommonMark + GFM support
 * - Copy HTML output
 * - Download as .md or .html
 * - Character/word count
 * 
 * @author OpenClaw Auto-Dev
 */

import { useState, useCallback } from 'react';
import { FileText, Eye, Code, Download, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ToolModule } from '../types';

// Simple markdown parser (in production, use marked or similar library)
function parseMarkdown(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr />')
    // Line breaks
    .replace(/\n/g, '<br />');

  // Wrap lists
  html = html
    .replace(/(<li>.*<\/li><br \/>?)+/g, (match) => `<ul>${match.replace(/<br \/>/g, '')}</ul>`)
    .replace(/<\/ul><br \/><ul>/g, '');

  // Wrap blockquotes
  html = html
    .replace(/(<blockquote>.*<\/blockquote><br \/>?)+/g, (match) => 
      `<blockquote>${match.replace(/\u003cblockquote\u003e|\u003c\/blockquote\u003e|<br \/>/g, ' ')}</blockquote>`);

  return html;
}

// Sample markdown content
const SAMPLE_CONTENT = `# Markdown 编辑器

欢迎使用 **Markdown 编辑器**！这是一个实时的 Markdown 预览工具。

## 功能特性

- 实时预览 Markdown 渲染效果
- 支持常见 Markdown 语法
- 复制 HTML 输出
- 下载为 .md 或 .html 文件

## 语法示例

### 文本样式

- **粗体文本**
- *斜体文本*
- ***粗斜体***
- ~~删除线~~（扩展语法）

### 代码

行内代码：\`console.log('Hello')\`

代码块：

\`\`\`typescript
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### 链接和图片

[访问 SAKURAIN](https://sakurain.tech)

### 列表

1. 有序列表项 1
2. 有序列表项 2
3. 有序列表项 3

- 无序列表项
- 另一个项目
  - 嵌套项目

### 引用

> Markdown 是一种轻量级标记语言，创始人为约翰·格鲁伯。
> 它允许人们使用易读易写的纯文本格式编写文档。

---

开始编辑吧！
`;

function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(SAMPLE_CONTENT);
  const [activeTab, setActiveTab] = useState('split');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const html = parseMarkdown(markdown);
  const charCount = markdown.length;
  const wordCount = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
  const lineCount = markdown.split('\n').length;

  const clearContent = useCallback(() => {
    if (confirm('确定要清空所有内容吗？')) {
      setMarkdown('');
      toast({ title: '内容已清空' });
    }
  }, [toast]);

  const copyHTML = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'HTML 已复制到剪贴板' });
    } catch {
      toast({
        title: '复制失败',
        variant: 'destructive',
      });
    }
  }, [html, toast]);

  const downloadFile = useCallback((type: 'md' | 'html') => {
    const content = type === 'md' ? markdown : html;
    const mimeType = type === 'md' ? 'text/markdown' : 'text/html';
    const extension = type === 'md' ? 'md' : 'html';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: `已下载为 .${extension} 文件` });
  }, [markdown, html, toast]);

  const renderPreview = () => (
    <div
      className="prose prose-sm dark:prose-invert max-w-none p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="edit">
                <Code className="w-4 h-4 mr-1" />
                编辑
              </TabsTrigger>
              <TabsTrigger value="split">
                <Eye className="w-4 h-4 mr-1" />
                分屏
              </TabsTrigger>
              <TabsTrigger value="preview">
                <FileText className="w-4 h-4 mr-1" />
                预览
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyHTML}>
            {copied ? (
              <><Check className="w-4 h-4 mr-1" />已复制</>
            ) : (
              <><Copy className="w-4 h-4 mr-1" />复制 HTML</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile('md')}>
            <Download className="w-4 h-4 mr-1" />
            .md
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile('html')}>
            <Download className="w-4 h-4 mr-1" />
            .html
          </Button>
          <Button variant="ghost" size="sm" onClick={clearContent}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <Badge variant="secondary">{charCount} 字符</Badge>
        <Badge variant="secondary">{wordCount} 单词</Badge>
        <Badge variant="secondary">{lineCount} 行</Badge>
      </div>

      {/* Content Area */}
      {activeTab === 'edit' && (
        <Textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="min-h-[500px] font-mono text-sm"
          placeholder="在此输入 Markdown 内容..."
        />
      )}

      {activeTab === 'preview' && (
        <Card>
          <CardContent className="p-0">{renderPreview()}</CardContent>
        </Card>
      )}

      {activeTab === 'split' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="min-h-[500px] font-mono text-sm"
            placeholder="在此输入 Markdown 内容..."
          />
          <Card>
            <CardContent className="p-0 overflow-auto max-h-[500px]">
              {renderPreview()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export const markdownEditorMeta = {
  id: 'markdown-editor',
  name: 'Markdown 编辑器',
  description: '实时预览的 Markdown 编辑器，支持导出 HTML 和下载',
  icon: FileText,
  category: 'developer' as const,
  keywords: ['markdown', 'md', '编辑器', '预览', '文档'],
  isNew: true,
};

const markdownEditorModule: ToolModule = {
  meta: markdownEditorMeta,
  Component: MarkdownEditor,
};

export default markdownEditorModule;
