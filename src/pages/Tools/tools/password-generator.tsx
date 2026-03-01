/**
 * Password Generator Tool
 * 
 * Generate secure random passwords with customizable options
 * Supports various character sets, length configuration, batch generation,
 * required/excluded characters, regex validation, and cracking time estimation
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useMemo } from 'react';
import { Key, Copy, Check, RefreshCw, Shield, AlertCircle, List, Clock } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import { ToolCard, ToolButton, ToolActions } from '../components/shared';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// Character sets
const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'il1Lo0O',
  ambiguous: '{}[]()"/\'\\`~,;:.<>',
};

// Calculate password strength
function calculateStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length >= 24) score++;
  if (password.length >= 32) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 3) return { score, label: '弱', color: '#ef4444' };
  if (score <= 5) return { score, label: '中等', color: '#f59e0b' };
  if (score <= 7) return { score, label: '强', color: '#22c55e' };
  return { score, label: '非常强', color: '#10b981' };
}

// Calculate password cracking time
// Assumptions based on 2024 hardware capabilities:
// - Rainbow table: instant for common/short passwords, ineffective for long random ones
// - Single GPU (RTX 4090 level): 1e10 guesses/second
// - GPU cluster (100 cards): 1e12 guesses/second
// - Professional/ASIC: 1e14 guesses/second
// - Dictionary attack: only effective for common passwords, not random ones
function calculateCrackingTime(password: string, charPoolSize: number): { 
  online: string;
  offlineFast: string;
  offlineSlow: string;
} {
  const combinations = Math.pow(charPoolSize, password.length);
  
  // Online attack (rate limited, ~1000 guesses/second)
  const onlineSeconds = combinations / 1000;
  const online = formatTime(onlineSeconds);
  
  // Offline attack with fast hashing (MD5/SHA1, GPU cluster ~1e12/s)
  const offlineFastSeconds = combinations / 1e12;
  const offlineFast = formatTime(offlineFastSeconds);
  
  // Offline attack with slow hashing (bcrypt/Argon2, ~10000 guesses/second)
  const offlineSlowSeconds = combinations / 10000;
  const offlineSlow = formatTime(offlineSlowSeconds);
  
  return { online, offlineFast, offlineSlow };
}

// Format time in human-readable format
function formatTime(seconds: number): string {
  if (seconds < 0.001) return '瞬间';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} 毫秒`;
  if (seconds < 60) return `${seconds.toFixed(1)} 秒`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} 分钟`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} 小时`;
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(1)} 天`;
  if (seconds < 3153600000) return `${(seconds / 31536000).toFixed(1)} 年`;
  if (seconds < 3153600000000) return `${(seconds / 3153600000).toFixed(1)} 世纪`;
  return `${(seconds / 3153600000000).toExponential(2)} 万亿年`;
}

interface PasswordResult {
  value: string;
  strength: { score: number; label: string; color: string };
  crackingTime: { online: string; offlineFast: string; offlineSlow: string };
  isValid: boolean;
  validationError?: string;
}

function PasswordGenerator({ className = '' }: ToolProps) {
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [options, setOptions] = useState({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: false,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });
  const [requiredChars, setRequiredChars] = useState('');
  const [excludeChars, setExcludeChars] = useState('');
  const [regexPattern, setRegexPattern] = useState('');
  const [passwords, setPasswords] = useState<PasswordResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Available characters based on options
  const availableChars = useMemo(() => {
    let chars = '';
    if (options.lowercase) chars += CHAR_SETS.lowercase;
    if (options.uppercase) chars += CHAR_SETS.uppercase;
    if (options.numbers) chars += CHAR_SETS.numbers;
    if (options.symbols) chars += CHAR_SETS.symbols;
    
    if (options.excludeSimilar) {
      chars = chars.split('').filter(c => !CHAR_SETS.similar.includes(c)).join('');
    }
    if (options.excludeAmbiguous) {
      chars = chars.split('').filter(c => !CHAR_SETS.ambiguous.includes(c)).join('');
    }
    
    if (excludeChars) {
      chars = chars.split('').filter(c => !excludeChars.includes(c)).join('');
    }
    
    return chars;
  }, [options, excludeChars]);

  // Validate regex pattern
  const compiledRegex = useMemo(() => {
    if (!regexPattern) return null;
    try {
      return new RegExp(regexPattern);
    } catch {
      return null;
    }
  }, [regexPattern]);

  // Generate single password
  const generateSingle = useCallback((charPool: string, pwdLength: number, required: string): string => {
    if (charPool.length === 0) return '';
    
    let result = '';
    const array = new Uint32Array(pwdLength);
    crypto.getRandomValues(array);
    
    if (required) {
      const requiredArray = required.split('');
      for (let i = 0; i < requiredArray.length && i < pwdLength; i++) {
        result += requiredArray[i];
      }
    }
    
    while (result.length < pwdLength) {
      const idx = array[result.length] % charPool.length;
      result += charPool[idx];
    }
    
    const shuffleArray = result.split('');
    const shuffleRandom = new Uint32Array(shuffleArray.length);
    crypto.getRandomValues(shuffleRandom);
    
    for (let i = shuffleArray.length - 1; i > 0; i--) {
      const j = shuffleRandom[i] % (i + 1);
      [shuffleArray[i], shuffleArray[j]] = [shuffleArray[j], shuffleArray[i]];
    }
    
    return shuffleArray.join('');
  }, []);

  // Generate passwords
  const generate = useCallback(() => {
    setError(null);
    
    if (availableChars.length === 0) {
      setError('没有可用的字符集，请至少选择一种字符类型');
      setPasswords([]);
      return;
    }
    
    if (requiredChars) {
      const unavailable = requiredChars.split('').filter(c => !availableChars.includes(c));
      if (unavailable.length > 0) {
        setError(`必须字符 "${unavailable.join('')}" 不在可用字符集中`);
        setPasswords([]);
        return;
      }
    }
    
    if (requiredChars.length > length) {
      setError(`密码长度 ${length} 不足以包含所有必须字符 (${requiredChars.length} 个)`);
      setPasswords([]);
      return;
    }
    
    const results: PasswordResult[] = [];
    const actualCount = Math.min(count, 100);
    const charPoolSize = availableChars.length;
    
    for (let i = 0; i < actualCount; i++) {
      const password = generateSingle(availableChars, length, requiredChars);
      const strength = calculateStrength(password);
      const crackingTime = calculateCrackingTime(password, charPoolSize);
      
      let isValid = true;
      let validationError: string | undefined;
      
      if (compiledRegex) {
        isValid = compiledRegex.test(password);
        if (!isValid) {
          validationError = '不符合正则表达式要求';
        }
      }
      
      results.push({ value: password, strength, crackingTime, isValid, validationError });
    }
    
    setPasswords(results);
  }, [availableChars, length, count, requiredChars, compiledRegex, generateSingle]);

  // Copy password
  const copyPassword = useCallback(async (index: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Copy all passwords
  const copyAll = useCallback(async () => {
    const text = passwords.map(p => p.value).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [passwords]);

  // Toggle option
  const toggleOption = useCallback((key: keyof typeof options) => {
    setOptions(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.lowercase && !next.uppercase && !next.numbers && !next.symbols) {
        return prev;
      }
      return next;
    });
  }, []);

  // Quick length presets
  const lengthPresets = [8, 12, 16, 24, 32, 64, 128, 256, 512, 1024];

  return (
    <div className={`password-generator ${className}`}>
      <ToolCard title="密码生成器" description="生成安全的随机密码，支持批量生成和高级规则">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-5">
            {/* Length & Count Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Length Configuration */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  密码长度
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    min={1}
                    max={1024}
                    value={length}
                    onChange={(e) => setLength(Math.max(1, Math.min(1024, parseInt(e.target.value) || 1)))}
                    className="w-20 px-2 py-1.5 text-sm font-mono text-center focus:outline-none"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      color: 'var(--accent-primary)',
                      clipPath: clipPathRounded(4),
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>位</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={1024}
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary) ${(length - 1) / 1023 * 100}%, var(--bg-secondary) ${(length - 1) / 1023 * 100}%)`,
                  }}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {lengthPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setLength(preset)}
                      className="px-2 py-0.5 text-xs transition-all"
                      style={{
                        background: length === preset ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        color: length === preset ? 'white' : 'var(--text-muted)',
                        clipPath: clipPathRounded(2),
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count Configuration */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  生成数量
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-20 px-2 py-1.5 text-sm font-mono text-center focus:outline-none"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      color: 'var(--accent-primary)',
                      clipPath: clipPathRounded(4),
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>个</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[1, 5, 10, 20].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setCount(preset)}
                      className="px-2 py-0.5 text-xs transition-all"
                      style={{
                        background: count === preset ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        color: count === preset ? 'white' : 'var(--text-muted)',
                        clipPath: clipPathRounded(2),
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Character Options */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                字符类型
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'lowercase', label: '小写 (a-z)' },
                  { key: 'uppercase', label: '大写 (A-Z)' },
                  { key: 'numbers', label: '数字 (0-9)' },
                  { key: 'symbols', label: '符号 (!@#)' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => toggleOption(opt.key as keyof typeof options)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-all"
                    style={{
                      background: options[opt.key as keyof typeof options] ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'var(--bg-secondary)',
                      border: `2px solid ${options[opt.key as keyof typeof options] ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      color: 'var(--text-primary)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    <span
                      className="w-3.5 h-3.5 flex items-center justify-center text-xs"
                      style={{
                        background: options[opt.key as keyof typeof options] ? 'var(--accent-primary)' : 'transparent',
                        color: options[opt.key as keyof typeof options] ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {options[opt.key as keyof typeof options] ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exclude Options */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                快捷排除
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'excludeSimilar', label: '相似字符 (il1Lo0O)' },
                  { key: 'excludeAmbiguous', label: '歧义字符 ({}[]())' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => toggleOption(opt.key as keyof typeof options)}
                    className="px-2.5 py-1 text-xs transition-all"
                    style={{
                      background: options[opt.key as keyof typeof options] ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    {options[opt.key as keyof typeof options] ? '✓ ' : ''}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Required & Exclude Characters Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  必须包含
                </label>
                <input
                  type="text"
                  value={requiredChars}
                  onChange={(e) => setRequiredChars(e.target.value)}
                  placeholder="如: Ab1@"
                  className="w-full px-3 py-1.5 text-sm focus:outline-none font-mono"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  排除字符
                </label>
                <input
                  type="text"
                  value={excludeChars}
                  onChange={(e) => setExcludeChars(e.target.value)}
                  placeholder="如: 0Oo"
                  className="w-full px-3 py-1.5 text-sm focus:outline-none font-mono"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                />
              </div>
            </div>

            {/* Regex Pattern */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                正则表达式验证
              </label>
              <input
                type="text"
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                placeholder="如: ^(?=.*[A-Z])(?=.*[0-9]).{8,}$"
                className="w-full px-3 py-1.5 text-sm focus:outline-none font-mono"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `2px solid ${regexPattern && !compiledRegex ? '#ef4444' : 'var(--border-subtle)'}`,
                  color: 'var(--text-primary)',
                  clipPath: clipPathRounded(4),
                }}
              />
              {regexPattern && (
                <p className={`text-xs mt-1 ${compiledRegex ? 'text-green-500' : 'text-red-400'}`}>
                  {compiledRegex ? '✓ 正则表达式有效' : '无效的正则表达式'}
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div
                className="p-2.5 text-sm flex items-center gap-2"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  clipPath: clipPathRounded(6),
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <ToolActions>
              <ToolButton onClick={generate} icon={<RefreshCw className="w-4 h-4" />}>
                生成密码
              </ToolButton>
              {passwords.length > 1 && (
                <ToolButton 
                  onClick={copyAll} 
                  variant="secondary" 
                  icon={copiedIndex === -1 ? <Check className="w-4 h-4" /> : <List className="w-4 h-4" />}
                >
                  {copiedIndex === -1 ? '已复制全部' : '复制全部'}
                </ToolButton>
              )}
            </ToolActions>
          </div>

          {/* Right Column - Results */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              生成结果 {passwords.length > 0 && `(${passwords.length} 个)`}
            </label>
            
            {passwords.length > 0 ? (
              <div className="flex-1 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {passwords.map((pwd, index) => (
                  <div key={index} className="group">
                    <div
                      className="flex items-center justify-between gap-2 p-2.5"
                      style={{
                        background: pwd.isValid ? 'var(--bg-secondary)' : 'rgba(239, 68, 68, 0.05)',
                        border: `2px solid ${pwd.isValid ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.3)'}`,
                        clipPath: clipPathRounded(4),
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                            #{index + 1}
                          </span>
                          <span 
                            className="text-xs px-1.5 py-0.5"
                            style={{ 
                              background: pwd.strength.color,
                              color: 'white',
                            }}
                          >
                            {pwd.strength.label}
                          </span>
                          {!pwd.isValid && (
                            <span className="text-xs" style={{ color: '#ef4444' }}>
                              {pwd.validationError}
                            </span>
                          )}
                        </div>
                        <code 
                          className="text-xs font-mono break-all"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {pwd.value}
                        </code>
                        {/* Cracking Time Info */}
                        <div className="mt-1.5 pt-1.5 border-t border-dashed" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="flex items-center gap-1 text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                            <Clock className="w-3 h-3" />
                            <span>破解时间估算</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>在线攻击 (限速): </span>
                              <span style={{ color: 'var(--accent-primary)' }}>{pwd.crackingTime.online}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>离线快速哈希 (MD5/SHA): </span>
                              <span style={{ color: 'var(--accent-primary)' }}>{pwd.crackingTime.offlineFast}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>离线慢哈希 (bcrypt/Argon2): </span>
                              <span style={{ color: 'var(--accent-primary)' }}>{pwd.crackingTime.offlineSlow}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => copyPassword(index, pwd.value)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        style={{
                          background: copiedIndex === index ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-card)',
                          color: copiedIndex === index ? '#22c55e' : 'var(--text-muted)',
                        }}
                      >
                        {copiedIndex === index ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex-1 flex items-center justify-center p-8"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(8),
                  minHeight: '300px',
                }}
              >
                <div className="text-center">
                  <Key className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    配置选项后点击生成
                  </p>
                </div>
              </div>
            )}

            {/* Security Tips - Compact */}
            <div
              className="mt-4 p-2.5 text-xs"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '2px solid rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                clipPath: clipPathRounded(6),
              }}
            >
              <div className="flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">建议：</span>
                  密码长度至少 16 位，包含大小写字母、数字和特殊符号，不同网站使用不同密码
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToolCard>
    </div>
  );
}

const meta = {
  id: 'password-generator',
  name: '密码生成器',
  description: '生成安全的随机密码，支持批量生成和高级规则',
  icon: Key,
  category: 'security' as const,
  keywords: ['password', '密码', '随机', '安全', 'secure', '批量'],
  isPopular: true,
};

export const passwordGeneratorTool: ToolModule = {
  meta,
  Component: PasswordGenerator,
};

export default passwordGeneratorTool;
