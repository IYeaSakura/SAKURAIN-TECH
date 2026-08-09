import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const DOCS_INDEX_PATH = path.join(CONTENT_DIR, 'docs-index.json');
const DOCS_JSON_TARGET = path.join(PUBLIC_DIR, 'data', 'docs.json');
const BLOG_JSON_TARGET = path.join(PUBLIC_DIR, 'data', 'blog.json');
const NOTES_JSON_TARGET = path.join(PUBLIC_DIR, 'data', 'notes.json');
const SEARCH_INDEX_TARGET = path.join(PUBLIC_DIR, 'data', 'search-index.json');
const BLOG_POSTS_DIR = path.join(CONTENT_DIR, 'blog');
const NOTES_POSTS_DIR = path.join(CONTENT_DIR, 'notes', 'posts');
const FRIENDS_SOURCE = path.join(CONTENT_DIR, 'data', 'friends.json');
const SITE_DATA_SOURCE = path.join(CONTENT_DIR, 'data', 'site-data.json');

/**
 * Managed content mappings from content/ to public/.
 * Each entry maps a source directory/file under content/ to a target under public/.
 */
const MANAGED_CONTENT = [
  { source: 'data', target: 'data' },
  { source: 'docs', target: 'docs' },
  { source: 'config', target: 'config' },
  { source: path.join('resume', 'resume-data.json'), target: path.join('resume', 'resume-data.json') },
];

/**
 * Files under public/ that are generated from content/ and should not be committed.
 * These paths are also documented in .gitignore.
 */
const SYNCED_PUBLIC_PATHS = [
  'data/friends.json',
  'data/playlist.json',
  'data/site-data.json',
  'data/docs.json',
  'data/blog.json',
  'data/notes.json',
  'data/search-index.json',
  'data/beidou-satellites.json',
  'data/language-stats.json',
  'config/security-config.json',
  'config/welcome-modal.json',
  'docs',
  'resume/resume-data.json',
];

/**
 * Files under content/ that are source inputs for generated public files.
 * These are committed; their generated counterparts in public/ are ignored.
 */
const CONTENT_SOURCE_PATHS = [
  'docs-index.json',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function copyDir(source, target) {
  removeDir(target);
  ensureDir(target);

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      copyFile(sourcePath, targetPath);
    }
  }
}

/**
 * Preserve auto-generated friend link check info when syncing the source file.
 * This lets check-friends-connectivity.js avoid re-probing every URL on every build.
 */
function mergeFriendsCheckInfo(contentPath, publicPath) {
  const source = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
  let existingChecks = new Map();

  if (fs.existsSync(publicPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));
      if (Array.isArray(existing.friends)) {
        for (const friend of existing.friends) {
          if (friend.id && friend.checkInfo) {
            existingChecks.set(friend.id, friend.checkInfo);
          }
        }
      }
    } catch {
      // ignore corrupt public file
    }
  }

  const merged = {
    ...source,
    friends: source.friends.map((friend) => ({
      ...friend,
      checkInfo: existingChecks.get(friend.id) ?? null,
    })),
  };

  ensureDir(path.dirname(publicPath));
  fs.writeFileSync(publicPath, JSON.stringify(merged, null, 2), 'utf-8');
}

/**
 * Process public/data/moments.json after the raw content copy.
 * - Auto-generates missing entry.id and photo.id fields.
 * - Truncates each entry to a maximum of 9 photos.
 */
