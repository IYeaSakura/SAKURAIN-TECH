/**
 * UUID Generator Tool
 * 
 * Generate UUIDs in various versions
 * Supports UUID v1, v4, v5 and bulk generation
 * 
 * @author SAKURAIN
 */

import { useState, useCallback } from 'react';
import { Fingerprint, Copy, Check, RefreshCw, Trash2 } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import { ToolCard, ToolButton, ToolActions } from '../components/shared';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// Generate UUID v4
function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate UUID v1 (timestamp-based, simplified)
function generateUUIDv1(): string {
  const now = Date.now();
  const timeLow = (now & 0xffffffff).toString(16).padStart(8, '0');
  const timeMid = ((now >> 32) & 0xffff).toString(16).padStart(4, '0');
  const timeHi = (((now >> 48) & 0x0fff) | 0x1000).toString(16).padStart(4, '0');
  const clockSeq = (Math.random() * 0x3fff | 0x8000).toString(16).padStart(4, '0');
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  
  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
}

// Generate NIL UUID
function generateNilUUID(): string {
  return '00000000-0000-0000-0000-000000000000';
}

type UUIDVersion = 'v1' | 'v4' | 'nil';

function UUIDGenerator({ className = '' }: ToolProps) {
  const [version, setVersion] = useState<UUIDVersion>('v4');
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generate = useCallback(() => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      switch (version) {
        case 'v1':
          newUuids.push(generateUUIDv1());
          break;
        case 'v4':
          newUuids.push(generateUUIDv4());
          break;
        case 'nil':
          newUuids.push(generateNilUUID());
          break;
      }
    }
    setUuids(newUuids);
  }, [version, count]);

  const copySingle = useCallback(async (index: number) => {
    await navigator.clipboard.writeText(uuids[index]);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [uuids]);

  const copyAll = useCallback(async () => {
    await navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [uuids]);

  const clearAll = useCallback(() => {
    setUuids([]);
  }, []);

  return (
    <div className={`uuid-generator ${className}`}>
      <ToolCard title="UUID 生成器" description="生成唯一标识符，支持多种版本">
        <div className="space-y-6">
          {/* Version Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              UUID 版本
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'v4', label: 'v4 (随机)', desc: '最常用，基于随机数生成' },
                { value: 'v1', label: 'v1 (时间戳)', desc: '基于时间戳生成' },
                { value: 'nil', label: 'NIL', desc: '空 UUID' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVersion(opt.value as UUIDVersion)}
                  className="px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: version === opt.value ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: version === opt.value ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              生成数量
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-32 px-4 py-2 focus:outline-none"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                clipPath: clipPathRounded(4),
              }}
            />
          </div>

          {/* Actions */}
          <ToolActions>
            <ToolButton onClick={generate} icon={<RefreshCw className="w-4 h-4" />}>
              生成
            </ToolButton>
            {uuids.length > 0 && (
              <>
                <ToolButton onClick={copyAll} variant="secondary" icon={copiedIndex === -1 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
                  复制全部
                </ToolButton>
                <ToolButton onClick={clearAll} variant="secondary" icon={<Trash2 className="w-4 h-4" />}>
                  清空
                </ToolButton>
              </>
            )}
          </ToolActions>

          {/* Results */}
          {uuids.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                生成结果
              </label>
              <div
                className="p-4 max-h-80 overflow-y-auto space-y-2"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  clipPath: clipPathRounded(8),
                }}
              >
                {uuids.map((uuid, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-2 group"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    <code className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                      {uuid}
                    </code>
                    <button
                      onClick={() => copySingle(i)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: copiedIndex === i ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-secondary)',
                        color: copiedIndex === i ? '#22c55e' : 'var(--text-muted)',
                      }}
                    >
                      {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
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

const meta = {
  id: 'uuid-generator',
  name: 'UUID 生成器',
  description: '生成唯一标识符，支持 v1/v4/NIL 版本',
  icon: Fingerprint,
  category: 'developer' as const,
  keywords: ['uuid', 'guid', '唯一标识', 'identifier', 'id'],
  isPopular: true,
};

export const uuidGeneratorTool: ToolModule = {
  meta,
  Component: UUIDGenerator,
};

export default uuidGeneratorTool;
