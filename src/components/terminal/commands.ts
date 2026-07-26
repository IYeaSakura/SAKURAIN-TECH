/**
 * Terminal command registry and virtual file system.
 *
 * Commands operate on a virtual POSIX-like directory tree that maps to the
 * static site routes. `cd`, `ls`, `pwd` and `cat` feel like a real shell,
 * while `open` switches back to the visual browser mode.
 */

import type {
  TerminalCommand,
  CommandContext,
  TerminalBlogPost,
  TerminalNote,
  TerminalLine,
  TerminalDanmaku,
  TerminalComment,
} from './types';
import { generateAuthHeaders } from '@/lib/api-auth';

let commandId = 0;
let previousCwd = '/';

function nextId(): string {
  commandId += 1;
  return `term-${commandId}`;
}

const WELCOME_ART = `
   _____       _                  _         _   _
  / ____|     | |                | |       | | (_)
 | (___   __ _| | ___ _ __ __ _  | | __ _  | |_ _ _ __   __ _
  \\___ \\ / _\` | |/ _ \\ '__/ _\` | | |/ _\` | | __| | '_ \\ / _\` |
  ____) | (_| | |  __/ | | (_| | | | (_| | | |_| | | | | (_| |
 |_____/ \\__,_|_|\\___|_|  \\__,_| |_|\\__,_|  \\__|_|_| |_|\\__,_|
`;

const HELP_TABLE = [
  { cmd: 'help', desc: 'Show this help message' },
  { cmd: 'clear', desc: 'Clear the terminal screen' },
  { cmd: 'ls [path]', desc: 'List files and directories' },
  { cmd: 'cd <path>', desc: 'Change directory (supports .. and -)' },
  { cmd: 'pwd', desc: 'Print working directory' },
  { cmd: 'cat <file>', desc: 'Read a blog post, note or doc' },
  { cmd: 'read [-r] <file>', desc: 'Open file in fullscreen reader' },
  { cmd: 'view <image>', desc: 'Open an image as pixel art' },
  { cmd: 'sh <script>', desc: 'Run a game or app shell script' },
  { cmd: 'open <path>', desc: 'Open a page in visual browser mode' },
  { cmd: 'exit', desc: 'Leave terminal mode and return to visual mode' },
  { cmd: 'posts [n]', desc: 'List recent blog posts' },
  { cmd: 'notes [n]', desc: 'List recent notes' },
  { cmd: 'whoami', desc: 'About the author' },
  { cmd: 'neofetch', desc: 'System information' },
  { cmd: 'theme [light|dark|toggle]', desc: 'Change color theme' },
  { cmd: 'music [play|pause|next|prev|status]', desc: 'Control music player' },
  { cmd: 'earth [subcommand]', desc: 'ASCII Earth Online: globe, danmaku, comments' },
  { cmd: 'date', desc: 'Show current date and time' },
  { cmd: 'history', desc: 'Show command history' },
  { cmd: 'echo <text>', desc: 'Print text to the terminal' },
  { cmd: 'man <command>', desc: 'Show command manual' },
  { cmd: 'alias', desc: 'List command aliases' },
  { cmd: 'env', desc: 'Show environment variables' },
  { cmd: 'uname [-a]', desc: 'Show system/kernel information' },
  { cmd: 'hostname', desc: 'Show the site hostname' },
  { cmd: 'uptime', desc: 'Show terminal session uptime' },
  { cmd: 'df', desc: 'Show browser storage usage' },
  { cmd: 'free', desc: 'Show memory information' },
  { cmd: 'netstat', desc: 'Show network connection info' },
  { cmd: 'ping <host>', desc: 'Measure network latency' },
  { cmd: 'curl <url>', desc: 'Fetch a URL and print its body' },
  { cmd: 'cal', desc: 'Show this month calendar' },
  { cmd: 'find [path]', desc: 'Recursively list virtual files' },
  { cmd: 'grep <pattern> [path]', desc: 'Search file contents' },
  { cmd: 'wc <file>', desc: 'Count lines, words and bytes' },
  { cmd: 'head [-n] <file>', desc: 'Show first lines of a file' },
  { cmd: 'tail [-n] <file>', desc: 'Show last lines of a file' },
];

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return normalizePath(target);
  return normalizePath(`${cwd}/${target}`);
}

function normalizePath(p: string): string {
  const parts = p.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      stack.pop();
    } else if (part !== '.') {
      stack.push(part);
    }
  }
  return '/' + stack.join('/');
}

function basename(p: string): string {
  const normalized = normalizePath(p);
  if (normalized === '/') return '';
  const idx = normalized.lastIndexOf('/');
  return normalized.slice(idx + 1);
}

function pathToRoute(p: string): string {
  const normalized = normalizePath(p);
  if (normalized === '/') return '/';
  const base = basename(normalized);

  const routeMap: Record<string, string> = {
    'home.md': '/',
    'projects.tsx': '/projects',
    'friends.json': '/friends',
    'friends-circle.tsx': '/friends-circle',
    'earth-online.tsx': '/earth-online',
    'about.md': '/about',
    'shuoshuo.md': '/shuoshuo',
    'algo-viz.tsx': '/algo-viz',
  };

  if (routeMap[base]) return routeMap[base];

  const parts = normalized.split('/').filter(Boolean);
  if (parts[0] === 'blog' && parts.length === 2) {
    return `/blog/${base.replace(/\.md$/, '')}`;
  }
  if (parts[0] === 'shuoshuo' && parts.length === 2) {
    return `/shuoshuo/${base.replace(/\.md$/, '')}`;
  }
  if (parts[0] === 'docs') {
    return `/docs/${parts.slice(1).join('/')}`;
  }

  return normalized;
}

function getDirectoryEntries(ctx: CommandContext, p: string): string[] {
  const normalized = normalizePath(p);

  const rootEntries = [
    'home.md',
    'blog/',
    'shuoshuo/',
    'docs/',
    'photo/',
    'game/',
    'app/',
    'about.md',
  ];

  if (normalized === '/') return rootEntries;

  const parts = normalized.split('/').filter(Boolean);
  const first = parts[0];

  if (first === 'blog') {
    if (parts.length === 1) {
      return (
        ctx.data.blog?.posts.map((post) => `${post.slug}.md`) ?? [
          '<empty: run build to generate blog.json>',
        ]
      );
    }
    return [];
  }

  if (first === 'shuoshuo') {
    if (parts.length === 1) {
      return (
        ctx.data.notes?.notes.slice(0, 50).map((note) => `${note.slug}.md`) ?? [
          '<empty: run build to generate notes.json>',
        ]
      );
    }
    return [];
  }

  if (first === 'photo') {
    if (parts.length === 1) {
      return [
        'head.jpg',
        'by2024.webp',
        'by2025.webp',
        'tzb.webp',
        'logo.webp',
      ];
    }
    return [];
  }

  if (first === 'docs') {
    if (parts.length === 1) {
      return ctx.data.docs?.categories.map((cat) => `${cat.id}/`) ?? [];
    }
    const category = ctx.data.docs?.categories.find((c) => c.id === parts[1]);
    if (parts.length === 2) {
      return category?.items.map((item) => `${item.id}/`) ?? [];
    }
    const item = category?.items.find((i) => i.id === parts[2]);
    if (parts.length === 3) {
      if (item?.chapters) {
        return item.chapters.map((ch) => `${ch.id}.md`);
      }
      return [];
    }
    return [];
  }

  if (first === 'game') {
    if (parts.length === 1) {
      return ['snake.sh', 'pong.sh', 'breakout.sh'];
    }
    return [];
  }

  if (first === 'app') {
    if (parts.length === 1) {
      return ['earth.sh', 'clock.sh', 'stopwatch.sh'];
    }
    return [];
  }

  return [];
}

