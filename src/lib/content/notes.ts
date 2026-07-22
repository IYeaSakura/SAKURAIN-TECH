import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * 随记（Notes）服务端内容管线。
 * 数据源：content/notes/posts/*.md（frontmatter: title/date/mood + 正文）
 * 仅在 Server Component / 构建期调用，禁止在客户端组件中引用其实现。
 */

export interface Note {
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
  /** 排序用时间戳（内部计算，不外泄给序列化场景时可忽略） */
  timestamp: number;
}

export interface NotesArchive {
  /** 按月分组（键为 YYYY-MM，月份倒序，组内按时间倒序） */
  byMonth: Record<string, Note[]>;
  /** 倒序月份列表 */
  months: string[];
  total: number;
}

const POSTS_DIR = path.join(process.cwd(), 'content', 'notes', 'posts');

/** 解析 "2026-01-29 12:50:49 +0800" 形式的日期字符串 */
function parseNoteDate(raw: string): {
  year: number;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
  timestamp: number;
} {
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?/
  );
  if (!match) {
    const fallback = new Date(raw).getTime();
    return {
      year: 1970,
      month: '01',
      day: '01',
      hours: '00',
      minutes: '00',
      seconds: '00',
      timestamp: Number.isNaN(fallback) ? 0 : fallback,
    };
  }
  const [, y, mo, d, h, mi, s, sign, tzH, tzM] = match;
  const tz = sign ? `${sign}${tzH}:${tzM}` : '+08:00';
  const timestamp = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${tz}`).getTime();
  return {
    year: Number(y),
    month: mo,
    day: d,
    hours: h,
    minutes: mi,
    seconds: s,
    timestamp: Number.isNaN(timestamp) ? 0 : timestamp,
  };
}

function parseNoteFile(fileName: string): Note | null {
  const slug = fileName.replace(/\.md$/, '');
  const fullPath = path.join(POSTS_DIR, fileName);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(raw);

  const title = typeof data.title === 'string' ? data.title : slug;
  const dateStr = typeof data.date === 'string' ? data.date : String(data.date ?? '');
  const mood = typeof data.mood === 'string' ? data.mood : 'neutral';
  const body = content.trim();

  const parsed = parseNoteDate(dateStr);
  const wordCount = body.replace(/\s/g, '').length;

  return {
    id: slug,
    slug,
    title,
    content: body,
    date: dateStr,
    mood,
    wordCount,
    readingTime: `${Math.max(1, Math.ceil(wordCount / 200))} 分钟阅读`,
    year: parsed.year,
    month: parsed.month,
    day: parsed.day,
    hours: parsed.hours,
    minutes: parsed.minutes,
    seconds: parsed.seconds,
    yearMonth: `${parsed.year}-${parsed.month}`,
    fullDate: `${parsed.year}-${parsed.month}-${parsed.day}`,
    fullTime: `${parsed.hours}:${parsed.minutes}:${parsed.seconds}`,
    timestamp: parsed.timestamp,
  };
}

/** 全部随记，按时间倒序 */
export function getAllNotes(): Note[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const notes = files
    .map(parseNoteFile)
    .filter((n): n is Note => n !== null)
    .sort((a, b) => b.timestamp - a.timestamp);
  return notes;
}

/** 按月分组的归档（月份倒序） */
export function getNotesArchive(): NotesArchive {
  const notes = getAllNotes();
  const byMonth: Record<string, Note[]> = {};
  for (const note of notes) {
    (byMonth[note.yearMonth] ??= []).push(note);
  }
  const months = Object.keys(byMonth).sort((a, b) => (a < b ? 1 : -1));
  return { byMonth, months, total: notes.length };
}
