import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'content', 'data', 'language-stats.json');

const EXCLUDED_DIRS = loadExcludedDirs();

function loadExcludedDirs() {
  const dirs = new Set(['public', 'content', '.git']);
  const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
  if (!fs.existsSync(gitignorePath)) return dirs;

  const raw = fs.readFileSync(gitignorePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('!')) continue;
    if (trimmed.includes('*') || trimmed.includes('?')) continue;
    // Normalize: strip trailing slash and use the directory/file name only.
    const name = trimmed.replace(/\/$/, '').split('/').pop();
    if (name) dirs.add(name);
  }
  return dirs;
}
const EXCLUDED_EXTS = new Set([
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff',
  // Fonts
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  // Audio / video
  'mp3', 'mp4', 'wav', 'ogg', 'webm',
  // Archives
  'zip', 'tar', 'gz', 'rar', '7z',
  // Lock / binary
  'lock', 'exe', 'dll', 'so', 'dylib', 'bin',
]);

const LANGUAGE_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Less: '#1d365d',
  JSON: '#292929',
  Markdown: '#083fa1',
  YAML: '#cb171e',
  Shell: '#89e051',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Other: '#8b949e',
};

const EXT_TO_LANGUAGE = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  py: 'Python',
  pyw: 'Python',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'SCSS',
  less: 'Less',
  json: 'JSON',
  md: 'Markdown',
  mdx: 'Markdown',
  yml: 'YAML',
  yaml: 'YAML',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  cpp: 'C++',
  cc: 'C++',
  cxx: 'C++',
  hpp: 'C++',
  c: 'C',
  h: 'C',
  cs: 'C#',
  php: 'PHP',
  rb: 'Ruby',
  swift: 'Swift',
  kt: 'Kotlin',
  kts: 'Kotlin',
  dart: 'Dart',
  vue: 'Vue',
  svelte: 'Svelte',
};

function getLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
  return EXT_TO_LANGUAGE[ext] || null;
}

function isBinary(buffer) {
  for (let i = 0; i < Math.min(buffer.length, 8000); i += 1) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

function countNonEmptyLines(content) {
  return content.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

function collectFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    files.push(...collectFilesRecursive(fullPath));
  }
  return files;
}

function collectFilesRecursive(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursive(fullPath));
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase().replace(/^\./, '');
    if (EXCLUDED_EXTS.has(ext)) continue;
    files.push(path.relative(PROJECT_ROOT, fullPath).replace(/\\/g, '/'));
  }
  return files;
}

function filterIgnoredFiles(files) {
  if (files.length === 0) return [];
  try {
    const output = execSync('git check-ignore --stdin', {
      cwd: PROJECT_ROOT,
      input: files.join('\n'),
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    });
    const ignored = new Set(output.split('\n').filter(Boolean));
    return files.filter((f) => !ignored.has(f));
  } catch (error) {
    if (error.status === 1 && error.stdout === '') {
      // git check-ignore returns 1 when no matches.
      return files;
    }
    console.warn('  ⚠ git check-ignore failed, falling back to include all collected files.', error.message);
    return files;
  }
}

function calculateStats() {
  console.log('Calculating language statistics...');

  const allFiles = collectFiles(PROJECT_ROOT);
  console.log(`  Collected ${allFiles.length} candidate files (excluding public/, content/, .git/).`);

  const trackedFiles = filterIgnoredFiles(allFiles);
  console.log(`  ${trackedFiles.length} files remain after applying .gitignore.`);

  const languageLines = new Map();
  let totalLines = 0;

  for (const relativePath of trackedFiles) {
    const language = getLanguage(relativePath);
    if (!language) continue;

    const fullPath = path.join(PROJECT_ROOT, relativePath);
    let buffer;
    try {
      buffer = fs.readFileSync(fullPath);
    } catch {
      continue;
    }
    if (isBinary(buffer)) continue;

    const content = buffer.toString('utf8');
    const lines = countNonEmptyLines(content);
    if (lines === 0) continue;

    languageLines.set(language, (languageLines.get(language) || 0) + lines);
    totalLines += lines;
  }

  if (totalLines === 0) {
    console.warn('  ⚠ No countable source lines found.');
    return { generatedAt: new Date().toISOString(), totalLines: 0, languages: [] };
  }

  const languages = Array.from(languageLines.entries())
    .map(([name, lines]) => ({
      name,
      color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.Other,
      lines,
      percentage: Number(((lines / totalLines) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.lines - a.lines);

  // Fix rounding so the total visually equals 100% for the top language if needed.
  if (languages.length > 0) {
    const displayedTotal = languages.reduce((sum, lang) => sum + lang.percentage, 0);
    if (displayedTotal !== 100) {
      languages[0].percentage = Number((languages[0].percentage + (100 - displayedTotal)).toFixed(1));
    }
  }

  return { generatedAt: new Date().toISOString(), totalLines, languages };
}

function main() {
  const stats = calculateStats();

  ensureDir(path.dirname(OUTPUT_PATH));
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stats, null, 2), 'utf8');

  if (stats.languages.length > 0) {
    console.log(`  ✓ language-stats.json written with ${stats.languages.length} languages.`);
    stats.languages.slice(0, 5).forEach((lang) => {
      console.log(`    - ${lang.name}: ${lang.percentage}% (${lang.lines} lines)`);
    });
  } else {
    console.log('  ✓ language-stats.json written (empty).');
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

main();
