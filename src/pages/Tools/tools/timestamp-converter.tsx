/**
 * Timestamp Converter Tool
 * 
 * Convert between Unix timestamp and human-readable date
 * Supports multiple formats and timezones
 * 
 * @author SAKURAIN
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Clock, Copy, Check, RefreshCw } from 'lucide-react';
import type { ToolModule, ToolProps } from '../types';
import { ToolCard, ToolButton } from '../components/shared';

const clipPathRounded = (r: number) => 
  `polygon(0 ${r}px, ${r}px ${r}px, ${r}px 0, calc(100% - ${r}px) 0, calc(100% - ${r}px) ${r}px, 100% ${r}px, 100% calc(100% - ${r}px), calc(100% - ${r}px) calc(100% - ${r}px), calc(100% - ${r}px) 100%, ${r}px 100%, ${r}px calc(100% - ${r}px), 0 calc(100% - ${r}px))`;

// Format date to various formats
function formatDate(date: Date): Record<string, string> {
  return {
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    }),
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN', { hour12: false }),
    custom: formatCustom(date),
  };
}

function formatCustom(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function TimestampConverter({ className = '' }: ToolProps) {
  const [timestamp, setTimestamp] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Current time
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Parse timestamp to date
  const parsedDate = useMemo(() => {
    if (!timestamp) return null;
    
    const ts = parseInt(timestamp);
    if (isNaN(ts)) {
      setError('无效的时间戳');
      return null;
    }
    
    // Auto-detect timestamp unit (seconds or milliseconds)
    const date = ts < 1e12 ? new Date(ts * 1000) : new Date(ts);
    
    if (isNaN(date.getTime())) {
      setError('无效的时间戳');
      return null;
    }
    
    setError(null);
    return date;
  }, [timestamp]);

  // Formatted dates
  const formattedDates = useMemo(() => {
    if (!parsedDate) return null;
    return formatDate(parsedDate);
  }, [parsedDate]);

  // Parse date string to timestamp
  const handleDateInput = useCallback((value: string) => {
    setDateString(value);
    
    if (!value) {
      setTimestamp('');
      return;
    }
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      setTimestamp(Math.floor(date.getTime() / 1000).toString());
    }
  }, []);

  // Set current time
  const setCurrentTime = useCallback(() => {
    const ts = Math.floor(Date.now() / 1000);
    setTimestamp(ts.toString());
    setDateString(formatCustom(new Date()));
  }, []);

  // Copy to clipboard
  const copyValue = useCallback(async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Quick timestamps
  const quickTimestamps = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    return [
      { label: '现在', value: Math.floor(now / 1000) },
      { label: '1小时前', value: Math.floor((now - 3600000) / 1000) },
      { label: '今天0点', value: Math.floor(new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000) },
      { label: '昨天0点', value: Math.floor(new Date(new Date().setHours(0, 0, 0, 0) - day).getTime() / 1000) },
      { label: '明天0点', value: Math.floor(new Date(new Date().setHours(0, 0, 0, 0) + day).getTime() / 1000) },
    ];
  }, [now]);

  return (
    <div className={`timestamp-converter ${className}`}>
      <ToolCard title="时间戳转换器" description="Unix 时间戳与日期时间互转">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-5">
            {/* Current Time Display */}
            <div
              className="p-4 text-center"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-subtle)',
                clipPath: clipPathRounded(8),
              }}
            >
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>当前时间</div>
              <div className="text-xl font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>
                {formatCustom(now)}
              </div>
              <div className="text-sm font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
                Unix: {Math.floor(now.getTime() / 1000)}
              </div>
            </div>

            {/* Quick Timestamps */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                快速选择
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickTimestamps.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setTimestamp(item.value.toString());
                      setDateString(formatCustom(new Date(item.value * 1000)));
                    }}
                    className="px-2 py-1.5 text-xs transition-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timestamp Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Unix 时间戳（秒/毫秒）
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => {
                    setTimestamp(e.target.value.replace(/[^0-9]/g, ''));
                    if (e.target.value) {
                      const ts = parseInt(e.target.value);
                      if (!isNaN(ts)) {
                        const date = ts < 1e12 ? new Date(ts * 1000) : new Date(ts);
                        setDateString(formatCustom(date));
                      }
                    }
                  }}
                  placeholder="输入时间戳..."
                  className="flex-1 px-3 py-2 font-mono text-sm focus:outline-none"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    clipPath: clipPathRounded(6),
                  }}
                />
                <ToolButton onClick={setCurrentTime} icon={<RefreshCw className="w-4 h-4" />}>
                  现在
                </ToolButton>
              </div>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                日期时间
              </label>
              <input
                type="datetime-local"
                value={dateString}
                onChange={(e) => handleDateInput(e.target.value)}
                className="w-full px-3 py-2 text-sm focus:outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  clipPath: clipPathRounded(6),
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm" style={{ color: '#ef4444' }}>
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              转换结果
            </label>
            
            {formattedDates && !error ? (
              <div className="space-y-2">
                {[
                  { key: 'local', label: '本地时间', value: formattedDates.local },
                  { key: 'iso', label: 'ISO 8601', value: formattedDates.iso },
                  { key: 'utc', label: 'UTC', value: formattedDates.utc },
                  { key: 'date', label: '日期', value: formattedDates.date },
                  { key: 'time', label: '时间', value: formattedDates.time },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2 p-2.5 group"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px solid var(--border-subtle)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                        {item.label}
                      </span>
                      <div className="font-mono text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.value}
                      </div>
                    </div>
                    <button
                      onClick={() => copyValue(item.key, item.value)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{
                        background: copied === item.key ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-card)',
                        color: copied === item.key ? '#22c55e' : 'var(--text-muted)',
                      }}
                    >
                      {copied === item.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
                
                {/* Timestamps in different units */}
                <div className="mt-4 pt-4" style={{ borderTop: '2px solid var(--border-subtle)' }}>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="p-2.5"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--border-subtle)',
                        clipPath: clipPathRounded(4),
                      }}
                    >
                      <span className="text-xs block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                        秒级时间戳
                      </span>
                      <div className="font-mono text-sm" style={{ color: 'var(--accent-primary)' }}>
                        {parsedDate ? Math.floor(parsedDate.getTime() / 1000) : '-'}
                      </div>
                    </div>
                    <div
                      className="p-2.5"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--border-subtle)',
                        clipPath: clipPathRounded(4),
                      }}
                    >
                      <span className="text-xs block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                        毫秒时间戳
                      </span>
                      <div className="font-mono text-sm" style={{ color: 'var(--accent-primary)' }}>
                        {parsedDate ? parsedDate.getTime() : '-'}
                      </div>
                    </div>
                  </div>
                </div>
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
                  <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    输入时间戳或选择日期
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
  id: 'timestamp-converter',
  name: '时间戳转换',
  description: 'Unix 时间戳与日期时间格式互转',
  icon: Clock,
  category: 'converter' as const,
  keywords: ['timestamp', 'unix', '时间戳', '日期', 'date', '时间'],
  isPopular: true,
};

export const timestampConverterTool: ToolModule = {
  meta,
  Component: TimestampConverter,
};

export default timestampConverterTool;
