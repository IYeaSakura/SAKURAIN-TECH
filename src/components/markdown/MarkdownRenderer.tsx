import { useState, useEffect, useMemo, memo, useRef, Children, cloneElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { PlantUML } from './PlantUML';
import { CodeBlock } from './CodeBlock';
import { ClickableImage } from './ImageModal';
import { extractTextFromChildren, generateHeadingId, splitContentByHeadings } from '@/components/docs/utils';
import type { HeadingAnchor } from '@/components/docs/types';
import '@/styles/code-block.css';

// 注意：不要再通过 components 映射 `math` 标签——rehype-katex 输出的 KaTeX HTML 中，
// 视觉隐藏的 .katex-mathml 子树以原生 <math> 元素为根；用自定义组件覆盖 `math` 会
// 破坏 MathML 命名空间上下文（导致 <mi>/<mo> 等报 "unrecognized tag"），且若该组件
// 渲染 <div> 还会造成 <p> 内非法嵌套。display 公式的横向滚动由 code-block.css 中
// .katex-display 的 overflow-x 规则负责。

// ==================== 共享渲染辅助 ====================
// 判断 child 是否为 markdown 图片（或仅包裹图片的链接）。
// react-markdown v10 会把 hast 节点挂在自定义组件元素的 props.node 上。
const isImageElement = (child: any): boolean => {
  if (!child || typeof child !== 'object' || !child.props) return false;
  const tagName = child.props.node?.tagName;
  if (tagName === 'img') return true;
  if (tagName === 'a') return isImageOnlyChildren(child.props.children);
  return false;
};

// 段落 children 是否仅包含图片（忽略纯空白文本节点）
const isImageOnlyChildren = (children: any): boolean => {
  const items = Children.toArray(children).filter(
    (c) => !(typeof c === 'string' && c.trim() === '')
  );
  return items.length > 0 && items.every(isImageElement);
};

// 自定义段落：内容仅为图片时不包裹 <p>——图片 wrapper 是块级元素，
// 嵌入 <p> 属于非法嵌套，会触发 React 水合错误（div-in-p）。
const MarkdownParagraph = ({ children }: { children?: any }) => {
  if (isImageOnlyChildren(children)) return <>{children}</>;
  return <p className="my-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</p>;
};

// 表格单元格 children 处理：将 <br> 转换为换行符以配合 whitespace-pre-line。
// 必须用 cloneElement 递归保留元素树结构，不能用 flatMap 拍平——拍平会把
// KaTeX 渲染出的多棵 span/math 子树合并为同级数组，hast-util-to-jsx-runtime
// 在各子树内部生成的 key（span-0、math-0 等）随之重复，触发 React 重复 key 警告。
const processCellChildren = (children: any): any =>
  Children.map(children, (child: any) => {
    if (child == null || typeof child !== 'object') return child;
    if (child.type === 'br') return '\n';
    if (child.props?.children != null) {
      return cloneElement(child, undefined, processCellChildren(child.props.children));
    }
    return child;
  });

const MarkdownTh = ({ children }: { children?: any }) => (
  <th className="border px-4 py-3 text-left font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{children}</th>
);

const MarkdownTd = ({ children }: { children?: any }) => (
  <td className="border px-4 py-3 whitespace-pre-line" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{processCellChildren(children)}</td>
);

// Heading Anchor Component - rendered immediately with math support
const HeadingAnchorElement = memo(({ heading }: { heading: HeadingAnchor }) => {
  const className = `font-bold scroll-mt-28 ${
    heading.level === 2 ? 'text-2xl mt-10 mb-4' :
    heading.level === 3 ? 'text-xl mt-8 mb-3' :
    'text-lg mt-6 mb-3'
  }`;

  // 使用 ReactMarkdown 渲染标题内容，支持数学公式
  const renderHeadingContent = () => (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm, remarkMath]} 
      rehypePlugins={[[rehypeKatex, { strict: false }]]}
      components={{
        p: ({ children }: any) => <>{children}</>,  // 移除 p 标签包装
      } as any}
    >
      {heading.text}
    </ReactMarkdown>
  );

  if (heading.level === 2) {
    return <h2 id={heading.id} data-heading="true" className={className} style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{renderHeadingContent()}</h2>;
  } else if (heading.level === 3) {
    return <h3 id={heading.id} data-heading="true" className={className} style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{renderHeadingContent()}</h3>;
  } else {
    return <h4 id={heading.id} data-heading="true" className={className} style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{renderHeadingContent()}</h4>;
  }
});
HeadingAnchorElement.displayName = 'HeadingAnchorElement';

