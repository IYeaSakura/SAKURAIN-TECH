/**
 * Text Statistics Tool
 * 
 * Analyze text and show various statistics
 * Character count, word count, line count, etc.
 * 
 * @author SAKURAIN
 */

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import { ToolCard, ToolInput } from '../components/shared';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

interface StatItem {
  label: string;
  value: number | string;
  description?: string;
}

function TextStatistics({ className = '' }: ToolProps) {
  const [text, setText] = useState('');

  // Calculate statistics
  const stats = useMemo((): StatItem[] => {
    if (!text) return [];

    const charCount = text.length;
    const charCountNoSpace = text.replace(/\s/g, '').length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lineCount = text.split('\n').length;
    const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    const sentenceCount = text.split(/[.!?。！？]+/).filter(s => s.trim()).length;
    
    // Chinese character count
    const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // English word count (for mixed text)
    const englishWordCount = (text.match(/[a-zA-Z]+/g) || []).length;
    
    // Number count
    const numberCount = (text.match(/\d+/g) || []).length;
    
    // Punctuation count
    const punctuationCount = (text.match(/[.,!?;:'"()（）。，！？；：""'']/g) || []).length;
    
    // Byte count (UTF-8)
    const byteCount = new TextEncoder().encode(text).length;
    
    // Reading time (assuming 300 chars/min for Chinese, 200 words/min for English)
    const readingTime = Math.ceil((chineseCount / 300) + (englishWordCount / 200));
    
    // Speaking time (slower than reading)
    const speakingTime = Math.ceil((chineseCount / 200) + (englishWordCount / 150));

    return [
      { label: '字符数', value: charCount, description: '包含空格和换行' },
      { label: '字符数（不含空格）', value: charCountNoSpace },
      { label: '字节数', value: byteCount, description: 'UTF-8 编码' },
      { label: '单词数', value: wordCount },
      { label: '中文汉字数', value: chineseCount },
      { label: '英文单词数', value: englishWordCount },
      { label: '数字组数', value: numberCount },
      { label: '标点符号数', value: punctuationCount },
      { label: '行数', value: lineCount },
      { label: '段落数', value: paragraphCount },
      { label: '句子数', value: sentenceCount },
      { label: '预计阅读时间', value: `${readingTime} 分钟` },
      { label: '预计朗读时间', value: `${speakingTime} 分钟` },
    ];
  }, [text]);

  // Character frequency
  const charFrequency = useMemo(() => {
    if (!text) return [];
    
    const freq: Record<string, number> = {};
    for (const char of text) {
      if (char.trim()) {
        freq[char] = (freq[char] || 0) + 1;
      }
    }
    
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [text]);

  return (
    <div className={`text-statistics ${className}`}>
      <ToolCard title="文本统计" description="统计文本的字符数、单词数、行数等信息">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div>
            <ToolInput
              value={text}
              onChange={setText}
              placeholder="输入或粘贴文本进行分析..."
              rows={12}
            />
            
            {/* Character Frequency */}
            {charFrequency.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  字符频率 TOP 10
                </label>
                <div className="flex flex-wrap gap-2">
                  {charFrequency.map(([char, count], i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2.5 py-1"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--border-subtle)',
                        clipPath: clipPathRounded(4),
                      }}
                    >
                      <span className="font-mono text-base" style={{ color: 'var(--text-primary)' }}>
                        {char}
                      </span>
                      <span
                        className="px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          background: 'var(--accent-primary)',
                          color: 'white',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Statistics */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              统计结果
            </label>
            
            {stats.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="p-2.5"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      clipPath: clipPathRounded(4),
                    }}
                    title={stat.description}
                  >
                    <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </div>
                    <div className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex items-center justify-center p-8"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(8),
                  minHeight: '300px',
                }}
              >
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    输入文本开始统计分析
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ToolCard>
    </div>
  );
}

const meta = {
  id: 'text-statistics',
  name: '文本统计',
  description: '统计字符数、单词数、行数等信息',
  icon: FileText,
  category: 'text' as const,
  keywords: ['text', 'count', 'statistics', '统计', '字数', '字符'],
};

export const textStatisticsTool: ToolModule = {
  meta,
  Component: TextStatistics,
};

export default textStatisticsTool;
