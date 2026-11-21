import { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Code, Check, Copy } from 'lucide-react';
import { useTranslation } from '@/hooks';
import '@/styles/code-block.css';

// 按需注册语言：Prism 全量入口会打包 refractor/all 的 297 种语言（约 700KB chunk），
// 而站点实际只用到下列语言。PrismLight 仅引入 refractor/core，体积大幅下降。
// 语言模块来自 react-syntax-highlighter 的 prism 语言包（逐个 import，仅这些进入 bundle）。
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import ini from 'react-syntax-highlighter/dist/esm/languages/prism/ini';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import glsl from 'react-syntax-highlighter/dist/esm/languages/prism/glsl';
import jsonLang from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import cLang from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import lua from 'react-syntax-highlighter/dist/esm/languages/prism/lua';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import scss from 'react-syntax-highlighter/dist/esm/languages/prism/scss';
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker';
import nginx from 'react-syntax-highlighter/dist/esm/languages/prism/nginx';

// 注册主语言名 + 常用别名，保证 markdown 里的 ```ts / ```sh / ```html 等都能高亮。
const languageModules: Record<string, unknown> = {
  sql, typescript, javascript, python, bash, ini, markdown, yaml,
  glsl, json: jsonLang, html: markup, xml: markup, markup, css, c: cLang, cpp,
  lua, java, jsx, tsx, go, rust, ruby, php, scss, docker, dockerfile: docker, nginx,
};
const languageAliases: Record<string, string> = {
  js: 'javascript', ts: 'typescript', py: 'python', sh: 'bash',
  yml: 'yaml', md: 'markdown', rs: 'rust', rb: 'ruby',
};

Object.entries(languageModules).forEach(([name, mod]) => {
  SyntaxHighlighter.registerLanguage(name, mod as Parameters<typeof SyntaxHighlighter.registerLanguage>[1]);
});

interface CodeBlockProps {
  language: string;
  value: string;
}

const langNames: Record<string, string> = {
  js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
  py: 'Python', java: 'Java', cpp: 'C++', c: 'C', go: 'Go',
  rs: 'Rust', rb: 'Ruby', php: 'PHP', sql: 'SQL',
  sh: 'Shell', bash: 'Bash', yaml: 'YAML', yml: 'YAML',
  json: 'JSON', xml: 'XML', html: 'HTML', css: 'CSS',
  scss: 'SCSS', md: 'Markdown', dockerfile: 'Dockerfile', nginx: 'Nginx'
};

const customStyle = {
  margin: 0,
  padding: '1rem',
  fontSize: '0.875rem',
  lineHeight: '1.6',
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
  whiteSpace: 'pre' as const,
  overflowX: 'auto' as const,
  background: 'transparent',
};

export const CodeBlock = ({ language, value }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) { }
  };

  const lineCount = value.split('\n').filter(line => line.trim() !== '').length;
  const isShortCode = lineCount <= 3 && value.length < 200;
  const displayLang = langNames[language] || language?.toUpperCase() || 'TEXT';
  // 把 markdown 里的短别名映射到已注册的主语言名（未注册的名字会让 PrismLight 原样输出、不高亮）。
  const highlightLang = languageAliases[language] || language || 'text';

  if (isShortCode) {
    return (
      <code className="inline-code">
        {value}
      </code>
    );
  }

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <div className="code-block-lang">
          <Code className="code-block-lang-icon" />
          <span>{displayLang}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`code-block-copy ${copied ? 'copied' : ''}`}
          aria-label={copied ? t.common.copied : t.common.copy}
        >
          {copied ? (
            <>
              <Check className="code-block-copy-icon" />
              <span>{t.common.copied}</span>
            </>
          ) : (
            <>
              <Copy className="code-block-copy-icon" />
              <span>{t.common.copy}</span>
            </>
          )}
        </button>
      </div>
      <div className="code-block-content">
        <SyntaxHighlighter
          language={highlightLang}
          PreTag="div"
          className="prism-code"
          style={{}}
          customStyle={customStyle}
          useInlineStyles={false}
          showLineNumbers
          lineNumberStyle={{ 
            minWidth: '2.5em', 
            paddingRight: '1em', 
            color: 'var(--text-muted)', 
            textAlign: 'right' as const, 
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
            fontSize: '0.875rem',
            opacity: '0.5'
          }}
          lineNumberContainerStyle={{ display: 'inline-block', paddingRight: '1em' }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