// Content-only components (no headings, to avoid duplicates)
const contentOnlyComponents = {
  p: MarkdownParagraph,
  ul: ({ children }: { children?: any }) => <ul className="my-4 ml-6 list-disc" style={{ color: 'var(--text-secondary)' }}>{children}</ul>,
  ol: ({ children }: { children?: any }) => <ol className="my-4 ml-6 list-decimal" style={{ color: 'var(--text-secondary)' }}>{children}</ol>,
  li: ({ children }: { children?: any }) => <li className="my-1">{children}</li>,
  a: ({ href, children }: { href?: string; children?: any }) => <a href={href} className="underline hover:no-underline transition" style={{ color: 'var(--accent-primary)' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: ({ inline, className, children }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    if (language === 'plantuml' || codeString.includes('@startuml')) {
      return <PlantUML code={codeString} />;
    }
    if (inline) return <code className="inline-code">{children}</code>;
    if (language) return <CodeBlock language={language} value={codeString} />;
    return <CodeBlock language="text" value={codeString} />;
  },
  table: ({ children }: { children?: any }) => <div className="overflow-x-auto my-6 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}><table className="min-w-full border" style={{ borderColor: 'var(--border-color)' }}>{children}</table></div>,
  thead: ({ children }: { children?: any }) => <thead style={{ background: 'var(--bg-secondary)' }}>{children}</thead>,
  th: MarkdownTh,
  td: MarkdownTd,
  blockquote: ({ children }: { children?: any }) => <blockquote className="border-l-4 pl-4 my-6 py-3 pr-4 rounded-r" style={{ borderColor: 'var(--accent-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{children}</blockquote>,
  hr: () => <hr className="my-8" style={{ borderColor: 'var(--border-color)' }} />,
  img: ({ src, alt }: { src?: string | Blob; alt?: string }) => <ClickableImage src={typeof src === 'string' ? src : undefined} alt={alt} />,
};

// Content Chunk - lazy rendered (uses contentOnlyComponents to avoid duplicate headings)
const ContentChunk = memo(({ content, index }: { content: string; index: number }) => {
  const [shouldRender, setShouldRender] = useState(index < 3);
  const chunkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldRender) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setShouldRender(true); },
      { rootMargin: '300px 0px', threshold: 0 }
    );
    if (chunkRef.current) observer.observe(chunkRef.current);
    return () => observer.disconnect();
  }, [shouldRender, index]);

  return (
    <div ref={chunkRef} className="min-h-[20px]">
      {shouldRender ? (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={finalContentOnlyComponents}>{content}</ReactMarkdown>
      ) : (
        <div className="py-4" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} />
        </div>
      )}
    </div>
  );
});
ContentChunk.displayName = 'ContentChunk';

// Markdown Components
const MarkdownH2 = ({ children }: { children?: any }) => {
  const text = extractTextFromChildren(children);
  const id = generateHeadingId(text);
  return <h2 id={id} data-heading="true" className="text-2xl font-bold mt-10 mb-4 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{children}</h2>;
};

const MarkdownH3 = ({ children }: { children?: any }) => {
  const text = extractTextFromChildren(children);
  const id = generateHeadingId(text);
  return <h3 id={id} data-heading="true" className="text-xl font-semibold mt-8 mb-3 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{children}</h3>;
};

