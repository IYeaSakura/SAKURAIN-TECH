/**
 * URL Encoder/Decoder Tool
 * 
 * Encode and decode URLs and URI components
 * Supports full URL and component encoding
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useMemo } from 'react';
import { Link2, Copy } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import {
  ToolCard,
  ToolActions,
  SwapButton,
  ClearButton,
} from '../components/shared';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

type EncodeMode = 'component' | 'uri';

function URLEncoder({ className = '' }: ToolProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<EncodeMode>('component');
  const [isEncode, setIsEncode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Process the input
  const output = useMemo(() => {
    if (!input) {
      setError(null);
      return '';
    }

    try {
      setError(null);
      if (isEncode) {
        return mode === 'component' 
          ? encodeURIComponent(input)
          : encodeURI(input);
      } else {
        return mode === 'component'
          ? decodeURIComponent(input)
          : decodeURI(input);
      }
    } catch (err) {
      setError((err as Error).message);
      return '';
    }
  }, [input, mode, isEncode]);

  // Swap encode/decode
  const handleSwap = useCallback(() => {
    setIsEncode(prev => !prev);
    setInput(output);
  }, [output]);

  // Clear
  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
  }, []);

  return (
    <div className={`url-encoder ${className}`}>
      <ToolCard title="URL 编解码" description="URL 和 URI 组件的编码与解码">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-5">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                编码模式
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'component', label: 'encodeURIComponent', desc: '编码所有特殊字符' },
                  { value: 'uri', label: 'encodeURI', desc: '保留 URL 结构字符' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value as EncodeMode)}
                    className="px-3 py-2 text-xs font-medium transition-all"
                    style={{
                      background: mode === opt.value ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      color: mode === opt.value ? 'white' : 'var(--text-primary)',
                      clipPath: clipPathRounded(4),
                    }}
                    title={opt.desc}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                {isEncode ? '原始文本' : '编码文本'}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isEncode ? '输入需要编码的文本...' : '输入需要解码的文本...'}
                rows={6}
                className="w-full p-3 resize-none focus:outline-none font-mono text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  clipPath: clipPathRounded(8),
                }}
              />
            </div>

            {/* Actions */}
            <ToolActions>
              <SwapButton onSwap={handleSwap} />
              <ClearButton onClear={handleClear} />
            </ToolActions>

            {/* Error */}
            {error && (
              <div
                className="p-3 text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  clipPath: clipPathRounded(6),
                }}
              >
                {error}
              </div>
            )}

            {/* Reference */}
            <div
              className="p-3 text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                clipPath: clipPathRounded(6),
              }}
            >
              <div className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                编码字符参考
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                <div>空格 → %20</div>
                <div>! → %21</div>
                <div># → %23</div>
                <div>$ → %24</div>
                <div>& → %26</div>
                <div>' → %27</div>
                <div>( → %28</div>
                <div>) → %29</div>
                <div>+ → %2B</div>
              </div>
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {isEncode ? '编码结果' : '解码结果'}
              </label>
              {output && (
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(output);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <Copy className="w-3 h-3" />
                  复制
                </button>
              )}
            </div>
            
            <div
              className="flex-1 relative p-3"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                clipPath: clipPathRounded(8),
                minHeight: '200px',
              }}
            >
              <pre
                className="whitespace-pre-wrap break-all text-sm font-mono"
                style={{ color: 'var(--text-primary)' }}
              >
                {output || <span style={{ color: 'var(--text-muted)' }}>结果将显示在这里...</span>}
              </pre>
            </div>
          </div>
        </div>
      </ToolCard>
    </div>
  );
}

const meta = {
  id: 'url-encoder',
  name: 'URL 编解码',
  description: 'URL 和 URI 组件的编码与解码',
  icon: Link2,
  category: 'encoder' as const,
  keywords: ['url', 'encode', 'decode', 'uri', '编码', '解码'],
  isPopular: true,
};

export const urlEncoderTool: ToolModule = {
  meta,
  Component: URLEncoder,
};

export default urlEncoderTool;
