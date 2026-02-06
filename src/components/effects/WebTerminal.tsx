import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, Terminal as TerminalIconTerminal } from 'lucide-react';

interface WebTerminalProps {
  className?: string;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

interface Command {
  input: string;
  output: string[];
  timestamp: number;
}

// Available packages in Wasmer Registry
// Note: Wasmer registry contains language runtimes and applications,
// not individual Unix utilities like ls, cat, etc.
const WASMER_PACKAGES: Record<string, string> = {
  // Programming Languages
  'python': 'python/python',
  'python3': 'python/python',
  'ruby': 'ruby/ruby',
  'php': 'php/php',
  'node': 'node/node',
  // Shells
  'bash': 'wasmer/bash',
  'sh': 'wasmer/bash',
  'zsh': 'wasmer/zsh',
  'fish': 'wasmer/fish',
  // Tools
  'jq': 'jq/jq',
  'sqlite': 'sqlite/sqlite',
  'curl': 'curl/curl',
  'wget': 'wget/wget',
  'git': 'git/git',
  'nano': 'nano/nano',
  'vim': 'vim/vim',
  'less': 'less/less',
  'grep': 'grep/grep',
  'sed': 'sed/sed',
  'awk': 'awk/gawk',
};

const AVAILABLE_COMMANDS = {
  help: {
    description: '显示可用命令列表',
    execute: () => {
      return [
        '\x1b[38;5;208m╔════════════════════════════════════╗\x1b[0m',
        '\x1b[38;5;208m║\x1b[0m  \x1b[33mWebAssembly Terminal\x1b[0m              \x1b[38;5;208m║\x1b[0m',
        '\x1b[38;5;208m╚════════════════════════════════════╝\x1b[0m',
        '',
        '\x1b[31m⚠️  终端功能正在开发中，敬请期待！\x1b[0m',
        '',
        '\x1b[36m可用命令:\x1b[0m',
        '  \x1b[32mhelp\x1b[0m     - 显示此帮助信息',
        '  \x1b[32mclear\x1b[0m    - 清空终端',
        '',
        '\x1b[36m计划支持:\x1b[0m',
        '  • Python, Ruby, PHP, Node.js',
        '  • Bash, Zsh, Fish Shell',
        '  • jq, sqlite, curl, wget, git',
      ];
    },
  },
  clear: {
    description: '清空终端',
    execute: () => [],
  },
};

export const WebTerminal = memo(function WebTerminal({ 
  className = '', 
  isFullscreen = false,
  onFullscreenToggle 
}: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const currentInputRef = useRef('');
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);
  const historyIndexRef = useRef(-1);
  const [isFocused, setIsFocused] = useState(false);
  const isProcessingRef = useRef(false);
  const commandHistoryRef = useRef<Command[]>([]);


  useEffect(() => {
    commandHistoryRef.current = commandHistory;
  }, [commandHistory]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
      theme: {
        background: 'rgba(30, 30, 30, 0.95)',
        foreground: '#d4d4d4',
        cursor: 'var(--accent-primary)',
        selectionBackground: 'rgba(38, 139, 210, 0.3)',
        black: '#000000',
        red: '#ffff00',
        green: '#00ff00',
        yellow: '#ffff00',
        blue: '#0000ff',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        white: '#ffffff',
        brightBlack: '#808080',
        brightRed: '#ff0000',
        brightGreen: '#00ff00',
        brightYellow: '#ffff00',
        brightBlue: '#0000ff',
        brightMagenta: '#ff00ff',
        brightCyan: '#00ffff',
        brightWhite: '#ffffff',
      },
      allowTransparency: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const welcomeMessage = [
      '',
      '\x1b[38;5;208m╔════════════════════════════════════════════════════════╗\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m                                                            \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m  \x1b[35m�\x1b[0m  \x1b[33mWebAssembly Terminal - 开发中\x1b[0m  \x1b[35m�\x1b[0m                 \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m                                                            \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m  \x1b[31m该功能正在开发中，敬请期待...\x1b[0m                           \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m                                                            \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m  \x1b[36m计划功能:\x1b[0m                                                \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m  • WebAssembly 运行时环境                                  \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m  • 支持 Python, Ruby, PHP, Node.js 等多种语言              \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m  • 实时命令执行与输出                                       \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m║\x1b[0m                                                            \x1b[38;5;208m║\x1b[0m',
      '\x1b[38;5;208m╚════════════════════════════════════════════════════════╝\x1b[0m',
      '',
    ];

    welcomeMessage.forEach(line => terminal.writeln(line));

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 100);
    }
  }, [isFullscreen]);

  const writePrompt = useCallback(() => {
    if (!terminalInstanceRef.current) return;
    const terminal = terminalInstanceRef.current;
    terminal.write('\r\n\x1b[32m➜\x1b[0m \x1b[34mwasmer\x1b[0m \x1b[33m$\x1b[0m ');
  }, []);

  const runWasmerCommand = useCallback(async (_command: string, _args: string[]) => {
    if (!terminalInstanceRef.current) return;
    const terminal = terminalInstanceRef.current;

    // Terminal is under development
    terminal.writeln('\r\n\x1b[33m╔════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[33m║\x1b[0m  \x1b[31m⚠️  终端功能正在开发中\x1b[0m              \x1b[33m║\x1b[0m');
    terminal.writeln('\x1b[33m║\x1b[0m                                    \x1b[33m║\x1b[0m');
    terminal.writeln('\x1b[33m║\x1b[0m  我们正在努力完善 WebAssembly     \x1b[33m║\x1b[0m');
    terminal.writeln('\x1b[33m║\x1b[0m  终端功能，敬请期待！              \x1b[33m║\x1b[0m');
    terminal.writeln('\x1b[33m╚════════════════════════════════════╝\x1b[0m');
  }, []);

  const executeCommand = useCallback(async (input: string) => {
    if (!terminalInstanceRef.current || isProcessingRef.current) return;
    const terminal = terminalInstanceRef.current;

    const trimmedInput = input.trim();
    
    if (trimmedInput) {
      isProcessingRef.current = true;
      const newCommand = { input: trimmedInput, output: [], timestamp: Date.now() };
      setCommandHistory(prev => [...prev, newCommand]);
      historyIndexRef.current = -1;

      const parts = trimmedInput.split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (command === 'clear') {
        terminal.clear();
        writePrompt();
      } else if (command === 'help') {
        const cmd = AVAILABLE_COMMANDS.help;
        const output = cmd.execute();
        if (output.length > 0) {
          output.forEach(line => terminal.writeln('\r\n' + line));
        }
        writePrompt();
      } else if (command in WASMER_PACKAGES || command in AVAILABLE_COMMANDS) {
        await runWasmerCommand(command, args);
        writePrompt();
      } else if (trimmedInput) {
        terminal.writeln(`\r\n\x1b[31m命令未找到: ${command}\x1b[0m`);
        terminal.writeln('\r\n输入 \x1b[32mhelp\x1b[0m 查看可用命令');
        writePrompt();
      }
    } else {
      writePrompt();
    }

    setTimeout(() => {
      isProcessingRef.current = false;
    }, 100);
  }, [writePrompt, runWasmerCommand]);

  const handleData = useCallback((data: string) => {
    if (!terminalInstanceRef.current || isProcessingRef.current) return;
    const terminal = terminalInstanceRef.current;

    if (data === '\r') {
      terminal.write('\r\n');
      executeCommand(currentInputRef.current);
      currentInputRef.current = '';
    } else if (data === '\u007F') {
      if (currentInputRef.current.length > 0) {
        currentInputRef.current = currentInputRef.current.slice(0, -1);
        terminal.write('\b \b');
      }
    } else if (data === '\u001b[A') {
      const history = commandHistoryRef.current;
      if (historyIndexRef.current < history.length - 1) {
        const newIndex = historyIndexRef.current + 1;
        historyIndexRef.current = newIndex;
        const cmd = history[history.length - 1 - newIndex];
        if (cmd) {
          terminal.write('\r\x1b[K');
          writePrompt();
          terminal.write(cmd.input);
          currentInputRef.current = cmd.input;
        }
      }
    } else if (data === '\u001b[B') {
      const history = commandHistoryRef.current;
      if (historyIndexRef.current > 0) {
        const newIndex = historyIndexRef.current - 1;
        historyIndexRef.current = newIndex;
        const cmd = history[history.length - newIndex];
        if (cmd) {
          terminal.write('\r\x1b[K');
          writePrompt();
          terminal.write(cmd.input);
          currentInputRef.current = cmd.input;
        }
      } else if (historyIndexRef.current === 0) {
        historyIndexRef.current = -1;
        terminal.write('\r\x1b[K');
        writePrompt();
        currentInputRef.current = '';
      }
    } else if (!data.match(/[\x00-\x1F]/)) {
      currentInputRef.current += data;
      terminal.write(data);
    }
  }, [executeCommand, writePrompt]);

  useEffect(() => {
    if (!terminalInstanceRef.current) return;
    const terminal = terminalInstanceRef.current;

    const disposable = terminal.onData(handleData);
    writePrompt();

    return () => {
      disposable.dispose();
    };
  }, [handleData, writePrompt]);

  const handleTerminalFocus = useCallback(() => {
    setIsFocused(true);
    setTimeout(() => {
      terminalInstanceRef.current?.focus();
    }, 0);
  }, []);

  const handleTerminalBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--bg-card)',
        border: '2px solid var(--border-subtle)',
        boxShadow: isFullscreen 
          ? 'none' 
          : '0 10px 40px -10px var(--shadow-color)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: 'var(--error-color)' }}
              whileHover={{ scale: 1.2 }}
            />
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: 'var(--warning-color)' }}
              whileHover={{ scale: 1.2 }}
            />
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: 'var(--success-color)' }}
              whileHover={{ scale: 1.2 }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <TerminalIconTerminal className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span 
              className="text-xs font-mono"
              style={{ 
                color: 'var(--text-secondary)',
              }}
            >
              wasmer@wasm-terminal: ~
            </span>
          </div>
        </div>

        {onFullscreenToggle && (
          <motion.button
            onClick={onFullscreenToggle}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200"
            style={{
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              cursor: 'pointer',
            }}
            whileHover={{ 
              scale: 1.1,
              background: 'var(--accent-primary)',
            }}
            whileTap={{ scale: 0.95 }}
            title={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? (
              <X className="w-3.5 h-3.5" style={{ color: 'var(--text-primary)' }} />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--text-primary)' }} />
            )}
          </motion.button>
        )}
      </div>

      <div
        ref={terminalRef}
        className={`terminal-container ${isFocused ? 'focused' : ''}`}
        style={{
          height: isFullscreen ? 'calc(100vh - 60px)' : '400px',
          padding: '8px',
        }}
        onClick={handleTerminalFocus}
        onFocus={handleTerminalFocus}
        onBlur={handleTerminalBlur}
      />

      <div
        className="flex items-center justify-between px-4 py-1.5 text-xs"
        style={{
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          color: 'white',
        }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white/80" />
            WASI
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white/80" />
            WASIX
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white/80" />
            Wasmer-JS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>WebAssembly</span>
        </div>
      </div>

      <AnimatePresence>
        {!isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 10,
            }}
            onClick={handleTerminalFocus}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl"
              style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--accent-primary)',
                boxShadow: '0 0 30px var(--accent-glow)',
              }}
            >
              <TerminalIconTerminal className="w-10 h-10" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                点击激活 Wasmer-JS 终端
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

WebTerminal.displayName = 'WebTerminal';