function isDirectory(ctx: CommandContext, p: string): boolean {
  const entries = getDirectoryEntries(ctx, p);
  return entries.length > 0;
}

async function readFileContent(ctx: CommandContext, p: string): Promise<string | null> {
  const normalized = normalizePath(p);
  const parts = normalized.split('/').filter(Boolean);
  const base = basename(normalized);

  if (normalized === '/home.md') {
    const site = ctx.data.site;
    return [
      `# ${site?.meta?.title ?? 'SAKURAIN'}`,
      '',
      site?.meta?.description ?? 'Personal blog and digital garden.',
      '',
      'Run `ls` to see available pages, or `help` for commands.',
    ].join('\n');
  }

  if (normalized === '/about.md') {
    const site = ctx.data.site;
    return [
      `# About ${site?.meta?.title ?? 'SAKURAIN'}`,
      '',
      site?.meta?.description ?? 'Personal blog and digital garden.',
      '',
      'Run `open about.md` to view the visual about page.',
    ].join('\n');
  }

  if (parts[0] === 'blog' && parts.length === 2) {
    const slug = base.replace(/\.md$/, '');
    const post = ctx.data.blog?.posts.find((b) => b.slug === slug);
    return post?.content ?? null;
  }

  if (parts[0] === 'shuoshuo' && parts.length === 2) {
    const slug = base.replace(/\.md$/, '');
    const note = ctx.data.notes?.notes.find((n) => n.slug === slug);
    return note?.content ?? null;
  }

  if (parts[0] === 'docs') {
    const route = pathToRoute(normalized);
    const publicPath = route.replace(/^\//, '') + '.md';
    try {
      const res = await fetch(`/${publicPath}`);
      if (res.ok) return res.text();
    } catch {
      return null;
    }
  }

  if (parts[0] === 'game' || parts[0] === 'app') {
    const script = SCRIPT_REGISTRY[normalized];
    if (script) {
      const meta = script.payload as { game?: string; app?: string };
      const name = meta.game ?? meta.app ?? 'app';
      return [
        `#!/bin/sh`,
        `# Launcher for the ${name} terminal ${parts[0]}.`,
        `# Run with: ./${basename(normalized)}  or  sh ${basename(normalized)}`,
        `exec sakurain-${parts[0]}-${name}`,
      ].join('\n');
    }
  }

  return null;
}

// ------------------------------------------------------------------
// Game / App launchers: virtual shell scripts under /game and /app.
// ------------------------------------------------------------------

const SCRIPT_REGISTRY: Record<string, { mode: import('./types').AppMode; payload: unknown }> = {
  '/game/snake.sh': { mode: 'game', payload: { game: 'snake' } },
  '/game/pong.sh': { mode: 'game', payload: { game: 'pong' } },
  '/game/breakout.sh': { mode: 'game', payload: { game: 'breakout' } },
  '/app/earth.sh': { mode: 'app', payload: { app: 'earth' } },
  '/app/clock.sh': { mode: 'app', payload: { app: 'clock' } },
  '/app/stopwatch.sh': { mode: 'app', payload: { app: 'stopwatch' } },
};

function runScript(resolvedPath: string, ctx: CommandContext): void {
  const normalized = normalizePath(resolvedPath);
  const script = SCRIPT_REGISTRY[normalized];
  if (!script) {
    ctx.addOutput([
      { type: 'error', content: `${basename(normalized)}: no such script`, id: nextId() },
    ]);
    return;
  }
  ctx.enterApp(script.mode, script.payload);
}

function formatList(entries: string[]): string {
  if (entries.length === 0) return 'total 0';
  const dirs = entries.filter((e) => e.endsWith('/'));
  const files = entries.filter((e) => !e.endsWith('/'));
  return [...dirs, ...files].join('  ');
}

function buildListingLine(entries: string[]): TerminalLine {
  const dirs = entries.filter((e) => e.endsWith('/'));
  const files = entries.filter((e) => !e.endsWith('/'));
  return {
    type: 'listing',
    content: formatList(entries),
    id: nextId(),
    entries: [...dirs, ...files].map((name) => ({
      name,
      isDirectory: name.endsWith('/'),
    })),
  };
}

// ------------------------------------------------------------------
// Earth Online helpers: ASCII globe, satellite danmaku and comments.
// ------------------------------------------------------------------

interface TerminalIdentity {
  nickname: string;
  email: string;
}

const IDENTITY_KEY = 'terminal:identity';

function getTerminalIdentity(): TerminalIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.nickname === 'string' &&
      typeof parsed.email === 'string' &&
      parsed.nickname.length >= 2 &&
      parsed.email.includes('@')
    ) {
      return parsed as TerminalIdentity;
    }
  } catch {
    // Ignore malformed identity.
  }
  return null;
}

function setTerminalIdentity(nickname: string, email: string): boolean {
  const normalizedNickname = nickname.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedNickname.length < 2 || normalizedNickname.length > 20) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return false;
  if (typeof window !== 'undefined') {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({
      nickname: normalizedNickname,
      email: normalizedEmail,
    }));
  }
  return true;
}

