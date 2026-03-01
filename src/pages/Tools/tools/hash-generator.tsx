/**
 * Hash Generator Tool
 * 
 * Generate various hash values using Web Crypto API
 * Supports MD5, SHA-1, SHA-256, SHA-384, SHA-512
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useEffect } from 'react';
import { Hash, Copy, Check, RefreshCw } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import { ToolCard, ToolInput, ToolButton, ToolActions } from '../components/shared';

// CSS clip-path helper
const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// Hash algorithm configuration
const HASH_ALGORITHMS = [
  { id: 'MD5', name: 'MD5', description: '128位，不推荐用于安全场景' },
  { id: 'SHA-1', name: 'SHA-1', description: '160位，已不安全' },
  { id: 'SHA-256', name: 'SHA-256', description: '256位，推荐使用' },
  { id: 'SHA-384', name: 'SHA-384', description: '384位' },
  { id: 'SHA-512', name: 'SHA-512', description: '512位' },
];

// MD5 implementation (Web Crypto API doesn't support MD5)
function md5(string: string): string {
  function rotateLeft(x: number, n: number) {
    return (x << n) | (x >>> (32 - n));
  }

  function addUnsigned(x: number, y: number) {
    const x4 = x & 0x80000000;
    const y4 = y & 0x80000000;
    const x8 = x & 0x40000000;
    const y8 = y & 0x40000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x8 & y8) return result ^ 0x80000000 ^ x4 ^ y4;
    if (x8 | y8) {
      if (result & 0x40000000) return result ^ 0xc0000000 ^ x4 ^ y4;
      return result ^ 0x40000000 ^ x4 ^ y4;
    }
    return result ^ x4 ^ y4;
  }

  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string) {
    const utf8 = unescape(encodeURIComponent(str));
    const len = utf8.length;
    const words = [];
    
    for (let i = 0; i < len; i += 4) {
      words.push(
        (utf8.charCodeAt(i) || 0) |
        ((utf8.charCodeAt(i + 1) || 0) << 8) |
        ((utf8.charCodeAt(i + 2) || 0) << 16) |
        ((utf8.charCodeAt(i + 3) || 0) << 24)
      );
    }
    
    const bitLen = len * 8;
    words[len >> 2] |= 0x80 << ((len % 4) * 8);
    words[(((len + 8) >>> 6) << 4) + 14] = bitLen;
    
    return words;
  }

  function wordToHex(value: number) {
    let hex = '';
    for (let i = 0; i < 4; i++) {
      const byte = (value >>> (i * 8)) & 255;
      hex += ('0' + byte.toString(16)).slice(-2);
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;

    a = FF(a, b, c, d, x[k], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k], 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d));
}

// Hash result type
interface HashResult {
  algorithm: string;
  hash: string;
  copied: boolean;
}

function HashGenerator({ className = '' }: ToolProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<HashResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate hash using Web Crypto API
  const generateHash = useCallback(async (text: string, algorithm: string): Promise<string> => {
    if (algorithm === 'MD5') {
      return md5(text);
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  // Generate all hashes
  useEffect(() => {
    if (!input) {
      setResults([]);
      return;
    }

    setIsProcessing(true);
    Promise.all(
      HASH_ALGORITHMS.map(async (algo) => ({
        algorithm: algo.id,
        hash: await generateHash(input, algo.id),
        copied: false,
      }))
    ).then((hashResults) => {
      setResults(hashResults);
      setIsProcessing(false);
    });
  }, [input, generateHash]);

  // Copy hash
  const copyHash = useCallback(async (index: number) => {
    try {
      await navigator.clipboard.writeText(results[index].hash);
      setResults(prev => prev.map((r, i) => ({
        ...r,
        copied: i === index ? true : r.copied,
      })));
      setTimeout(() => {
        setResults(prev => prev.map((r, i) => ({
          ...r,
          copied: i === index ? false : r.copied,
        })));
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [results]);

  // Clear all
  const handleClear = useCallback(() => {
    setInput('');
    setResults([]);
  }, []);

  return (
    <div className={`hash-generator ${className}`}>
      <ToolCard title="哈希生成器" description="生成多种哈希值，支持 MD5、SHA-1、SHA-256 等">
        <div className="space-y-6">
          {/* Input */}
          <ToolInput
            value={input}
            onChange={setInput}
            placeholder="输入要计算哈希的文本..."
            label="输入文本"
            rows={4}
          />

          {/* Actions */}
          <ToolActions>
            <ToolButton onClick={handleClear} variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>
              清空
            </ToolButton>
            {isProcessing && (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                计算中...
              </span>
            )}
          </ToolActions>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                哈希结果
              </label>
              {results.map((result, index) => (
                <div
                  key={result.algorithm}
                  className="p-4"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    clipPath: clipPathRounded(8),
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                      {result.algorithm}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {result.hash.length * 4} 位
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code
                      className="flex-1 text-sm break-all font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {result.hash}
                    </code>
                    <button
                      onClick={() => copyHash(index)}
                      className="p-2 transition-colors hover:bg-white/5"
                      style={{
                        background: result.copied ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                        color: result.copied ? '#22c55e' : 'var(--text-muted)',
                        clipPath: clipPathRounded(4),
                      }}
                    >
                      {result.copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Algorithm Info */}
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <p>* MD5 和 SHA-1 已不推荐用于安全敏感场景</p>
            <p>* SHA-256 及以上算法推荐用于密码存储和数字签名</p>
          </div>
        </div>
      </ToolCard>
    </div>
  );
}

// Tool metadata
const meta = {
  id: 'hash-generator',
  name: '哈希生成器',
  description: '生成 MD5、SHA-1、SHA-256 等多种哈希值',
  icon: Hash,
  category: 'crypto' as const,
  keywords: ['hash', '哈希', 'md5', 'sha', '加密', '摘要'],
  isPopular: true,
};

// Export as ToolModule
export const hashGeneratorTool: ToolModule = {
  meta,
  Component: HashGenerator,
};

export default hashGeneratorTool;
