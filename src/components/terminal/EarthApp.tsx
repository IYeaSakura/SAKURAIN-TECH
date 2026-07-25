/**
 * Full-screen Earth Online terminal application.
 *
 * Renders a continuously rotating pixel-art globe alongside a numbered satellite
 * danmaku list. Users can `cat <number>` to inspect a danmaku's full details
 * (including markdown content) and press `q` or type `exit` to leave.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PixelGlobe } from './PixelGlobe';
import type { TerminalDanmaku } from './types';

interface EarthAppProps {
  onExit: () => void;
}

interface LogLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
}

export function EarthApp({ onExit }: EarthAppProps) {
  const [danmakus, setDanmakus] = useState<TerminalDanmaku[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<TerminalDanmaku | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  const nextLogId = () => {
    logIdRef.current += 1;
    return `earth-log-${logIdRef.current}`;
  };

  const addLog = useCallback((type: LogLine['type'], content: string) => {
    setLogs((prev) => [...prev, { id: nextLogId(), type, content }]);
  }, []);

  // Fetch danmaku list on mount.
  useEffect(() => {
    let mounted = true;
    async function fetchDanmakus() {
      try {
        const res = await fetch('/api/danmaku/list', {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('service unavailable');
        const data = (await res.json()) as TerminalDanmaku[];
        if (mounted) setDanmakus(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) addLog('error', 'Failed to load satellite danmaku.');
      }
    }
    fetchDanmakus();
    return () => {
      mounted = false;
    };
  }, [addLog]);

  // Initial welcome log.
  useEffect(() => {
    setLogs((prev) => {
      const welcome = 'Earth Online terminal app. Commands: cat <number>, q/exit to quit.';
      if (prev.some((l) => l.type === 'info' && l.content === welcome)) return prev;
      return [...prev, { id: nextLogId(), type: 'info', content: welcome }];
    });
  }, []);

  // Auto-scroll logs.
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Global 'q' shortcut exits the app unless the input is focused with text.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'q' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        onExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit]);

  // Keep input focused.
  useEffect(() => {
    inputRef.current?.focus();
  });

  const handleCommand = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addLog('input', `earth-app> ${trimmed}`);
    setInput('');

    if (trimmed === 'q' || trimmed === 'exit' || trimmed === 'quit') {
      onExit();
      return;
    }

    if (trimmed === 'help') {
      addLog(
        'info',
        'cat <number>  Show danmaku details\nq / exit      Leave Earth app'
      );
      return;
    }

    const catMatch = trimmed.match(/^cat\s+(\d+)$/i);
    if (catMatch) {
      const index = parseInt(catMatch[1], 10);
      const dm = danmakus[index - 1];
      if (!dm) {
        addLog('error', `No danmaku with number ${index}.`);
        return;
      }
      setSelected(dm);
      const time = new Date(dm.timestamp).toLocaleString('zh-CN');
      const detail = [
        `ID:        ${dm.id}`,
        `Text:      ${dm.text}`,
        `Orbit:     ${dm.orbitType.toUpperCase()}`,
        `Altitude:  ${(dm.altitude / 1000).toFixed(0)} km`,
        `Speed:     ${dm.speed.toExponential(3)} rad/s`,
        `Inclination: ${((dm.inclination * 180) / Math.PI).toFixed(1)}°`,
        `Time:      ${time}`,
      ].join('\n');
      addLog('output', detail);
      return;
    }

    addLog('error', `Unknown command: ${trimmed}`);
  }, [input, addLog, onExit, danmakus]);

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col p-4 font-mono text-sm"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Pixel Globe */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <PixelGlobe danmakus={danmakus} />
        </div>

        {/* Danmaku list */}
        <div
          className="w-80 flex-shrink-0 flex flex-col border-2 p-3 overflow-hidden"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div
            className="mb-2 font-bold border-b-2 pb-1"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Satellite Danmaku ({danmakus.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {danmakus.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No satellites on orbit.</div>
            ) : (
              <ul className="space-y-1">
                {danmakus.map((dm, i) => (
                  <li
                    key={dm.id}
                    className="truncate cursor-pointer hover:underline"
                    style={{
                      color:
                        selected?.id === dm.id
                          ? 'var(--accent-primary)'
                          : 'var(--text-secondary)',
                    }}
                    onClick={() => {
                      addLog('input', `earth-app> cat ${i + 1}`);
                      const time = new Date(dm.timestamp).toLocaleString('zh-CN');
                      const detail = [
                        `ID:        ${dm.id}`,
                        `Text:      ${dm.text}`,
                        `Orbit:     ${dm.orbitType.toUpperCase()}`,
                        `Altitude:  ${(dm.altitude / 1000).toFixed(0)} km`,
                        `Speed:     ${dm.speed.toExponential(3)} rad/s`,
                        `Inclination: ${((dm.inclination * 180) / Math.PI).toFixed(1)}°`,
                        `Time:      ${time}`,
                      ].join('\n');
                      addLog('output', detail);
                      setSelected(dm);
                    }}
                  >
                    <span style={{ color: 'var(--accent-primary)' }}>
                      {String(i + 1).padStart(2)}
                    </span>{' '}
                    [{dm.orbitType.toUpperCase()}] {dm.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Detail / log panel */}
      {logs.length > 0 && (
        <div
          className="mt-4 border-2 p-3 overflow-y-auto max-h-48"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          {logs.map((log) => (
            <div
              key={log.id}
              className="whitespace-pre-wrap"
              style={{
                color:
                  log.type === 'error'
                    ? 'var(--error)'
                    : log.type === 'info'
                    ? 'var(--accent-primary)'
                    : log.type === 'input'
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
              }}
            >
              {log.type === 'input' ? log.content : log.content}
            </div>
          ))}
          {selected?.markdown && (
            <div
              className="mt-2 prose prose-sm max-w-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ReactMarkdown>{selected.markdown}</ReactMarkdown>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Command input */}
      <div className="mt-4 flex items-center">
        <span style={{ color: 'var(--accent-primary)' }}>earth-app&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCommand();
          }}
          className="ml-2 flex-1 bg-transparent outline-none"
          style={{ color: 'var(--text-primary)' }}
          autoFocus
        />
      </div>
    </div>
  );
}