function formatDanmaku(dm: TerminalDanmaku, index: number): string {
  const time = new Date(dm.timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const orbit = dm.orbitType ? dm.orbitType.toUpperCase() : 'MEO';
  return `  ${String(index + 1).padStart(2)}  [${orbit}]  ${time}  ${dm.text}`;
}

function formatComment(comment: TerminalComment, indent = 0): string {
  const prefix = '  '.repeat(indent);
  const time = new Date(comment.createdAt).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const replyLabel = comment.replyTo ? ` (reply to ${comment.replyTo})` : '';
  const content = comment.content.replace(/\n/g, ' ');
  const lines = [
    `${prefix}${comment.nickname}${replyLabel} · ${time} · ${comment.browser}/${comment.os}`,
    `${prefix}> ${content}`,
  ];
  if (comment.replies && comment.replies.length > 0) {
    for (const reply of comment.replies) {
      lines.push(formatComment(reply, indent + 1));
    }
  }
  return lines.join('\n');
}

// ------------------------------------------------------------------
// Utility helpers for Linux-style terminal commands.
// ------------------------------------------------------------------

/**
 * Minimal browser network connection information shape.
 */
interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Format a millisecond duration as days/hours/minutes/seconds.
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

/**
 * Format a byte count using binary units (KiB, MiB, ...).
 */
function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0)} ${units[i]}`;
}

/**
 * Generate an ASCII calendar for the current month.
 */
function generateCalendar(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const header = `${monthName} ${year}`.padStart(20, ' ');
  const weekdays = 'Su Mo Tu We Th Fr Sa';
  const rows: string[] = [header, weekdays];

  let row = '   '.repeat(firstDay);
  for (let day = 1; day <= daysInMonth; day += 1) {
    row += `${day.toString().padStart(2)} `;
    if ((day + firstDay) % 7 === 0) {
      rows.push(row.trimEnd());
      row = '';
    }
  }
  if (row.trim()) {
    rows.push(row.trimEnd());
  }
  return rows.join('\n');
}

/**
 * Recursively collect virtual file paths under a directory.
 */
async function collectVirtualPaths(
  ctx: CommandContext,
  dir: string,
  prefix: string,
  out: string[]
): Promise<void> {
  const entries = getDirectoryEntries(ctx, dir);
  for (const entry of entries) {
    const name = entry.replace(/\/$/, '');
    const fullPath = prefix ? `${prefix}/${name}` : name;
    out.push(entry.endsWith('/') ? `${fullPath}/` : fullPath);
    if (entry.endsWith('/')) {
      await collectVirtualPaths(ctx, resolvePath(dir, entry), fullPath, out);
    }
  }
}

/**
 * Count lines, words, characters and bytes in a string.
 */
function countContent(content: string): { lines: number; words: number; chars: number; bytes: number } {
  const lines = content.split('\n').length;
  const words = content.trim() === '' ? 0 : content.split(/\s+/).length;
  const chars = content.length;
  const bytes = new TextEncoder().encode(content).length;
  return { lines, words, chars, bytes };
}

const commands: TerminalCommand[] = [
  {
    name: 'help',
    description: 'Show available commands',
    execute(_args, ctx) {
      ctx.addOutput([
        { type: 'info', content: WELCOME_ART, id: nextId() },
        {
          type: 'info',
          content: 'Welcome to SAKURAIN terminal mode. Browse the blog like a filesystem.',
          id: nextId(),
        },
        { type: 'info', content: '', id: nextId() },
        {
          type: 'info',
          content: HELP_TABLE.map((h) => `  ${h.cmd.padEnd(30)} ${h.desc}`).join('\n'),
          id: nextId(),
        },
      ]);
    },
  },
  {
    name: 'clear',
    description: 'Clear the terminal',
    execute(_args, ctx) {
      ctx.clearOutput();
    },
  },
  {
    name: 'pwd',
    description: 'Print working directory',
    execute(_args, ctx) {
      ctx.addOutput([{ type: 'output', content: ctx.cwd, id: nextId() }]);
    },
  },
  {
    name: 'cd',
    description: 'Change directory',
    usage: 'cd <path>',
    execute(args, ctx) {
      const target = args[0] ?? '~';
      if (target === '~' || target === '') {
        previousCwd = ctx.cwd;
        ctx.setCwd('/');
        return;
      }
      if (target === '-') {
        const back = previousCwd;
        previousCwd = ctx.cwd;
        ctx.setCwd(back);
        ctx.addOutput([{ type: 'output', content: back, id: nextId() }]);
        return;
      }
      const resolved = resolvePath(ctx.cwd, target);
      if (!isDirectory(ctx, resolved)) {
        ctx.addOutput([
          { type: 'error', content: `cd: not a directory: ${target}`, id: nextId() },
        ]);
        return;
      }
      previousCwd = ctx.cwd;
      ctx.setCwd(resolved);
    },
  },
  {
    name: 'ls',
    description: 'List directory contents',
    usage: 'ls [path]',
    execute(args, ctx) {
      const target = args[0] ?? ctx.cwd;
      const resolved = resolvePath(ctx.cwd, target);
      if (!isDirectory(ctx, resolved)) {
        ctx.addOutput([
          { type: 'error', content: `ls: ${target}: No such file or directory`, id: nextId() },
        ]);
        return;
      }
      ctx.addOutput([buildListingLine(getDirectoryEntries(ctx, resolved))]);
    },
  },
  {
    name: 'cat',
    description: 'Read file contents',
    usage: 'cat <file>',
    async execute(args, ctx) {
      const target = args[0];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'cat: missing file operand', id: nextId() }]);
        return;
      }
      const resolved = resolvePath(ctx.cwd, target);
      const content = await readFileContent(ctx, resolved);
      if (content === null) {
        ctx.addOutput([
          { type: 'error', content: `cat: ${target}: No such file or directory`, id: nextId() },
        ]);
        return;
      }
      ctx.addOutput([{ type: 'output', content, id: nextId() }]);
    },
  },
  {
    name: 'read',
    description: 'Open a file in the fullscreen reader',
    usage: 'read [-r] <file>',
    aliases: ['r'],
    async execute(args, ctx) {
      const plain = args[0] === '-r';
      const target = plain ? args[1] : args[0];
      if (!target) {
        ctx.addOutput([
          { type: 'error', content: 'read: missing file operand', id: nextId() },
        ]);
        return;
      }
      const resolved = resolvePath(ctx.cwd, target);
      const content = await readFileContent(ctx, resolved);
      if (content === null) {
        ctx.addOutput([
          { type: 'error', content: `read: ${target}: No such file or directory`, id: nextId() },
        ]);
        return;
      }
      ctx.enterApp('reader', { content, plain });
    },
  },
  {
    name: 'view',
    description: 'Open an image as pixel art',
    usage: 'view <image>',
    aliases: ['v'],
    async execute(args, ctx) {
      const target = args[0];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'view: missing image operand', id: nextId() }]);
        return;
      }
      // Resolve relative image paths against the current working directory,
      // just like `cat` does, while leaving absolute URLs untouched.
      const url = /^https?:\/\//.test(target) ? target : resolvePath(ctx.cwd, target);

      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('load failed'));
          img.src = url;
        });
        ctx.enterApp('image', { src: url });
      } catch {
        ctx.addOutput([
          { type: 'error', content: `view: ${target}: failed to load image`, id: nextId() },
        ]);
      }
    },
  },
  {
    name: 'sh',
    description: 'Execute a shell script from /game or /app',
    usage: 'sh <script>',
    execute(args, ctx) {
      const target = args[0];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'sh: missing script operand', id: nextId() }]);
        return;
      }
      const resolved = resolvePath(ctx.cwd, target);
      runScript(resolved, ctx);
    },
  },
  {
    name: 'open',
    description: 'Open a route in visual browser mode',
    usage: 'open <path>',
    execute(args, ctx) {
      const target = args[0];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'open: missing path operand', id: nextId() }]);
        return;
      }
      const resolved = resolvePath(ctx.cwd, target);
      const route = pathToRoute(resolved);
      ctx.addOutput([
        {
          type: 'info',
          content: `Switching to visual mode and opening ${route}...`,
          id: nextId(),
        },
      ]);
      ctx.setPreset('default');
      ctx.router.push(route);
    },
  },
  {
    name: 'exit',
    description: 'Leave terminal mode and return to visual mode',
    execute(_args, ctx) {
      ctx.addOutput([
        {
          type: 'info',
          content: 'Leaving terminal mode...',
          id: nextId(),
        },
      ]);
      ctx.setPreset('default');
    },
  },
  {
    name: 'date',
    description: 'Show current date and time',
    execute(_args, ctx) {
      const now = new Date();
      ctx.addOutput([
        {
          type: 'output',
          content: now.toLocaleString('zh-CN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          id: nextId(),
        },
      ]);
    },
  },
  {
    name: 'history',
    description: 'Show command history',
    aliases: ['hist'],
    execute(_args, ctx) {
      const history = ctx.history;
      if (history.length === 0) {
        ctx.addOutput([{ type: 'output', content: 'No command history yet.', id: nextId() }]);
        return;
      }
      const lines = history.map((cmd, i) => `${String(i + 1).padStart(4)}  ${cmd}`);
      ctx.addOutput([{ type: 'output', content: lines.join('\n'), id: nextId() }]);
    },
  },
  {
    name: 'echo',
    description: 'Print arguments to the terminal',
    usage: 'echo <text>',
    execute(args, ctx) {
      ctx.addOutput([{ type: 'output', content: args.join(' '), id: nextId() }]);
    },
  },
  {
    name: 'man',
    description: 'Show command manual',
    usage: 'man <command>',
    execute(args, ctx) {
      const target = args[0];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'man: missing command operand', id: nextId() }]);
        return;
      }
      const cmd = commandMap.get(target);
      if (!cmd) {
        ctx.addOutput([
          { type: 'error', content: `man: no manual entry for ${target}`, id: nextId() },
        ]);
        return;
      }
      const lines = [
        `NAME`,
        `  ${cmd.name} - ${cmd.description}`,
        ``,
        `SYNOPSIS`,
        `  ${cmd.usage ?? cmd.name}`,
      ];
      if (cmd.aliases && cmd.aliases.length > 0) {
        lines.push('', `ALIASES`, `  ${cmd.aliases.join(', ')}`);
      }
      ctx.addOutput([{ type: 'output', content: lines.join('\n'), id: nextId() }]);
    },
  },
  {
    name: 'alias',
    description: 'List command aliases',
    execute(_args, ctx) {
      const lines = commands
        .filter((cmd) => cmd.aliases && cmd.aliases.length > 0)
        .map((cmd) => `  ${cmd.name}=${cmd.aliases?.join('|')}`);
      if (lines.length === 0) {
        ctx.addOutput([{ type: 'output', content: 'No aliases defined.', id: nextId() }]);
        return;
      }
      ctx.addOutput([{ type: 'output', content: lines.join('\n'), id: nextId() }]);
    },
  },
  {
    name: 'env',
    description: 'Show environment variables',
    execute(_args, ctx) {
      const env: Record<string, string> = {
        SHELL: 'sakurain-term',
        TERM: 'xterm-256color',
        HOME: '/',
        PWD: ctx.cwd,
        HOSTNAME: typeof window !== 'undefined' ? window.location.host : 'sakurain',
        LANG: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
        THEME: ctx.theme,
        USER: 'guest',
        USER_AGENT: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        PLATFORM: typeof navigator !== 'undefined' ? navigator.platform : '',
      };
      const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
      ctx.addOutput([{ type: 'output', content: lines.join('\n'), id: nextId() }]);
    },
  },
  {
    name: 'hostname',
    description: 'Show the site hostname',
    execute(_args, ctx) {
      const host = typeof window !== 'undefined' ? window.location.host : 'sakurain';
      ctx.addOutput([{ type: 'output', content: host, id: nextId() }]);
    },
  },
  {
    name: 'uptime',
    description: 'Show terminal session uptime',
    execute(_args, ctx) {
      const elapsed = Date.now() - ctx.sessionStart;
      ctx.addOutput([
        { type: 'output', content: `up ${formatDuration(elapsed)}`, id: nextId() },
      ]);
    },
  },
  {
    name: 'uname',
    description: 'Show system information',
    usage: 'uname [-a]',
    execute(args, ctx) {
      const full = args[0] === '-a';
      if (full) {
        const info = [
          `Kernel: Browser`,
          `Node: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'}`,
          `Platform: ${typeof navigator !== 'undefined' ? navigator.platform : 'unknown'}`,
          `Language: ${typeof navigator !== 'undefined' ? navigator.language : 'unknown'}`,
          `Cores: ${typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 'unknown'}`,
        ];
        ctx.addOutput([{ type: 'output', content: info.join('\n'), id: nextId() }]);
      } else {
        ctx.addOutput([{ type: 'output', content: 'Browser', id: nextId() }]);
      }
    },
  },
  {
    name: 'df',
    description: 'Show browser storage usage',
    execute(_args, ctx) {
      if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
        ctx.addOutput([
          { type: 'error', content: 'df: storage estimation not available', id: nextId() },
        ]);
        return;
      }
      navigator.storage.estimate().then((estimate) => {
        const quota = estimate.quota ?? 0;
        const usage = estimate.usage ?? 0;
        const lines = [
          'Filesystem      Size      Used     Avail Use%',
          `browser    ${formatBytes(quota).padStart(9)} ${formatBytes(usage).padStart(9)} ${formatBytes(quota - usage).padStart(9)} ${quota ? Math.round((usage / quota) * 100).toString().padStart(3) : '0'}%`,
        ];
        ctx.addOutput([{ type: 'output', content: lines.join('\n'), id: nextId() }]);
      });
    },
  },
  {
    name: 'free',
    description: 'Show memory information',
    execute(_args, ctx) {
      const deviceMemory =
        typeof navigator !== 'undefined' && 'deviceMemory' in navigator
          ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
          : undefined;
      const memory =
        typeof performance !== 'undefined' && 'memory' in performance
          ? (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
          : undefined;
      const lines = [
        '              total        used        free',
        `Device: ${deviceMemory ? `${deviceMemory} GB` : 'n/a'}`,
      ];
      if (memory) {
        lines.push(
          `JS Heap: ${formatBytes(memory.jsHeapSizeLimit).padStart(13)} ${formatBytes(memory.usedJSHeapSize).padStart(11)} ${formatBytes(memory.jsHeapSizeLimit - memory.usedJSHeapSize).padStart(11)}`
        );
      }
      ctx.addOutput([{ type: 'output', content: lines.join('\n'), id: nextId() }]);
    },
  },
  {
    name: 'netstat',
    description: 'Show network connection information',
    execute(_args, ctx) {
      const conn =
        typeof navigator !== 'undefined' && 'connection' in navigator
          ? (navigator as Navigator & { connection?: NetworkInfo }).connection
          : undefined;
      if (!conn) {
        ctx.addOutput([
          { type: 'error', content: 'netstat: network information not available', id: nextId() },
        ]);
        return;
      }
      const info = conn as NetworkInfo;
      const lines = [
        `Effective type: ${info.effectiveType ?? 'unknown'}`,
        `Downlink: ${info.downlink ?? 'unknown'} Mbps`,
        `RTT: ${info.rtt ?? 'unknown'} ms`,
        `Save data: ${info.saveData ?? 'unknown'}`,
      ];
      ctx.addOutput([{ type: 'output', content: lines.join('\n'), id: nextId() }]);
    },
  },
  {
    name: 'ping',
    description: 'Measure network latency to a host',
    usage: 'ping <host>',
    aliases: ['p'],
    async execute(args, ctx) {
      const target = args[0];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'ping: missing host operand', id: nextId() }]);
        return;
      }
      const url = /^https?:\/\//.test(target) ? target : `https://${target}`;
      const start = performance.now();
      try {
        await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        const ms = Math.round(performance.now() - start);
        ctx.addOutput([{ type: 'output', content: `${url}: ${ms} ms`, id: nextId() }]);
      } catch {
        ctx.addOutput([
          { type: 'error', content: `ping: ${target}: host unreachable`, id: nextId() },
        ]);
      }
    },
  },
  {
    name: 'curl',
    description: 'Fetch a URL and print its body',
    usage: 'curl <url>',
    async execute(args, ctx) {
      const target = args[0];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'curl: missing URL operand', id: nextId() }]);
        return;
      }
      const url = /^https?:\/\//.test(target) || target.startsWith('/') ? target : `https://${target}`;
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          ctx.addOutput([
            { type: 'error', content: `curl: ${target}: HTTP ${res.status}`, id: nextId() },
          ]);
          return;
        }
        const text = await res.text();
        const preview = text.slice(0, 2000);
        ctx.addOutput([
          { type: 'output', content: preview, id: nextId() },
          {
            type: 'info',
            content: text.length > 2000 ? `... ${text.length - 2000} more bytes` : '',
            id: nextId(),
          },
        ]);
      } catch {
        ctx.addOutput([
          { type: 'error', content: `curl: ${target}: request failed`, id: nextId() },
        ]);
      }
    },
  },
  {
    name: 'cal',
    description: 'Show this month calendar',
    execute(_args, ctx) {
      ctx.addOutput([{ type: 'output', content: generateCalendar(), id: nextId() }]);
    },
  },
  {
    name: 'find',
    description: 'Recursively list virtual files',
    usage: 'find [path]',
    async execute(args, ctx) {
      const target = args[0] ?? ctx.cwd;
      const resolved = resolvePath(ctx.cwd, target);
      if (!isDirectory(ctx, resolved)) {
        ctx.addOutput([
          { type: 'error', content: `find: ${target}: No such directory`, id: nextId() },
        ]);
        return;
      }
      const out: string[] = [];
      await collectVirtualPaths(ctx, resolved, '', out);
      ctx.addOutput([{ type: 'output', content: out.join('\n') || resolved, id: nextId() }]);
    },
  },
  {
    name: 'grep',
    description: 'Search file contents for a pattern',
    usage: 'grep <pattern> [path]',
    async execute(args, ctx) {
      const pattern = args[0];
      if (!pattern) {
        ctx.addOutput([
          { type: 'error', content: 'grep: missing pattern operand', id: nextId() },
        ]);
        return;
      }
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, 'i');
      } catch {
        ctx.addOutput([
          { type: 'error', content: `grep: invalid regular expression: ${pattern}`, id: nextId() },
        ]);
        return;
      }
      const target = args[1] ?? ctx.cwd;
      const resolved = resolvePath(ctx.cwd, target);
      const out: string[] = [];
      await collectVirtualPaths(ctx, resolved, '', out);
      const files = out.filter((p) => !p.endsWith('/'));
      const matches: string[] = [];
      for (const file of files.slice(0, 200)) {
        const filePath = resolved === '/' ? `/${file}` : `${resolved}/${file}`;
        const content = await readFileContent(ctx, filePath);
        if (content === null) continue;
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i += 1) {
          if (regex.test(lines[i])) {
            matches.push(`${file}:${i + 1}:${lines[i]}`);
            if (matches.length >= 50) break;
          }
        }
        if (matches.length >= 50) break;
      }
      if (matches.length === 0) {
        ctx.addOutput([{ type: 'output', content: 'No matches found.', id: nextId() }]);
        return;
      }
      ctx.addOutput([{ type: 'output', content: matches.join('\n'), id: nextId() }]);
    },
  },
  {
    name: 'wc',
    description: 'Count lines, words, characters and bytes',
    usage: 'wc <file>',
    async execute(args, ctx) {
      const target = args[0];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'wc: missing file operand', id: nextId() }]);
        return;
      }
      const resolved = resolvePath(ctx.cwd, target);
      const content = await readFileContent(ctx, resolved);
      if (content === null) {
        ctx.addOutput([
          { type: 'error', content: `wc: ${target}: No such file or directory`, id: nextId() },
        ]);
        return;
      }
      const counts = countContent(content);
      ctx.addOutput([
        {
          type: 'output',
          content: `${counts.lines.toString().padStart(4)} ${counts.words.toString().padStart(5)} ${counts.bytes.toString().padStart(6)} ${target}`,
          id: nextId(),
        },
      ]);
    },
  },
  {
    name: 'head',
    description: 'Show first lines of a file',
    usage: 'head [-n] <file>',
    async execute(args, ctx) {
      let count = 10;
      let fileIndex = 0;
      if (args[0] === '-n') {
        count = parseInt(args[1] ?? '10', 10) || 10;
        fileIndex = 2;
      } else if (args[0] && args[0].startsWith('-')) {
        count = parseInt(args[0].slice(1), 10) || 10;
        fileIndex = 1;
      }
      const target = args[fileIndex];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'head: missing file operand', id: nextId() }]);
        return;
      }
      const resolved = resolvePath(ctx.cwd, target);
      const content = await readFileContent(ctx, resolved);
      if (content === null) {
        ctx.addOutput([
          { type: 'error', content: `head: ${target}: No such file or directory`, id: nextId() },
        ]);
        return;
      }
      const lines = content.split('\n').slice(0, count).join('\n');
      ctx.addOutput([{ type: 'output', content: lines, id: nextId() }]);
    },
  },
  {
    name: 'tail',
    description: 'Show last lines of a file',
    usage: 'tail [-n] <file>',
    async execute(args, ctx) {
      let count = 10;
      let fileIndex = 0;
      if (args[0] === '-n') {
        count = parseInt(args[1] ?? '10', 10) || 10;
        fileIndex = 2;
      } else if (args[0] && args[0].startsWith('-')) {
        count = parseInt(args[0].slice(1), 10) || 10;
        fileIndex = 1;
      }
      const target = args[fileIndex];
      if (!target) {
        ctx.addOutput([{ type: 'error', content: 'tail: missing file operand', id: nextId() }]);
        return;
      }
      const resolved = resolvePath(ctx.cwd, target);
      const content = await readFileContent(ctx, resolved);
      if (content === null) {
        ctx.addOutput([
          { type: 'error', content: `tail: ${target}: No such file or directory`, id: nextId() },
        ]);
        return;
      }
      const lines = content.split('\n');
      const tailLines = lines.slice(Math.max(0, lines.length - count)).join('\n');
      ctx.addOutput([{ type: 'output', content: tailLines, id: nextId() }]);
    },
  },
  {
    name: 'posts',
    description: 'List recent blog posts',
    usage: 'posts [count]',
    execute(args, ctx) {
      const count = Math.min(parseInt(args[0] ?? '10', 10) || 10, 50);
      const posts = ctx.data.blog?.posts.slice(0, count) ?? [];
      if (posts.length === 0) {
        ctx.addOutput([{ type: 'output', content: 'No posts found.', id: nextId() }]);
        return;
      }
      const lines = posts.map((post: TerminalBlogPost, i: number) => {
        const tags = post.tags.length ? ` [${post.tags.join(', ')}]` : '';
        return `  ${(i + 1).toString().padStart(2)}  ${post.date}  ${post.title}${tags}`;
      });
      ctx.addOutput([
        { type: 'output', content: lines.join('\n'), id: nextId() },
        {
          type: 'info',
          content: `\nUse \`cat blog/<slug>.md\` to read a post, or \`open blog/<slug>.md\` for the visual page.`,
          id: nextId(),
        },
      ]);
    },
  },
  {
    name: 'notes',
    description: 'List recent notes',
    usage: 'notes [count]',
    execute(args, ctx) {
      const count = Math.min(parseInt(args[0] ?? '10', 10) || 10, 50);
      const notes = ctx.data.notes?.notes.slice(0, count) ?? [];
      if (notes.length === 0) {
        ctx.addOutput([{ type: 'output', content: 'No notes found.', id: nextId() }]);
        return;
      }
      const lines = notes.map((note: TerminalNote, i: number) => {
        return `  ${(i + 1).toString().padStart(2)}  ${note.fullDate} ${note.fullTime}  ${note.title}`;
      });
      ctx.addOutput([
        { type: 'output', content: lines.join('\n'), id: nextId() },
        {
          type: 'info',
          content: `\nUse \`cat shuoshuo/<slug>.md\` to read a note.`,
          id: nextId(),
        },
      ]);
    },
  },
  {
    name: 'whoami',
    description: 'About the author',
    execute(_args, ctx) {
      const site = ctx.data.site;
      ctx.addOutput([
        {
          type: 'output',
          content: [
            `Author: ${site?.meta?.title ?? 'SAKURAIN'}`,
            '',
            site?.meta?.description ?? 'A personal blog about code, systems and curiosity.',
            '',
            'Run `open about.md` to read more.',
          ].join('\n'),
          id: nextId(),
        },
      ]);
    },
  },
  {
    name: 'neofetch',
    description: 'Show system information',
    execute(_args, ctx) {
      const uptime =
        typeof window !== 'undefined' ? `${Math.round(performance.now() / 1000)}s` : 'unknown';
      ctx.addOutput([
        {
          type: 'output',
          content: [
            '      ___           ___           ___           ___         ___',
            '     /\\__\\         /\\  \\         /\\  \\         /\\  \\       /\\__\\',
            '    /:/ _/_       /::\\  \\       /::\\  \\       /::\\  \\     /:/ _/_',
            '   /:/ /\\__\\     /:/\\:\\  \\     /:/\\:\\  \\     /:/\\:\\  \\   /:/ /\\__\\',
            '  /:/ /:/ _/_   /:/  \\:\\  \\   /:/  \\:\\  \\   /:/  \\:\\  \\ /:/ /:/ _/_',
            ' /:/_/:/ /\\__\\ /:/__/ \\:\\__\\ /:/__/ \\:\\__\\ /:/__/ \\:\\__\\ /:/_/:/ /\\__\\',
            ' \\:\/:/ /:/  / \\:\  \\ /:/  / \\:\  \\ /:/  / \\:\  \\ /:/  / \\:\/:/ /:/  /',
            '  \\::/_/:/  /   \\:\  /:/  /   \\:\  /:/  /   \\:\  /:/  /   \\::/_/:/  /',
            '   \\:\/:/  /     \\:\/:/  /     \\:\/:/  /     \\:\/:/  /     \\:\/:/  /',
            '    \\::/  /       \\::/  /       \\::/  /       \\::/  /       \\::/  /',
            '     \\/__/         \\/__/         \\/__/         \\/__/         \\/__/',
            '',
            `OS: Browser / Next.js Static`,
            `Shell: sakurain-term v1.0`,
            `Theme: ${ctx.theme}`,
            `Uptime: ${uptime}`,
            `Posts: ${ctx.data.blog?.posts.length ?? 0}`,
            `Notes: ${ctx.data.notes?.notes.length ?? 0}`,
            '',
            '████████████████████████████████████████',
          ].join('\n'),
          id: nextId(),
        },
      ]);
    },
  },
  {
    name: 'theme',
    description: 'Toggle or set the color theme',
    usage: 'theme [light|dark|toggle]',
    execute(args, ctx) {
      const sub = args[0] ?? 'toggle';
      if (sub === 'toggle') {
        ctx.toggleTheme();
        ctx.addOutput([
          {
            type: 'info',
            content: `Theme toggled to ${ctx.theme === 'light' ? 'dark' : 'light'}.`,
            id: nextId(),
          },
        ]);
      } else if (sub === 'light' || sub === 'dark') {
        if (ctx.theme !== sub) ctx.toggleTheme();
        ctx.addOutput([{ type: 'info', content: `Theme set to ${sub}.`, id: nextId() }]);
      } else {
        ctx.addOutput([
          { type: 'error', content: 'theme: usage: theme [light|dark|toggle]', id: nextId() },
        ]);
      }
    },
  },
  {
    name: 'music',
    description: 'Control the music player',
    usage: 'music [play|pause|next|prev|status|list|mode|<index>|<title>]',
    execute(args, ctx) {
      const player = ctx.player;
      if (!player) {
        ctx.addOutput([{ type: 'error', content: 'music: player not available', id: nextId() }]);
        return;
      }

      const sub = args[0];

      // No arguments: toggle play/pause like a media key.
      if (!sub) {
        player.togglePlay();
        ctx.addOutput([
          {
            type: 'info',
            content: `Music ${player.isPlaying ? 'paused' : 'playing'}.`,
            id: nextId(),
          },
        ]);
        return;
      }

      switch (sub) {
        case 'play':
        case 'pause': {
          player.togglePlay();
          ctx.addOutput([
            {
              type: 'info',
              content: `Music ${player.isPlaying ? 'paused' : 'playing'}.`,
              id: nextId(),
            },
          ]);
          break;
        }
        case 'next': {
          player.next();
          ctx.addOutput([{ type: 'info', content: 'Skipped to next track.', id: nextId() }]);
          break;
        }
        case 'prev': {
          player.prev();
          ctx.addOutput([{ type: 'info', content: 'Skipped to previous track.', id: nextId() }]);
          break;
        }
        case 'status': {
          ctx.addOutput([
            {
              type: 'output',
              content: [
                `Status: ${player.isPlaying ? 'playing' : 'paused'}`,
                `Mode: ${player.playMode}`,
                `Track: ${player.currentNumber}/${player.totalSongs} ${player.currentSong.title}`,
                `Artist: ${player.currentSong.artist}`,
              ].join('\n'),
              id: nextId(),
            },
          ]);
          break;
        }
        case 'list': {
          if (player.playlist.length === 0) {
            ctx.addOutput([{ type: 'output', content: 'Playlist is empty.', id: nextId() }]);
            return;
          }
          const lines = player.playlist.map((song, index) => {
            const marker = song.id === player.currentSong.id ? '> ' : '  ';
            return `${marker}${String(index + 1).padStart(2)}  ${song.title} — ${song.artist}`;
          });
          ctx.addOutput([
            { type: 'output', content: lines.join('\n'), id: nextId() },
            {
              type: 'info',
              content: 'Use `music <index>` or `music <title>` to play a specific track.',
              id: nextId(),
            },
          ]);
          break;
        }
        case 'mode': {
          player.cyclePlayMode();
          ctx.addOutput([
            { type: 'info', content: `Play mode switched to ${player.playMode}.`, id: nextId() },
          ]);
          break;
        }
        default: {
          // Try to interpret the argument as a 1-based track index.
          const index = parseInt(sub, 10);
          if (!Number.isNaN(index) && index >= 1 && index <= player.playlist.length) {
            const song = player.playlist[index - 1];
            if (song) {
              player.playSong(song.id);
              ctx.addOutput([
                {
                  type: 'info',
                  content: `Now playing: ${song.title} — ${song.artist}`,
                  id: nextId(),
                },
              ]);
            }
            return;
          }

          // Otherwise search by title or artist substring.
          const query = sub.toLowerCase();
          const match = player.playlist.find(
            (song) =>
              song.title.toLowerCase().includes(query) ||
              song.artist.toLowerCase().includes(query)
          );
          if (match) {
            player.playSong(match.id);
            ctx.addOutput([
              {
                type: 'info',
                content: `Now playing: ${match.title} — ${match.artist}`,
                id: nextId(),
              },
            ]);
            return;
          }

          ctx.addOutput([
            {
              type: 'error',
              content: `music: no matching track: ${sub}`,
              id: nextId(),
            },
          ]);
        }
      }
    },
  },
  {
    name: 'earth',
    description: 'ASCII Earth Online: globe, satellite danmaku and comments',
    usage: 'earth [globe|danmaku|send|comments|comment|identity|help]',
    aliases: ['eo'],
    async execute(args, ctx) {
      const sub = args[0] ?? 'globe';
      const identity = getTerminalIdentity();

      if (sub === 'help' || sub === '--help' || sub === '-h') {
        ctx.addOutput([
          { type: 'info', content: 'Earth Online — terminal edition', id: nextId() },
          {
            type: 'output',
            content: [
              '  earth                          Open Earth Online terminal app',
              '  earth globe                  Same as above',
              '  earth danmaku [n]            List recent satellite danmaku',
              '  earth send <text>            Launch a satellite danmaku',
              '  earth comments <postId> [n]  View comments for a post',
              '  earth comment <postId> <text>Post a comment (set identity first)',
              '  earth identity [name] [email]Show or set comment identity',
            ].join('\n'),
            id: nextId(),
          },
        ]);
        return;
      }

      if (sub === 'identity') {
        const name = args[1];
        const email = args[2];
        if (!name || !email) {
          if (identity) {
            ctx.addOutput([
              {
                type: 'output',
                content: `Identity: ${identity.nickname} <${identity.email}>`,
                id: nextId(),
              },
              {
                type: 'info',
                content: 'Use `earth identity <nickname> <email>` to change.',
                id: nextId(),
              },
            ]);
          } else {
            ctx.addOutput([
              {
                type: 'error',
                content: 'No identity set. Use `earth identity <nickname> <email>`.',
                id: nextId(),
              },
            ]);
          }
          return;
        }
        if (setTerminalIdentity(name, email)) {
          ctx.addOutput([
            {
              type: 'info',
              content: `Identity set to ${name.trim()} <${email.trim().toLowerCase()}>.`,
              id: nextId(),
            },
          ]);
        } else {
          ctx.addOutput([
            {
              type: 'error',
              content: 'Invalid identity: nickname 2-20 chars, email must be valid.',
              id: nextId(),
            },
          ]);
        }
        return;
      }

      if (sub === 'globe' || sub === 'g') {
        ctx.enterApp('earth');
        return;
      }

      if (sub === 'danmaku' || sub === 'dm') {
        try {
          const res = await fetch('/api/danmaku/list', {
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) throw new Error('service unavailable');
          const data = (await res.json()) as TerminalDanmaku[];
          const danmakus = Array.isArray(data) ? data : [];
          const count = Math.min(parseInt(args[1] ?? '10', 10) || 10, 50);
          const recent = danmakus.slice(-count).reverse();
          if (recent.length === 0) {
            ctx.addOutput([{ type: 'output', content: 'No satellite danmaku yet.', id: nextId() }]);
            return;
          }
          const lines = recent.map((dm, i) => formatDanmaku(dm, i));
          ctx.addOutput([
            { type: 'output', content: lines.join('\n'), id: nextId() },
            {
              type: 'info',
              content: 'Use `earth send <text>` to launch your own satellite.',
              id: nextId(),
            },
          ]);
        } catch {
          ctx.addOutput([{ type: 'error', content: 'earth: danmaku service unavailable', id: nextId() }]);
        }
        return;
      }

      if (sub === 'send' || sub === 's') {
        const text = args.slice(1).join(' ').trim();
        if (!text) {
          ctx.addOutput([{ type: 'error', content: 'earth send: missing message text', id: nextId() }]);
          return;
        }
        try {
          const orbitTypes = ['low', 'medium', 'high'];
          const orbitType = orbitTypes[Math.floor(Math.random() * orbitTypes.length)];
          const altitude =
            orbitType === 'low' ? 400000 : orbitType === 'medium' ? 20000000 : 35786000;
          const payload = {
            id: `term-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            text,
            userId: 'terminal-user',
            timestamp: Date.now(),
            color: '#00ff41',
            orbitType,
            angle: Math.random() * Math.PI * 2,
            inclination: (Math.random() - 0.5) * Math.PI,
            altitude,
            speed: 0.0012,
            raan: Math.random() * Math.PI * 2,
            markdown: '',
          };
          const res = await fetch('/api/danmaku/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...(await generateAuthHeaders()),
            },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('add failed');
          ctx.addOutput([{ type: 'info', content: `Satellite launched: "${text}"`, id: nextId() }]);
        } catch {
          ctx.addOutput([
            { type: 'error', content: 'earth send: failed to launch satellite', id: nextId() },
          ]);
        }
        return;
      }

      if (sub === 'comments' || sub === 'c') {
        const postId = args[1];
        if (!postId) {
          ctx.addOutput([
            { type: 'error', content: 'earth comments: missing postId', id: nextId() },
          ]);
          return;
        }
        try {
          const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, {
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) throw new Error('service unavailable');
          const data = (await res.json()) as {
            success: boolean;
            comments: TerminalComment[];
            total: number;
          };
          const comments = data.comments ?? [];
          const count = Math.min(parseInt(args[2] ?? '20', 10) || 20, 50);
          const recent = comments.slice(0, count);
          if (recent.length === 0) {
            ctx.addOutput([
              { type: 'output', content: `No comments for ${postId}.`, id: nextId() },
            ]);
            return;
          }
          const lines = recent.map((c) => formatComment(c));
          ctx.addOutput([
            {
              type: 'output',
              content: `Comments for ${postId} (${data.total ?? comments.length} total):\n${lines.join('\n\n')}`,
              id: nextId(),
            },
          ]);
        } catch {
          ctx.addOutput([
            { type: 'error', content: 'earth comments: failed to load comments', id: nextId() },
          ]);
        }
        return;
      }

      if (sub === 'comment' || sub === 'cc') {
        const postId = args[1];
        const text = args.slice(2).join(' ').trim();
        if (!postId || !text) {
          ctx.addOutput([
            {
              type: 'error',
              content: 'earth comment: usage: earth comment <postId> <text>',
              id: nextId(),
            },
          ]);
          return;
        }
        if (!identity) {
          ctx.addOutput([
            {
              type: 'error',
              content: 'Identity required. Use `earth identity <nickname> <email>` first.',
              id: nextId(),
            },
          ]);
          return;
        }
        try {
          const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(await generateAuthHeaders()),
            },
            body: JSON.stringify({
              nickname: identity.nickname,
              email: identity.email,
              content: text,
              isMarkdown: false,
              parentId: null,
              replyTo: null,
              verificationToken: `verified_${Date.now()}`,
            }),
          });
          if (!res.ok) throw new Error('post failed');
          ctx.addOutput([{ type: 'info', content: `Comment posted to ${postId}.`, id: nextId() }]);
        } catch {
          ctx.addOutput([
            { type: 'error', content: 'earth comment: failed to post comment', id: nextId() },
          ]);
        }
        return;
      }

      ctx.addOutput([
        { type: 'error', content: `earth: unknown subcommand: ${sub}`, id: nextId() },
      ]);
    },
  },
];

const commandMap = new Map<string, TerminalCommand>();
for (const cmd of commands) {
  commandMap.set(cmd.name, cmd);
  for (const alias of cmd.aliases ?? []) {
    commandMap.set(alias, cmd);
  }
}

export function parseInput(input: string): { command: string; args: string[] } {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  return { command: parts[0] ?? '', args: parts.slice(1) };
}

export function executeCommand(input: string, ctx: CommandContext): void {
  const { command, args } = parseInput(input);
  const cmd = commandMap.get(command);

  if (!cmd) {
    // Support running scripts directly: ./snake.sh or /game/snake.sh
    if (command.endsWith('.sh')) {
      const resolved = command.startsWith('/')
        ? command
        : resolvePath(ctx.cwd, command);
      runScript(resolved, ctx);
      return;
    }
    ctx.addOutput([{ type: 'error', content: `${command}: command not found`, id: nextId() }]);
    return;
  }

  try {
    const result = cmd.execute(args, ctx);
    if (result instanceof Promise) {
      result.catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        ctx.addOutput([{ type: 'error', content: `${command}: ${message}`, id: nextId() }]);
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.addOutput([{ type: 'error', content: `${command}: ${message}`, id: nextId() }]);
  }
}

export { commands };

/**
 * Generate completion candidates for the current input.
 *
 * Supports command-name completion at the start of the line and file/path
 * completion for the last whitespace-separated token.
 */
export function getCompletions(input: string, ctx: CommandContext): string[] {
  const trimmed = input.trimStart();
  const tokens = trimmed.split(/\s+/);

  // Complete command names when typing the first token.
  if (tokens.length <= 1 && !trimmed.includes(' ')) {
    const prefix = tokens[0] ?? '';
    const candidates = Array.from(commandMap.keys()).filter((name) =>
      name.startsWith(prefix)
    );
    return Array.from(new Set(candidates));
  }

  // Complete the last token as a path.
  const command = tokens[0] ?? '';
  const needsPath = ['cd', 'ls', 'cat', 'open', 'read', 'view', 'head', 'tail', 'wc', 'find', 'grep'].includes(command);
  if (!needsPath) return [];

  const lastToken = tokens[tokens.length - 1] ?? '';
  const resolvedDir = lastToken.includes('/')
    ? resolvePath(ctx.cwd, lastToken.slice(0, lastToken.lastIndexOf('/') + 1))
    : ctx.cwd;
  const prefix = lastToken.includes('/')
    ? lastToken.slice(lastToken.lastIndexOf('/') + 1)
    : lastToken;

  const entries = getDirectoryEntries(ctx, resolvedDir);
  const matches = entries.filter((entry) => entry.startsWith(prefix));

  const base = lastToken.includes('/')
    ? lastToken.slice(0, lastToken.lastIndexOf('/') + 1)
    : '';

  if (matches.length <= 1) {
    return matches.map((match) => `${base}${match}`);
  }

  // When multiple matches exist, complete to the longest common prefix on a
  // single Tab press. Only list candidates when the LCP is already reached.
  const lcp = matches.reduce((common, entry) => {
    let i = 0;
    while (i < common.length && i < entry.length && common[i] === entry[i]) {
      i += 1;
    }
    return common.slice(0, i);
  }, matches[0]);

  if (lcp.length > prefix.length) {
    return [`${base}${lcp}`];
  }

  return matches.map((match) => `${base}${match}`);
}