const MarkdownH4 = ({ children }: { children?: any }) => {
  const text = extractTextFromChildren(children);
  const id = generateHeadingId(text);
  return <h4 id={id} data-heading="true" className="text-lg font-semibold mt-6 mb-3 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{children}</h4>;
};

const MarkdownCode = ({ inline, className, children }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  if (language === 'plantuml' || codeString.includes('@startuml')) return <PlantUML code={codeString} />;
  if (inline) return <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>{children}</code>;
  if (language) return <CodeBlock language={language} value={codeString} />;
  return <CodeBlock language="text" value={codeString} />;
};

const MarkdownH1 = ({ children }: { children?: any }) => {
  const text = extractTextFromChildren(children);
  const id = generateHeadingId(text);
  return <h1 id={id} data-heading="true" className="text-3xl font-bold mt-12 mb-6 scroll-mt-28" style={{ color: 'var(--text-primary)', scrollMarginTop: '7rem' }}>{children}</h1>;
};

const markdownComponents = {
  h1: MarkdownH1,
  h2: MarkdownH2,
  h3: MarkdownH3,
  h4: MarkdownH4,
  p: MarkdownParagraph,
  ul: ({ children }: { children?: any }) => <ul className="my-4 ml-6 list-disc" style={{ color: 'var(--text-secondary)' }}>{children}</ul>,
  ol: ({ children }: { children?: any }) => <ol className="my-4 ml-6 list-decimal" style={{ color: 'var(--text-secondary)' }}>{children}</ol>,
  li: ({ children }: { children?: any }) => <li className="my-1">{children}</li>,
  a: ({ href, children }: { href?: string; children?: any }) => <a href={href} className="underline hover" style={{ color: 'var(--accent-primary)' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: MarkdownCode,
  table: ({ children }: { children?: any }) => <div className="overflow-x-auto my-6 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}><table className="min-w-full border" style={{ borderColor: 'var(--border-color)' }}>{children}</table></div>,
  thead: ({ children }: { children?: any }) => <thead style={{ background: 'var(--bg-secondary)' }}>{children}</thead>,
  th: MarkdownTh,
  td: MarkdownTd,
  blockquote: ({ children }: { children?: any }) => <blockquote className="border-l-4 pl-4 my-6 py-3 pr-4 rounded-r" style={{ borderColor: 'var(--accent-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{children}</blockquote>,
  hr: () => <hr className="my-8" style={{ borderColor: 'var(--border-color)' }} />,
  img: ({ src, alt }: { src?: string | Blob; alt?: string }) => <ClickableImage src={typeof src === 'string' ? src : undefined} alt={alt} />,
};

// Wrapper for pre elements to ensure horizontal scroll
const PreBlock = ({ children }: { children?: any }) => {
  return (
    <div className="overflow-x-auto my-4 rounded-xl" style={{ maxWidth: '100%' }}>
      {children}
    </div>
  );
};



// Update components to include pre wrapper
const finalMarkdownComponents = {
  ...markdownComponents,
  pre: PreBlock
};

const finalContentOnlyComponents = {
  ...contentOnlyComponents,
  pre: PreBlock
};

// Optimized Markdown Renderer
interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const sections = useMemo(() => splitContentByHeadings(content), [content]);

  // Small file: render directly
  if (content.length < 10000 || sections.length < 5) {
    return (
      <div className="markdown-body" style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={finalMarkdownComponents}>{content}</ReactMarkdown>
      </div>
    );
  }

  // Large file: render headings immediately, content lazily
  return (
    <div className="markdown-body" style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}>
      {sections.map((section, index) => (
        <div key={index}>
          {section.headingId && section.headingText && section.headingLevel && (
            <HeadingAnchorElement
              heading={{
                id: section.headingId,
                level: section.headingLevel,
                text: section.headingText
              }}
            />
          )}
          <ContentChunk content={section.content || ' '} index={index} />
        </div>
      ))}
    </div>
  );
};

export { markdownComponents, finalMarkdownComponents, finalContentOnlyComponents };
