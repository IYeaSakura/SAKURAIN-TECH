import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code, Check, Copy } from 'lucide-react';
import '../../../styles/code-block.css';

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

export const CodeBlock = ({ language, value }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { }
  };

  const lineCount = value.split('\n').filter(line => line.trim() !== '').length;
  const isShortCode = lineCount <= 3 && value.length < 200;
  const displayLang = langNames[language] || language?.toUpperCase() || 'TEXT';

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
          aria-label={copied ? '已复制' : '复制代码'}
        >
          {copied ? (
            <>
              <Check className="code-block-copy-icon" />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy className="code-block-copy-icon" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>
      <div className="code-block-content">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language || 'text'}
          PreTag="div"
          className="prism-code"
          customStyle={{ 
            margin: 0, 
            borderRadius: 0, 
            fontSize: '0.875rem', 
            lineHeight: '1.6', 
            padding: '1rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
            whiteSpace: 'pre',
            overflowX: 'auto',
            background: 'transparent'
          }}
          showLineNumbers
          lineNumberStyle={{ 
            minWidth: '2.5em', 
            paddingRight: '1em', 
            color: 'var(--text-muted)', 
            textAlign: 'right', 
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
