/**
 * Terminal mode type definitions.
 *
 * Shared types for the terminal shell, command registry and virtual file system.
 */

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  id: string;
}

export interface TerminalBlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  cover: string;
  featured: boolean;
  content?: string;
  readingTime?: string;
  wordCount?: number;
}

export interface TerminalBlogIndex {
  title: string;
  description: string;
  posts: TerminalBlogPost[];
}

export interface TerminalNote {
  id: string;
  slug: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  wordCount: number;
  readingTime: string;
  year: number;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
  yearMonth: string;
  fullDate: string;
  fullTime: string;
  timestamp: number;
}

export interface TerminalNotesIndex {
  title: string;
  description: string;
  notes: TerminalNote[];
}

export interface TerminalDocChapter {
  id: string;
  title: string;
  description: string;
  path: string;
  order: number;
}

export interface TerminalDocItem {
  id: string;
  type: 'article' | 'series';
  title: string;
  description: string;
  path?: string;
  icon?: string;
  chapters?: TerminalDocChapter[];
}

export interface TerminalDocCategory {
  id: string;
  title: string;
  description: string;
  items: TerminalDocItem[];
}

export interface TerminalDocsIndex {
  title: string;
  description: string;
  categories: TerminalDocCategory[];
}

export interface TerminalSiteData {
  meta?: {
    title?: string;
    description?: string;
  };
  navigation?: {
    logo?: string;
    links?: { label: string; href: string; icon?: string }[];
  };
  footer?: {
    slogan?: string;
  };
  hero?: {
    title?: string;
    subtitle?: string;
  };
}

export interface TerminalData {
  blog: TerminalBlogIndex | null;
  notes: TerminalNotesIndex | null;
  docs: TerminalDocsIndex | null;
  site: TerminalSiteData | null;
  loading: boolean;
}

export interface CommandContext {
  cwd: string;
  setCwd: (cwd: string) => void;
  data: TerminalData;
  router: ReturnType<typeof import('next/navigation').useRouter>;
  setPreset: (id: 'default' | 'terminal') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  player: {
    isPlaying: boolean;
    currentSong: { title: string; artist: string };
    togglePlay: () => void;
    next: () => void;
    prev: () => void;
  } | null;
  addOutput: (lines: TerminalLine[] | ((prev: TerminalLine[]) => TerminalLine[])) => void;
  clearOutput: () => void;
}

export interface TerminalCommand {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  execute: (args: string[], ctx: CommandContext) => void | Promise<void>;
}
