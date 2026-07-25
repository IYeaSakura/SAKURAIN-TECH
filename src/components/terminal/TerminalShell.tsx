/**
 * TerminalShell — a real command-line interface for browsing the blog.
 *
 * When the terminal style preset is active, this component replaces the normal
 * page rendering with a fullscreen shell. Users can run `ls`, `cd`, `cat`,
 * `posts`, `open`, etc. to navigate and read content, then switch back to the
 * visual browser with `open <path>` or the navigation toggle.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, X, Moon, Sun } from 'lucide-react';
import { useTheme, useStylePreset, useMusicPlayer } from '@/hooks';
import { cn } from '@/lib/utils';
import { useTerminalData } from './useTerminalData';
import { executeCommand, getCompletions } from './commands';
import { EarthApp } from './EarthApp';
import { ReaderApp } from './ReaderApp';
import { ImageApp } from './ImageApp';
import type { AppMode, TerminalLine } from './types';

const WELCOME: TerminalLine[] = [
  {
    type: 'info',
    content:
      'SAKURAIN terminal mode. Type `help` for commands, `open /` to return to visual browser.',
    id: 'welcome-1',
  },
  { type: 'info', content: '', id: 'welcome-2' },
];

function getPrompt(cwd: string): string {
  const prefix = cwd === '/' ? '~' : cwd;
  return `sakurain@blog:${prefix}$`;
}

export function TerminalShell() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { setPreset } = useStylePreset();
  const player = useMusicPlayer();
  const data = useTerminalData();

  const [history, setHistory] = useState<TerminalLine[]>(WELCOME);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/');
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [_historyIndex, setHistoryIndex] = useState(-1);
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [readerPayload, setReaderPayload] = useState<{ content: string; plain: boolean } | null>(
    null
  );
  const [imagePayload, setImagePayload] = useState<{ src: string } | null>(null);
  const [sessionStart] = useState(() => Date.now());

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new output.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on mount and when clicking the terminal.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleFocus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const addOutput = useCallback(
    (lines: TerminalLine[] | ((prev: TerminalLine[]) => TerminalLine[])) => {
      setHistory((prev) => {
        const next = typeof lines === 'function' ? lines(prev) : lines;
        return [...prev, ...next];
      });
    },
    []
  );

  const clearOutput = useCallback(() => {
    setHistory([]);
  }, []);

  const enterApp = useCallback((mode: AppMode, payload?: unknown) => {
    setAppMode(mode);
    if (mode === 'reader' && payload && typeof payload === 'object') {
      const p = payload as { content: string; plain: boolean };
      setReaderPayload({ content: p.content, plain: p.plain });
    }
    if (mode === 'image' && payload && typeof payload === 'object') {
      const p = payload as { src: string };
      setImagePayload({ src: p.src });
    }
  }, []);

  const exitApp = useCallback(() => {
    setAppMode(null);
    setReaderPayload(null);
    setImagePayload(null);
  }, []);

  const submitInput = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      setInputHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);
      addOutput([
        {
          type: 'input',
          prompt: getPrompt(cwd),
          content: trimmed,
          id: `in-${Date.now()}`,
        },
      ]);
      setInput('');

      executeCommand(trimmed, {
        cwd,
        setCwd,
        data,
        router,
        setPreset,
        theme,
        toggleTheme,
        player: {
          isPlaying: player.isPlaying,
          currentSong: player.currentSong,
          playlist: player.playlist,
          currentNumber: player.currentNumber,
          totalSongs: player.totalSongs,
          playMode: player.playMode,
          togglePlay: player.togglePlay,
          next: player.next,
          prev: player.prev,
          playSong: player.playSong,
          cyclePlayMode: player.cyclePlayMode,
        },
        addOutput,
        clearOutput,
        enterApp,
        exitApp,
        history: inputHistory,
        sessionStart,
      });
    },
    [cwd, data, router, setPreset, theme, toggleTheme, player, addOutput, clearOutput, enterApp, exitApp, inputHistory, sessionStart]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        submitInput(input);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const completions = getCompletions(input, {
          cwd,
          setCwd,
          data,
          router,
          setPreset,
          theme,
          toggleTheme,
          player: {
            isPlaying: player.isPlaying,
            currentSong: player.currentSong,
            playlist: player.playlist,
            currentNumber: player.currentNumber,
            totalSongs: player.totalSongs,
            playMode: player.playMode,
            togglePlay: player.togglePlay,
            next: player.next,
            prev: player.prev,
            playSong: player.playSong,
            cyclePlayMode: player.cyclePlayMode,
          },
          addOutput,
          clearOutput,
          enterApp,
          exitApp,
          history: inputHistory,
          sessionStart,
        });
        if (completions.length === 1) {
          const tokens = input.trimStart().split(/\s+/);
          if (tokens.length <= 1) {
            setInput(completions[0] + ' ');
          } else {
            tokens[tokens.length - 1] = completions[0];
            setInput(tokens.join(' '));
          }
        } else if (completions.length > 1) {
          addOutput([
            {
              type: 'info',
              content: completions.join('  '),
              id: `comp-${Date.now()}`,
            },
          ]);
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHistoryIndex((prev) => {
          const next = Math.min(prev + 1, inputHistory.length - 1);
          if (next >= 0 && next < inputHistory.length) {
            setInput(inputHistory[inputHistory.length - 1 - next]);
          }
          return next;
        });
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHistoryIndex((prev) => {
          const next = Math.max(prev - 1, -1);
          if (next === -1) {
            setInput('');
          } else if (next >= 0 && next < inputHistory.length) {
            setInput(inputHistory[inputHistory.length - 1 - next]);
          }
          return next;
        });
      }
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        clearOutput();
      }
    },
    [input, inputHistory, submitInput, clearOutput]
  );

  const exitTerminal = useCallback(() => {
    setPreset('default');
  }, [setPreset]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col font-mono text-sm"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
      onClick={handleFocus}
    >
      {/* Window title bar */}
      <header
        className="flex items-center justify-between px-4 h-10 border-b select-none"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex items-center gap-2 text-xs opacity-70">
            <Terminal className="w-3.5 h-3.5" />
            <span>sakurain@blog — terminal</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={exitTerminal}
            className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-500 transition-colors"
            title="Exit terminal mode"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 pb-20 whitespace-pre-wrap break-words"
        style={{ background: 'var(--bg-primary)' }}
      >
        {history.map((line) => (
          <div
            key={line.id}
            className={cn(
              'leading-relaxed',
              line.type === 'input' && 'text-[var(--text-primary)]',
              line.type === 'output' && 'text-[var(--text-secondary)]',
              line.type === 'listing' && 'text-[var(--text-secondary)]',
              line.type === 'error' && 'text-red-400',
              line.type === 'info' && 'text-[var(--accent-primary)]'
            )}
          >
            {line.type === 'input' ? (
              <span>
                <span className="text-[var(--accent-secondary)]">
                  {line.prompt ?? getPrompt(cwd)}
                </span>{' '}
                {line.content}
              </span>
            ) : line.type === 'listing' && line.entries ? (
              <span className="font-mono">
                {line.entries.map((entry, index) => (
                  <span key={index}>
                    <span
                      style={{
                        color: entry.isDirectory
                          ? 'var(--accent-primary)'
                          : 'var(--text-secondary)',
                        fontWeight: entry.isDirectory ? 'bold' : 'normal',
                      }}
                    >
                      {entry.name}
                    </span>
                    {index < line.entries!.length - 1 && (
                      <span style={{ color: 'var(--text-muted)' }}>{'  '}</span>
                    )}
                  </span>
                ))}
              </span>
            ) : (
              line.content
            )}
          </div>
        ))}

        {/* Active input line */}
        <div className="flex items-start gap-2 mt-1">
          <span className="text-[var(--accent-secondary)] shrink-0">{getPrompt(cwd)}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none min-w-0"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-primary)' }}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Terminal input"
          />
        </div>
      </div>

      {/* Status bar */}
      <footer
        className="flex items-center justify-between px-4 h-8 text-xs border-t"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        <div className="flex items-center gap-4">
          <span>zsh</span>
          <span>UTF-8</span>
          {data.loading && <span className="animate-pulse">loading indexes...</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>{cwd}</span>
          <span>{history.length} lines</span>
        </div>
      </footer>

      {/* Full-screen app overlays */}
      {appMode === 'earth' && <EarthApp onExit={exitApp} />}
      {appMode === 'reader' && readerPayload && (
        <ReaderApp content={readerPayload.content} plain={readerPayload.plain} onExit={exitApp} />
      )}
      {appMode === 'image' && imagePayload && <ImageApp src={imagePayload.src} onExit={exitApp} />}
    </div>
  );
}
