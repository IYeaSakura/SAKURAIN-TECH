/**
 * Regex Tester Tool
 * 
 * Real-time regex pattern testing with match highlighting
 * Supports all JavaScript regex flags
 * 
 * @author SAKURAIN
 */

import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Regex, CheckCircle2, Copy, Check } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import {
  ToolCard,
  ToolInput,
  ToolButton,
  ErrorMessage,
} from '../components/shared';

// Regex flags configuration
const REGEX_FLAGS = [
  { flag: 'g', name: 'global', description: '全局匹配' },
  { flag: 'i', name: 'ignoreCase', description: '忽略大小写' },
  { flag: 'm', name: 'multiline', description: '多行模式' },
  { flag: 's', name: 'dotAll', description: 'dot匹配换行' },
  { flag: 'u', name: 'unicode', description: 'Unicode模式' },
];

// Match result type
interface MatchResult {
  match: string;
  index: number;
  groups?: Record<string, string>;
}

// CSS clip-path helper
const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

function RegexTester({ className = '' }: ToolProps) {
  const [pattern, setPattern] = useState('');
  const [testString, setTestString] = useState('');
  const [flags, setFlags] = useState<Set<string>>(new Set(['g']));
  const [error, setError] = useState<string | null>(null);

  // Parse and execute regex
  const results = useMemo(() => {
    if (!pattern) {
      setError(null);
      return { matches: [], highlighted: testString };
    }

    try {
      const regex = new RegExp(pattern, Array.from(flags).join(''));
      setError(null);

      if (flags.has('g')) {
        const matches: MatchResult[] = [];
        let match;
        const regexCopy = new RegExp(pattern, Array.from(flags).join(''));
        
        while ((match = regexCopy.exec(testString)) !== null) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.groups,
          });
          // Prevent infinite loop for zero-length matches
          if (match[0].length === 0) {
            regexCopy.lastIndex++;
          }
        }

        // Build highlighted string
        const highlighted = buildHighlightedString(testString, matches);

        return { matches, highlighted };
      } else {
        const match = regex.exec(testString);
        if (match) {
          const matches: MatchResult[] = [{
            match: match[0],
            index: match.index,
            groups: match.groups,
          }];
          const highlighted = buildHighlightedString(testString, matches);
          return { matches, highlighted };
        }
        return { matches: [], highlighted: testString };
      }
    } catch (err) {
      setError((err as Error).message);
      return { matches: [], highlighted: testString };
    }
  }, [pattern, testString, flags]);

  // Build highlighted HTML string
  function buildHighlightedString(text: string, matches: MatchResult[]): string {
    if (matches.length === 0) return text;

    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
    let result = '';
    let lastIndex = 0;

    sortedMatches.forEach((m) => {
      result += text.slice(lastIndex, m.index);
      result += `<mark class="regex-match" style="background: rgba(59, 130, 246, 0.3); color: inherit; border-radius: 2px;">${escapeHtml(m.match)}</mark>`;
      lastIndex = m.index + m.match.length;
    });

    result += text.slice(lastIndex);
    return result;
  }

  // Escape HTML entities
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Toggle flag
  const toggleFlag = useCallback((flag: string) => {
    setFlags(prev => {
      const next = new Set(prev);
      if (next.has(flag)) {
        next.delete(flag);
      } else {
        next.add(flag);
      }
      return next;
    });
  }, []);

  // Copy regex pattern
  const [copied, setCopied] = useState(false);
  const copyRegex = useCallback(async () => {
    const flagStr = Array.from(flags).join('');
    const regexStr = `/${pattern}/${flagStr}`;
    await navigator.clipboard.writeText(regexStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pattern, flags]);

  // Common regex patterns
  const commonPatterns = [
    { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
    { name: 'URL', pattern: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[\\w\\-.,@?^=%&:/~+#]*' },
    { name: '手机号', pattern: '1[3-9]\\d{9}' },
    { name: 'IP地址', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
    { name: '日期', pattern: '\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}' },
    { name: '身份证', pattern: '\\d{17}[\\dXx]' },
  ];

  return (
    <div className={`regex-tester ${className}`}>
      <ToolCard title="正则表达式测试器" description="实时测试正则表达式，高亮显示匹配结果">
        <div className="space-y-6">
          {/* Pattern Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              正则表达式
            </label>
            <div className="flex gap-2">
              <div
                className="flex items-center px-3 text-lg font-mono"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  clipPath: clipPathRounded(8),
                }}
              >
                /
              </div>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="输入正则表达式..."
                className="flex-1 px-4 py-3 font-mono focus:outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  clipPath: clipPathRounded(8),
                }}
              />
              <div
                className="flex items-center px-3 text-lg font-mono"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  clipPath: clipPathRounded(8),
                }}
              >
                /{Array.from(flags).join('')}
              </div>
              <ToolButton onClick={copyRegex} variant="secondary" icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
                复制
              </ToolButton>
            </div>
          </div>

          {/* Flags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              修饰符
            </label>
            <div className="flex flex-wrap gap-2">
              {REGEX_FLAGS.map(({ flag, description }) => (
                <button
                  key={flag}
                  onClick={() => toggleFlag(flag)}
                  className="px-3 py-1.5 text-sm font-medium transition-all"
                  style={{
                    background: flags.has(flag) ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: flags.has(flag) ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                  title={description}
                >
                  {flag} - {description}
                </button>
              ))}
            </div>
          </div>

          {/* Common Patterns */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              常用正则
            </label>
            <div className="flex flex-wrap gap-2">
              {commonPatterns.map(({ name, pattern: p }) => (
                <button
                  key={name}
                  onClick={() => setPattern(p)}
                  className="px-3 py-1.5 text-sm transition-all hover:opacity-80"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Test String */}
          <ToolInput
            value={testString}
            onChange={setTestString}
            placeholder="输入测试文本..."
            label="测试文本"
            rows={5}
          />

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            )}
          </AnimatePresence>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                匹配结果
              </label>
              {results.matches.length > 0 && (
                <span className="flex items-center gap-1 text-sm" style={{ color: '#22c55e' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  找到 {results.matches.length} 个匹配
                </span>
              )}
              {pattern && results.matches.length === 0 && !error && (
                <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  无匹配
                </span>
              )}
            </div>
            <div
              className="p-4 min-h-[100px] whitespace-pre-wrap break-all font-mono text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                clipPath: clipPathRounded(8),
              }}
              dangerouslySetInnerHTML={{ 
                __html: !pattern 
                  ? '<span style="color: var(--text-muted)">输入正则表达式开始测试...</span>' 
                  : results.matches.length === 0 
                    ? '<span style="color: var(--text-muted)">未找到匹配内容</span>'
                    : results.highlighted 
              }}
            />
          </div>

          {/* Match Details */}
          {results.matches.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                匹配详情
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.matches.map((m, i) => (
                  <div
                    key={i}
                    className="p-3 text-sm"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                        #{i + 1}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        位置: {m.index}
                      </span>
                    </div>
                    <div className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      "{m.match}"
                    </div>
                    {m.groups && Object.keys(m.groups).length > 0 && (
                      <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        Groups: {JSON.stringify(m.groups)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ToolCard>
    </div>
  );
}

// Tool metadata
const meta = {
  id: 'regex-tester',
  name: '正则测试器',
  description: '实时测试正则表达式，高亮显示匹配结果',
  icon: Regex,
  category: 'developer' as const,
  keywords: ['regex', 'regexp', '正则', '表达式', '匹配', 'pattern'],
  isPopular: true,
};

// Export as ToolModule
export const regexTesterTool: ToolModule = {
  meta,
  Component: RegexTester,
};

export default regexTesterTool;