function processMomentsJson() {
  const momentsPath = path.join(PUBLIC_DIR, 'data', 'moments.json');
  if (!fs.existsSync(momentsPath)) return;

  const data = JSON.parse(fs.readFileSync(momentsPath, 'utf-8'));
  if (!Array.isArray(data.entries)) return;

  let modified = false;

  data.entries.forEach((entry, entryIndex) => {
    if (!entry.id) {
      entry.id = `entry-${entry.date}-${entryIndex}`;
      modified = true;
    }

    if (!Array.isArray(entry.photos)) {
      entry.photos = [];
      modified = true;
    }

    if (entry.photos.length > 9) {
      console.log(`  ⚠ moments.json entry "${entry.id}" has ${entry.photos.length} photos, truncating to 9`);
      entry.photos = entry.photos.slice(0, 9);
      modified = true;
    }

    entry.photos.forEach((photo, photoIndex) => {
      if (!photo.id) {
        photo.id = `${entry.id}-photo-${photoIndex}`;
        modified = true;
      }
    });
  });

  if (modified) {
    fs.writeFileSync(momentsPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('  ✓ Processed moments.json (auto-filled IDs, enforced 9-photo limit)');
  }
}

/**
 * Build the public/data/docs.json catalog from content/docs-index.json.
 * The index only stores metadata and file names; this script fills in the
 * public paths so the docs page and generateStaticParams stay in sync with
 * the actual markdown files under public/docs.
 */
function generateDocsJson() {
  if (!fs.existsSync(DOCS_INDEX_PATH)) {
    console.log('  ⚠ docs-index.json not found, skipping docs.json generation');
    return;
  }

  const index = JSON.parse(fs.readFileSync(DOCS_INDEX_PATH, 'utf-8'));
  const catalog = {
    title: index.title,
    description: index.description,
    categories: index.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        if (item.type === 'series') {
          const seriesDir = item.dir ?? item.id;
          return {
            ...item,
            chapters: item.chapters.map((chapter) => ({
              id: chapter.id,
              title: chapter.title,
              description: chapter.description,
              path: `/docs/${category.id}/${seriesDir}/${chapter.file}`,
              order: chapter.order,
            })),
          };
        }
        return {
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          path: `/docs/${category.id}/${item.file}`,
          icon: item.icon,
        };
      }),
    })),
  };

  ensureDir(path.dirname(DOCS_JSON_TARGET));
  fs.writeFileSync(DOCS_JSON_TARGET, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log('  ✓ Generated public/data/docs.json from content/docs-index.json');
}

/**
 * Validate that every file referenced by content/docs-index.json exists under
 * content/docs. This catches stale index entries or missing chapters before
 * the static build generates broken links.
 */
function validateDocsIndex() {
  if (!fs.existsSync(DOCS_INDEX_PATH)) return;

  const index = JSON.parse(fs.readFileSync(DOCS_INDEX_PATH, 'utf-8'));
  let missing = 0;

  for (const category of index.categories) {
    for (const item of category.items) {
      if (item.type === 'series') {
        const seriesDir = item.dir ?? item.id;
        for (const chapter of item.chapters) {
          const filePath = path.join(CONTENT_DIR, 'docs', category.id, seriesDir, chapter.file);
          if (!fs.existsSync(filePath)) {
            console.log(`  ⚠ Missing docs file referenced by docs-index.json: ${path.relative(PROJECT_ROOT, filePath)}`);
            missing += 1;
          }
        }
      } else {
        const filePath = path.join(CONTENT_DIR, 'docs', category.id, item.file);
        if (!fs.existsSync(filePath)) {
          console.log(`  ⚠ Missing docs file referenced by docs-index.json: ${path.relative(PROJECT_ROOT, filePath)}`);
          missing += 1;
        }
      }
    }
  }

  if (missing === 0) {
    console.log('  ✓ All docs-index.json references exist under content/docs');
  }
}

/**
 * Normalize a frontmatter date value to YYYY-MM-DD.
 */
function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') return value.trim();
  return '';
}

/**
 * Parse a blog markdown file and return a normalized post object.
 */
