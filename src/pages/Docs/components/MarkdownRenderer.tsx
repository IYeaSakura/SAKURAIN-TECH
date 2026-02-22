import { useState, useEffect, useMemo, memo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { PlantUML } from './PlantUML';
import { CodeBlock } from './CodeBlock';
import { ClickableImage } from './ImageModal';
import { extractTextFromChildren, generateHeadingId, splitContentByHeadings } from '../utils';
import type { HeadingAnchor } from '../types';
import '../../../styles/code-block.css';

// Wrapper for math elements to ensure horizontal scroll without affecting layout
const MathBlock = ({ children }: { children?: any }) => {
  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden', margin: 0, padding: 0, border: 'none', backgroundColor: 'transparent' }}>
      <div style={{ whiteSpace: 'nowrap' }}>
        {children}
      </div>
    </div>
  );
};

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
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }: any) => <>{children}</>,  // 移除 p 标签包装
        math: MathBlock as any,
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
  p: ({ children }: any) => <p className="my-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</p>,
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
  th: ({ children }: { children?: any }) => <th className="border px-4 py-3 text-left font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{children}</th>,
  td: ({ children }: { children?: any }) => {
    const processCellChildren = (child: any): any => {
      if (typeof child === 'string') return child;
      if (Array.isArray(child)) {
        return child.flatMap((c: any) => {
          if (c?.type === 'br') return '\n';
          // 保留 math 元素，不递归处理
          if (c?.type === 'math' || c?.type?.name === 'MathBlock') return c;
          if (typeof c === 'object' && c?.props?.children) return processCellChildren(c.props.children);
          return c;
        });
      }
      if (child?.type === 'br') return '\n';
      // 保留 math 元素
      if (child?.type === 'math' || child?.type?.name === 'MathBlock') return child;
      return child;
    };
    return <td className="border px-4 py-3 whitespace-pre-line" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{processCellChildren(children)}</td>;
  },
  blockquote: ({ children }: { children?: any }) => <blockquote className="border-l-4 pl-4 my-6 py-3 pr-4 rounded-r" style={{ borderColor: 'var(--accent-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{children}</blockquote>,
  hr: () => <hr className="my-8" style={{ borderColor: 'var(--border-color)' }} />,
  img: ({ src, alt }: { src?: string; alt?: string }) => <ClickableImage src={src} alt={alt} />,
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
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={finalContentOnlyComponentsWithMath}>{content}</ReactMarkdown>
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

// Process table cell children to handle <br /> while preserving math elements
const processCellChildren = (child: any): any => {
  if (typeof child === 'string') return child;
  if (Array.isArray(child)) {
    return child.flatMap((c) => {
      if (c?.type === 'br') return '\n';
      // 保留 math 元素，不递归处理
      if (c?.type === 'math' || c?.type?.name === 'MathBlock') return c;
      if (typeof c === 'object' && c?.props?.children) return processCellChildren(c.props.children);
      return c;
    });
  }
  if (child?.type === 'br') return '\n';
  // 保留 math 元素
  if (child?.type === 'math' || child?.type?.name === 'MathBlock') return child;
  return child;
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
  p: ({ children }: { children?: any }) => <p className="my-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</p>,
  ul: ({ children }: { children?: any }) => <ul className="my-4 ml-6 list-disc" style={{ color: 'var(--text-secondary)' }}>{children}</ul>,
  ol: ({ children }: { children?: any }) => <ol className="my-4 ml-6 list-decimal" style={{ color: 'var(--text-secondary)' }}>{children}</ol>,
  li: ({ children }: { children?: any }) => <li className="my-1">{children}</li>,
  a: ({ href, children }: { href?: string; children?: any }) => <a href={href} className="underline hover" style={{ color: 'var(--accent-primary)' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: MarkdownCode,
  table: ({ children }: { children?: any }) => <div className="overflow-x-auto my-6 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}><table className="min-w-full border" style={{ borderColor: 'var(--border-color)' }}>{children}</table></div>,
  thead: ({ children }: { children?: any }) => <thead style={{ background: 'var(--bg-secondary)' }}>{children}</thead>,
  th: ({ children }: { children?: any }) => <th className="border px-4 py-3 text-left font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{children}</th>,
  td: ({ children }: { children?: any }) => <td className="border px-4 py-3 whitespace-pre-line" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{processCellChildren(children)}</td>,
  blockquote: ({ children }: { children?: any }) => <blockquote className="border-l-4 pl-4 my-6 py-3 pr-4 rounded-r" style={{ borderColor: 'var(--accent-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{children}</blockquote>,
  hr: () => <hr className="my-8" style={{ borderColor: 'var(--border-color)' }} />,
  img: ({ src, alt }: { src?: string; alt?: string }) => <ClickableImage src={src} alt={alt} />,
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

// Update components to include math wrapper
const finalMarkdownComponentsWithMath = {
  ...finalMarkdownComponents,
  math: MathBlock
};

const finalContentOnlyComponentsWithMath = {
  ...finalContentOnlyComponents,
  math: MathBlock
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
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={finalMarkdownComponentsWithMath}>{content}</ReactMarkdown>
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

export { markdownComponents };
