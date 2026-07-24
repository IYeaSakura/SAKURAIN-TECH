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
} from './types';

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
  { cmd: 'open <path>', desc: 'Open a page in visual browser mode' },
  { cmd: 'exit', desc: 'Leave terminal mode and return to visual mode' },
  { cmd: 'posts [n]', desc: 'List recent blog posts' },
  { cmd: 'notes [n]', desc: 'List recent notes' },
  { cmd: 'whoami', desc: 'About the author' },
  { cmd: 'neofetch', desc: 'System information' },
  { cmd: 'theme [light|dark|toggle]', desc: 'Change color theme' },
  { cmd: 'music [play|pause|next|prev|status]', desc: 'Control music player' },
  { cmd: 'date', desc: 'Show current date and time' },
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
    'studio.tsx': '/studio',
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
    'projects.tsx',
    'friends.json',
    'friends-circle.tsx',
    'earth-online.tsx',
    'about.md',
    'studio.tsx',
    'algo-viz.tsx',
  ];

  if (normalized === '/') return rootEntries;

  const parts = normalized.split('/').filter(Boolean);
  const first = parts[0];

  if (first === 'blog') {
    return (
      ctx.data.blog?.posts.map((post) => `${post.slug}.md`) ?? [
        '<empty: run build to generate blog.json>',
      ]
    );
  }

  if (first === 'shuoshuo') {
    return (
      ctx.data.notes?.notes.slice(0, 50).map((note) => `${note.slug}.md`) ?? [
        '<empty: run build to generate notes.json>',
      ]
    );
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
    if (item?.chapters) {
      return item.chapters.map((ch) => `${ch.id}.md`);
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

  return null;
}

function formatList(entries: string[]): string {
  if (entries.length === 0) return 'total 0';
  const dirs = entries.filter((e) => e.endsWith('/'));
  const files = entries.filter((e) => !e.endsWith('/'));
  return [...dirs, ...files].join('  ');
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
      ctx.addOutput([
        { type: 'output', content: formatList(getDirectoryEntries(ctx, resolved)), id: nextId() },
      ]);
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
    usage: 'music [play|pause|next|prev|status]',
    execute(args, ctx) {
      const sub = args[0] ?? 'status';
      const player = ctx.player;
      if (!player) {
        ctx.addOutput([{ type: 'error', content: 'music: player not available', id: nextId() }]);
        return;
      }
      switch (sub) {
        case 'play':
        case 'pause':
          player.togglePlay();
          ctx.addOutput([
            {
              type: 'info',
              content: `Music ${player.isPlaying ? 'paused' : 'playing'}.`,
              id: nextId(),
            },
          ]);
          break;
        case 'next':
          player.next();
          ctx.addOutput([{ type: 'info', content: 'Skipped to next track.', id: nextId() }]);
          break;
        case 'prev':
          player.prev();
          ctx.addOutput([{ type: 'info', content: 'Skipped to previous track.', id: nextId() }]);
          break;
        case 'status':
          ctx.addOutput([
            {
              type: 'output',
              content: [
                `Status: ${player.isPlaying ? 'playing' : 'paused'}`,
                `Track: ${player.currentSong.title}`,
                `Artist: ${player.currentSong.artist}`,
              ].join('\n'),
              id: nextId(),
            },
          ]);
          break;
        default:
          ctx.addOutput([
            {
              type: 'error',
              content: 'music: usage: music [play|pause|next|prev|status]',
              id: nextId(),
            },
          ]);
      }
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