function parseBlogFile(file) {
  try {
    const raw = fs.readFileSync(path.join(BLOG_POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = file.replace(/\.mdx?$/, '');
    const chineseChars = (content.match(/[一-龥]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    const wordCount = chineseChars + englishWords;
    const readingMinutes = Math.max(1, Math.ceil(chineseChars / 400));

    return {
      slug,
      title: typeof data.title === 'string' && data.title ? data.title : slug,
      description:
        typeof data.description === 'string'
          ? data.description
          : typeof data.excerpt === 'string'
            ? data.excerpt
            : '',
      date: normalizeDate(data.date),
      author: typeof data.author === 'string' && data.author ? data.author : 'SAKURAIN',
      tags: Array.isArray(data.tags)
        ? data.tags.map(String).map((t) => t.trim()).filter(Boolean)
        : typeof data.tags === 'string'
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      cover: typeof data.cover === 'string' ? data.cover : '',
      featured: data.featured === true || data.featured === 'true',
      content,
      wordCount,
      readingTime: `${readingMinutes} 分钟阅读`,
    };
  } catch {
    return null;
  }
}

/**
 * Build public/data/blog.json from content/blog/*.md.
 * Includes full markdown content so the terminal mode can read posts via `cat`.
 */
function generateBlogJson() {
  if (!fs.existsSync(BLOG_POSTS_DIR)) {
    console.log('  ⚠ blog directory not found, skipping blog.json generation');
    return;
  }

  const files = fs
    .readdirSync(BLOG_POSTS_DIR)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));

  const posts = files
    .map(parseBlogFile)
    .filter((p) => p !== null)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const index = {
    title: 'SAKURAIN 博客',
    description: '博弈算法、量化系统、数据分析与 Web 工程',
    posts,
  };

  ensureDir(path.dirname(BLOG_JSON_TARGET));
  fs.writeFileSync(BLOG_JSON_TARGET, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`  ✓ Generated public/data/blog.json with ${posts.length} posts`);
}

/**
 * Parse a note markdown file and return a normalized note object.
 */
function parseNoteFile(fileName) {
  try {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(NOTES_POSTS_DIR, fileName);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(raw);

    const title = typeof data.title === 'string' ? data.title : slug;
    const dateStr = data.date instanceof Date && !Number.isNaN(data.date.getTime())
      ? data.date.toISOString().replace('T', ' ').slice(0, 19) + ' +0000'
      : typeof data.date === 'string'
        ? data.date.trim()
        : '';
    const difficulty = ['easy', 'normal', 'difficult'].includes(data.difficulty)
      ? data.difficulty
      : 'normal';
    const body = content.trim();
    const wordCount = body.replace(/\s/g, '').length;

    const match = dateStr.match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?/
    );
    const parsed = match
      ? (() => {
          const [, y, mo, d, h, mi, s, sign, tzH, tzM] = match;
          const tz = sign ? `${sign}${tzH}:${tzM}` : '+08:00';
          return {
            year: Number(y),
            month: mo,
            day: d,
            hours: h,
            minutes: mi,
            seconds: s,
            timestamp: new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${tz}`).getTime(),
          };
        })()
      : {
          year: 1970,
          month: '01',
          day: '01',
          hours: '00',
          minutes: '00',
          seconds: '00',
          timestamp: Number.isNaN(new Date(dateStr).getTime()) ? 0 : new Date(dateStr).getTime(),
        };

    return {
      id: slug,
      slug,
      title,
      content: body,
      date: dateStr,
      difficulty,
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
  } catch {
    return null;
  }
}

/**
 * Build public/data/notes.json from content/notes/posts/*.md.
 * Provides note metadata and content for the terminal mode.
 */
function generateNotesJson() {
  if (!fs.existsSync(NOTES_POSTS_DIR)) {
    console.log('  ⚠ notes directory not found, skipping notes.json generation');
    return;
  }

  const files = fs.readdirSync(NOTES_POSTS_DIR).filter((f) => f.endsWith('.md'));
  const notes = files
    .map(parseNoteFile)
    .filter((n) => n !== null)
    .sort((a, b) => b.timestamp - a.timestamp);

  const index = {
    title: 'SAKURAIN 开发日志',
    description: '开发迭代记录与技术日志',
    notes,
  };

  ensureDir(path.dirname(NOTES_JSON_TARGET));
  fs.writeFileSync(NOTES_JSON_TARGET, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`  ✓ Generated public/data/notes.json with ${notes.length} notes`);
}

/* ---------------------------------------------------------------------------
 * Unified site-wide search index
 * --------------------------------------------------------------------------- */

const MAX_CONTENT_LENGTH = 1200;

/**
 * Strip common Markdown/JSX noise so the search index stores plain text.
 */
function cleanMarkdown(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/(\*\*|__|\*|_|~~|`)/g, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text, maxLength = MAX_CONTENT_LENGTH) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function resolveDocsFile(publicPath) {
  const rel = publicPath.replace(/^\/+/, '');
  const abs = path.resolve(PUBLIC_DIR, rel);
  if (!abs.startsWith(PUBLIC_DIR + path.sep) && abs !== PUBLIC_DIR) return null;
  return abs;
}

function readDocContent(publicPath) {
  const abs = resolveDocsFile(publicPath);
  if (!abs || !fs.existsSync(abs)) return '';
  try {
    const { content } = matter(fs.readFileSync(abs, 'utf-8'));
    return cleanMarkdown(content);
  } catch {
    return '';
  }
}

function buildSearchIndex() {
  const documents = [];

  // Blog posts
  const blog = safeReadJson(BLOG_JSON_TARGET);
  if (blog?.posts) {
    for (const post of blog.posts) {
      documents.push({
        id: `post:${post.slug}`,
        type: 'post',
        title: String(post.title || post.slug),
        description: String(post.description || ''),
        content: truncateText(cleanMarkdown(post.content || '')),
        href: `/blog/${post.slug}`,
        date: post.date || '',
        tags: Array.isArray(post.tags) ? post.tags.map(String) : [],
        category: 'blog',
      });
    }
  }

  // Dev notes
  const notes = safeReadJson(NOTES_JSON_TARGET);
  if (notes?.notes) {
    for (const note of notes.notes) {
      documents.push({
        id: `note:${note.slug}`,
        type: 'note',
        title: String(note.title || note.slug),
        description: '',
        content: truncateText(cleanMarkdown(note.content || '')),
        href: `/dev-log#note-${note.id}`,
        date: note.date || '',
        tags: [],
        category: 'dev-log',
      });
    }
  }

  // Docs (categories, series, chapters and single docs)
  const docs = safeReadJson(DOCS_JSON_TARGET);
  if (docs?.categories) {
    for (const category of docs.categories) {
      for (const item of category.items) {
        if (item.type === 'series') {
          for (const chapter of item.chapters || []) {
            const content = readDocContent(chapter.path);
            documents.push({
              id: `doc:${category.id}:${item.id}:${chapter.id}`,
              type: 'doc',
              title: String(chapter.title || ''),
              description: String(chapter.description || ''),
              content: truncateText(content),
              href: `/docs/${category.id}/${item.id}/${chapter.id}`,
              date: '',
              tags: [category.name, item.title],
              category: `docs:${category.name}`,
            });
          }
        } else {
          const content = readDocContent(item.path);
          documents.push({
            id: `doc:${category.id}:${item.id}`,
            type: 'doc',
            title: String(item.title || ''),
            description: String(item.description || ''),
            content: truncateText(content),
            href: `/docs/${category.id}/${item.id}`,
            date: '',
            tags: [category.name],
            category: `docs:${category.name}`,
          });
        }
      }
    }
  }

  // Friends
  const friends = safeReadJson(FRIENDS_SOURCE);
  if (friends?.friends) {
    for (const friend of friends.friends) {
      const desc = typeof friend.description === 'object'
        ? friend.description?.zh || friend.description?.en || ''
        : String(friend.description || '');
      documents.push({
        id: `friend:${friend.id || friend.name}`,
        type: 'friend',
        title: String(friend.name || ''),
        description: desc,
        content: '',
        href: `/friends`,
        date: friends.lastUpdated || '',
        tags: [friend.category || ''],
        category: 'friends',
      });
    }
  }

  // Services from site-data.json
  const siteData = safeReadJson(SITE_DATA_SOURCE);
  if (siteData?.services) {
    for (const service of siteData.services) {
      const details = service.details?.sections || [];
      const detailText = details
        .map((s) => [s.title, ...(s.items || []).map((i) => `${i.name} ${i.desc}`)].join(' '))
        .join(' ');
      documents.push({
        id: `service:${service.id}`,
        type: 'service',
        title: String(service.title || ''),
        description: String(service.description || ''),
        content: truncateText(cleanMarkdown(`${service.subtitle || ''} ${service.features?.join(' ') || ''} ${detailText}`)),
        href: '/projects',
        date: '',
        tags: service.tech || [],
        category: 'services',
      });
    }
  }

  // Static pages
  const staticPages = [
    { id: 'page:home', title: '首页', titleEn: 'Home', description: 'SAKURAIN 个人品牌站首页', href: '/' },
    { id: 'page:blog', title: '博客', titleEn: 'Blog', description: '技术博客与文章归档', href: '/blog' },
    { id: 'page:projects', title: '项目', titleEn: 'Projects', description: '技术服务与项目展示', href: '/projects' },
    { id: 'page:dev-log', title: '开发日志', titleEn: 'Dev Log', description: '开发迭代记录与技术日志', href: '/dev-log' },
    { id: 'page:friends', title: '友链', titleEn: 'Friends', description: '友情链接与技术社区', href: '/friends' },
    { id: 'page:friends-circle', title: '朋友圈', titleEn: 'Friends Circle', description: '订阅好友博客更新', href: '/friends-circle' },
    { id: 'page:earth-online', title: '地球 Online', titleEn: 'Earth Online', description: '3D 地球与弹幕互动', href: '/earth-online' },
    { id: 'page:moments', title: '动态', titleEn: 'Moments', description: '生活动态与摄影作品', href: '/moments' },
    { id: 'page:music', title: '音乐', titleEn: 'Music', description: '音乐播放器与歌单', href: '/music' },
    { id: 'page:about', title: '关于', titleEn: 'About', description: '关于 SAKURAIN 与联系方式', href: '/about' },
    { id: 'page:docs', title: '文档', titleEn: 'Docs', description: '技术文档与系列教程', href: '/docs' },
    { id: 'page:algo-viz', title: '算法可视化', titleEn: 'Algorithm Visualization', description: '算法可视化演示', href: '/algo-viz' },
    { id: 'page:resume', title: '简历', titleEn: 'Resume', description: '个人简历与经历', href: '/resume' },
    { id: 'page:settings', title: '设置', titleEn: 'Settings', description: '主题与偏好设置', href: '/settings' },
  ];
  for (const page of staticPages) {
    documents.push({
      id: page.id,
      type: 'page',
      title: page.title,
      description: page.description,
      content: `${page.title} ${page.titleEn} ${page.description}`,
      href: page.href,
      date: '',
      tags: [page.titleEn],
      category: 'pages',
    });
  }

  const index = {
    generatedAt: new Date().toISOString(),
    count: documents.length,
    documents,
  };

  ensureDir(path.dirname(SEARCH_INDEX_TARGET));
  fs.writeFileSync(SEARCH_INDEX_TARGET, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`  ✓ Generated public/data/search-index.json with ${documents.length} documents`);
}

function syncContent() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('✘ Content directory not found:', CONTENT_DIR);
    process.exit(1);
  }

  console.log('Syncing managed content from content/ to public/...');

  for (const mapping of MANAGED_CONTENT) {
    const sourcePath = path.join(CONTENT_DIR, mapping.source);
    const targetPath = path.join(PUBLIC_DIR, mapping.target);

    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠ Skipping missing source: ${mapping.source}`);
      continue;
    }

    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      copyDir(sourcePath, targetPath);
      console.log(`  ✓ Synced directory: ${mapping.source} -> ${mapping.target}`);
    } else {
      if (path.basename(mapping.source) === 'friends.json') {
        mergeFriendsCheckInfo(sourcePath, targetPath);
        console.log(`  ✓ Synced friends.json with preserved checkInfo`);
      } else {
        copyFile(sourcePath, targetPath);
        console.log(`  ✓ Synced file: ${mapping.source} -> ${mapping.target}`);
      }
    }
  }

  // Preserve auto-generated friend link check info even when data/ was copied as a directory.
  const friendsSource = path.join(CONTENT_DIR, 'data', 'friends.json');
  const friendsPublic = path.join(PUBLIC_DIR, 'data', 'friends.json');
  if (fs.existsSync(friendsSource) && fs.existsSync(friendsPublic)) {
    mergeFriendsCheckInfo(friendsSource, friendsPublic);
    console.log('  ✓ Preserved friends.json checkInfo');
  }

  // Process moments.json: auto-fill IDs and enforce per-entry photo limit.
  processMomentsJson();

  // Generate the docs catalog from the trimmed index.
  generateDocsJson();

  // Generate terminal-readable JSON indexes for blog and notes.
  generateBlogJson();
  generateNotesJson();

  // Build the unified site-wide search index after all content JSONs exist.
  buildSearchIndex();

  // Validate that the trimmed index does not reference missing markdown files.
  validateDocsIndex();

  console.log('Content sync complete.');
}

syncContent();
