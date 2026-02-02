import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code } from 'lucide-react';

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
      <code className="px-2 py-1 rounded text-sm font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>
        {value}
      </code>
    );
  }

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between px-4 py-2 text-xs" style={{ background: '#1e1e1e', borderBottom: '1px solid #333', color: '#858585' }}>
        <div className="flex items-center gap-2"><Code className="w-3.5 h-3.5" /><span className="font-medium">{displayLang}</span></div>
        <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-white/10" style={{ color: copied ? '#4ade80' : 'inherit' }}>
          {copied ? (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>已复制</span></>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span>复制</span></>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ 
          margin: 0, 
          borderRadius: '0 0 0.75rem 0.75rem', 
          fontSize: '0.8125rem', 
          lineHeight: '1.6', 
          padding: '1.25rem',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace"
        }}
        showLineNumbers
        lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#4b5563', textAlign: 'right', fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace" }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};
