/**
 * Number Base Converter Tool
 * 
 * Convert numbers between different bases
 * Supports binary, octal, decimal, hexadecimal, and custom bases
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useMemo } from 'react';
import { Calculator, Copy, Check } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import { ToolCard } from '../components/shared';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

const BASES = [
  { value: 2, label: '二进制', prefix: '0b', digits: '01' },
  { value: 8, label: '八进制', prefix: '0o', digits: '01234567' },
  { value: 10, label: '十进制', prefix: '', digits: '0123456789' },
  { value: 16, label: '十六进制', prefix: '0x', digits: '0123456789ABCDEF' },
];

function NumberBaseConverter({ className = '' }: ToolProps) {
  const [input, setInput] = useState('');
  const [inputBase, setInputBase] = useState(10);
  const [copied, setCopied] = useState<string | null>(null);

  // Parse input to decimal
  const decimalValue = useMemo(() => {
    if (!input) return null;
    
    const cleanInput = input.replace(/^0[bxo]?/i, '').toUpperCase();
    const base = BASES.find(b => b.value === inputBase);
    
    if (!base) return null;
    
    try {
      // Validate input
      for (const char of cleanInput) {
        if (!base.digits.includes(char)) {
          return null;
        }
      }
      
      return parseInt(cleanInput, inputBase);
    } catch {
      return null;
    }
  }, [input, inputBase]);

  // Convert to all bases
  const conversions = useMemo(() => {
    if (decimalValue === null || isNaN(decimalValue)) return null;
    
    return {
      2: decimalValue.toString(2).toUpperCase(),
      8: decimalValue.toString(8).toUpperCase(),
      10: decimalValue.toString(10),
      16: decimalValue.toString(16).toUpperCase(),
    };
  }, [decimalValue]);

  // Copy value
  const copyValue = useCallback(async (base: number, value: string) => {
    const baseInfo = BASES.find(b => b.value === base);
    const text = baseInfo ? `${baseInfo.prefix}${value}` : value;
    await navigator.clipboard.writeText(text);
    setCopied(base.toString());
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className={`number-base-converter ${className}`}>
      <ToolCard title="进制转换器" description="二进制、八进制、十进制、十六进制互转">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-5">
            {/* Input Base Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                输入进制
              </label>
              <div className="grid grid-cols-4 gap-2">
                {BASES.map((base) => (
                  <button
                    key={base.value}
                    onClick={() => {
                      setInputBase(base.value);
                      setInput('');
                    }}
                    className="px-2 py-2 text-xs font-medium transition-all"
                    style={{
                      background: inputBase === base.value ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      color: inputBase === base.value ? 'white' : 'var(--text-primary)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    {base.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                输入数值
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  const base = BASES.find(b => b.value === inputBase);
                  if (!base) return;
                  
                  const cleanValue = e.target.value.replace(/^0[bxo]?/i, '').toUpperCase();
                  const validChars = base.digits;
                  
                  // Filter invalid characters
                  const filtered = cleanValue.split('').filter(c => validChars.includes(c)).join('');
                  setInput(filtered);
                }}
                placeholder={`输入${BASES.find(b => b.value === inputBase)?.label}数值...`}
                className="w-full px-4 py-3 font-mono text-lg focus:outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  clipPath: clipPathRounded(8),
                }}
              />
            </div>

            {/* Invalid Input */}
            {input && decimalValue === null && (
              <div
                className="p-3 text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  clipPath: clipPathRounded(6),
                }}
              >
                无效的输入，请检查是否符合所选进制
              </div>
            )}

            {/* Quick Reference */}
            <div
              className="p-3 text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                clipPath: clipPathRounded(6),
              }}
            >
              <div className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                常用进制前缀
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div><code>0b</code> - 二进制</div>
                <div><code>0o</code> - 八进制</div>
                <div><code>0x</code> - 十六进制</div>
                <div>无前缀 - 十进制</div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              转换结果
            </label>
            
            {conversions ? (
              <div className="space-y-2">
                {BASES.map((base) => (
                  <div
                    key={base.value}
                    className="flex items-center justify-between gap-2 p-3 group"
                    style={{
                      background: inputBase === base.value ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'var(--bg-secondary)',
                      border: `2px solid ${inputBase === base.value ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className="px-2 py-1 text-xs font-medium flex-shrink-0"
                        style={{
                          background: 'var(--bg-card)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {base.label}
                      </span>
                      <code className="font-mono text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                        {base.prefix}{conversions[base.value as keyof typeof conversions]}
                      </code>
                    </div>
                    <button
                      onClick={() => copyValue(base.value, conversions[base.value as keyof typeof conversions])}
                      className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{
                        background: copied === base.value.toString() ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-card)',
                        color: copied === base.value.toString() ? '#22c55e' : 'var(--text-muted)',
                      }}
                    >
                      {copied === base.value.toString() ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
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
                  minHeight: '250px',
                }}
              >
                <div className="text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    输入数值开始转换
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
  id: 'number-base-converter',
  name: '进制转换',
  description: '二进制、八进制、十进制、十六进制互转',
  icon: Calculator,
  category: 'converter' as const,
  keywords: ['binary', 'hex', 'decimal', 'octal', '进制', '转换', 'base'],
};

export const numberBaseConverterTool: ToolModule = {
  meta,
  Component: NumberBaseConverter,
};

export default numberBaseConverterTool;
