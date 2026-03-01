/**
 * JSON Formatter Tool
 * 
 * Format, validate, and minify JSON
 * Support for JSON path queries
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useMemo } from 'react';
import { Braces, Minimize2, Code2, CheckCircle2, Copy, Check } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import {
  ToolCard,
  ToolInput,
  ToolButton,
  ToolActions,
  ErrorMessage,
} from '../components/shared';

// CSS clip-path helper
const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

type FormatMode = 'format' | 'minify';

function JsonFormatter({ className = '' }: ToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<FormatMode>('format');
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);

  // Parse and validate JSON
  const parsedJson = useMemo(() => {
    if (!input) return null;
    
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }, [input]);

  // Format JSON
  const format = useCallback(() => {
    if (!input) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setError(null);
      setOutput(JSON.stringify(parsed, null, indent));
    } catch (err) {
      setError('JSON 格式错误：' + (err as Error).message);
      setOutput('');
    }
  }, [input, indent]);

  // Minify JSON
  const minify = useCallback(() => {
    if (!input) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setError(null);
      setOutput(JSON.stringify(parsed));
    } catch (err) {
      setError('JSON 格式错误：' + (err as Error).message);
      setOutput('');
    }
  }, [input]);

  // Process based on mode
  const process = useCallback(() => {
    if (mode === 'format') {
      format();
    } else {
      minify();
    }
  }, [mode, format, minify]);

  // Copy output
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [output]);

  // Clear all
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    if (!parsedJson) return null;
    
    const inputSize = new Blob([input]).size;
    const outputSize = output ? new Blob([output]).size : 0;
    
    const countKeys = (obj: unknown): number => {
      if (typeof obj !== 'object' || obj === null) return 0;
      if (Array.isArray(obj)) {
        return obj.reduce((sum, item) => sum + countKeys(item), 0);
      }
      let count = Object.keys(obj).length;
      Object.values(obj).forEach(v => {
        count += countKeys(v);
      });
      return count;
    };

    return {
      inputSize,
      outputSize,
      keyCount: countKeys(parsedJson),
      type: Array.isArray(parsedJson) ? 'array' : 'object',
      depth: getDepth(parsedJson),
    };
  }, [parsedJson, input, output]);

  // Get JSON depth
  function getDepth(obj: unknown, depth = 0): number {
    if (typeof obj !== 'object' || obj === null) return depth;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return depth + 1;
      return Math.max(...obj.map(item => getDepth(item, depth + 1)));
    }
    const values = Object.values(obj);
    if (values.length === 0) return depth + 1;
    return Math.max(...values.map(v => getDepth(v, depth + 1)));
  }

  return (
    <div className={`json-formatter ${className}`}>
      <ToolCard title="JSON 格式化" description="格式化、压缩、验证 JSON 数据">
        <div className="space-y-6">
          {/* Mode selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('format')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                background: mode === 'format' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                color: mode === 'format' ? 'white' : 'var(--text-primary)',
                clipPath: clipPathRounded(4),
              }}
            >
              <Code2 className="w-4 h-4" />
              格式化
            </button>
            <button
              onClick={() => setMode('minify')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                background: mode === 'minify' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                color: mode === 'minify' ? 'white' : 'var(--text-primary)',
                clipPath: clipPathRounded(4),
              }}
            >
              <Minimize2 className="w-4 h-4" />
              压缩
            </button>
          </div>

          {/* Indent selector (only for format mode) */}
          {mode === 'format' && (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                缩进：
              </span>
              {[2, 4, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setIndent(n)}
                  className="px-3 py-1 text-sm transition-all"
                  style={{
                    background: indent === n ? 'var(--accent-secondary)' : 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: indent === n ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  {n} 空格
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <ToolInput
            value={input}
            onChange={setInput}
            placeholder="输入 JSON 数据..."
            label="输入"
            rows={8}
          />

          {/* Error */}
          {error && <ErrorMessage message={error} />}

          {/* Stats */}
          {stats && !error && (
            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                有效 JSON
              </span>
              <span>类型: {stats.type}</span>
              <span>深度: {stats.depth}</span>
              <span>键数: {stats.keyCount}</span>
              <span>大小: {stats.inputSize} 字节</span>
            </div>
          )}

          {/* Actions */}
          <ToolActions>
            <ToolButton onClick={process} icon={<Braces className="w-4 h-4" />}>
              {mode === 'format' ? '格式化' : '压缩'}
            </ToolButton>
            <ToolButton onClick={handleClear} variant="secondary">
              清空
            </ToolButton>
            {output && (
              <ToolButton onClick={handleCopy} variant="secondary" icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
                复制结果
              </ToolButton>
            )}
          </ToolActions>

          {/* Output */}
          {output && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                输出
              </label>
              <pre
                className="p-4 overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap break-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  clipPath: clipPathRounded(8),
                }}
              >
                {output}
              </pre>
            </div>
          )}
        </div>
      </ToolCard>
    </div>
  );
}

// Tool metadata
const meta = {
  id: 'json-formatter',
  name: 'JSON 格式化',
  description: '格式化、压缩、验证 JSON 数据',
  icon: Braces,
  category: 'developer' as const,
  keywords: ['json', 'format', 'minify', '格式化', '压缩', '验证'],
  isPopular: true,
};

// Export as ToolModule
export const jsonFormatterTool: ToolModule = {
  meta,
  Component: JsonFormatter,
};

export default jsonFormatterTool;
