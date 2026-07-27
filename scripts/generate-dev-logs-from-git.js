import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';

/**
 * Generate dev-log entries from Git commits.
 *
 * Manually executed with `node scripts/generate-dev-logs-from-git.js`.
 * Commits are converted to markdown notes under content/notes/posts/.
 * Entries whose timestamp already exists (matching the `date` frontmatter
 * of an existing note) are skipped automatically.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const NOTES_DIR = path.join(PROJECT_ROOT, 'content', 'notes', 'posts');

const DIFFICULTY_DEFAULT = 'normal';

/**
 * Parse a Git author date in ISO 8601 format with timezone offset
 * (e.g. "2026-07-27 15:42:13 +0800") into the note frontmatter format.
 */
function normalizeGitDate(gitDate) {
  const match = gitDate.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s*([+-])(\d{2})(\d{2})$/
  );
  if (!match) return null;
  const [, y, mo, d, h, mi, s, sign, tzH, tzM] = match;
  return `${y}-${mo}-${d} ${h}:${mi}:${s} ${sign}${tzH}${tzM}`;
}

function fileNameFromDate(dateStr) {
  return dateStr.replace(/[-: ]/g, '').replace(/[+-]\d{4}$/, '') + '.md';
}

function parseNoteDate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const normalized = dateStr.trim();
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s*([+-])(\d{2})(\d{2})$/
  );
  if (!match) return new Date(normalized).getTime() || null;
  const [, y, mo, d, h, mi, s, sign, tzH, tzM] = match;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${sign}${tzH}:${tzM}`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function loadExistingTimestamps() {
  const timestamps = new Set();
  let latestTimestamp = null;
  if (!fs.existsSync(NOTES_DIR)) return { timestamps, latestTimestamp };

  const files = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(NOTES_DIR, file), 'utf8');
      const { data } = matter(raw);
      if (typeof data.date === 'string') {
        const trimmed = data.date.trim();
        timestamps.add(trimmed);
        const ts = parseNoteDate(trimmed);
        if (ts !== null && (latestTimestamp === null || ts > latestTimestamp)) {
          latestTimestamp = ts;
        }
      }
    } catch {
      // Ignore unreadable files.
    }
  }
  return { timestamps, latestTimestamp };
}

function parseCommitMessage(message) {
  const trimmed = message.trim();
  const newlineIndex = trimmed.indexOf('\n');
  if (newlineIndex === -1) {
    return { subject: trimmed, body: '' };
  }
  return {
    subject: trimmed.slice(0, newlineIndex).trim(),
    body: trimmed.slice(newlineIndex + 1).trim(),
  };
}

function generateNoteContent(commit) {
  const title = JSON.stringify(commit.subject);
  const body = commit.body ? `${commit.body}\n` : '';
  return `---\ntitle: ${title}\ndate: "${commit.date}"\ndifficulty: "${DIFFICULTY_DEFAULT}"\n---\n\n${body}`;
}

function main() {
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }

  const { timestamps: existingTimestamps, latestTimestamp } = loadExistingTimestamps();

  let logOutput;
  try {
    logOutput = execSync(
      'git log --pretty=format:"%H%x09%ai%x09%B%x00"',
      { cwd: PROJECT_ROOT, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
    );
  } catch (error) {
    console.error('Failed to read git log. Make sure this is a Git repository.', error.message);
    process.exit(1);
  }

  const records = logOutput.split('\x00').filter(Boolean);
  let generated = 0;
  let skipped = 0;

  for (const record of records) {
    const tabIndex1 = record.indexOf('\t');
    const tabIndex2 = record.indexOf('\t', tabIndex1 + 1);
    if (tabIndex1 === -1 || tabIndex2 === -1) continue;

    const hash = record.slice(0, tabIndex1).trim();
    const gitDate = record.slice(tabIndex1 + 1, tabIndex2).trim();
    const message = record.slice(tabIndex2 + 1);
    const { subject, body } = parseCommitMessage(message);

    if (!subject || subject.toUpperCase() === 'NULL') {
      skipped += 1;
      continue;
    }

    const date = normalizeGitDate(gitDate);
    if (!date) {
      console.warn(`  ⚠ Skipping commit ${hash}: unrecognized date format "${gitDate}"`);
      skipped += 1;
      continue;
    }

    const commitTimestamp = parseNoteDate(date);
    if (latestTimestamp !== null && commitTimestamp !== null && commitTimestamp <= latestTimestamp) {
      skipped += 1;
      continue;
    }

    if (existingTimestamps.has(date)) {
      skipped += 1;
      continue;
    }

    const fileName = fileNameFromDate(date);
    const filePath = path.join(NOTES_DIR, fileName);

    // Avoid overwriting an existing file even if the timestamp is new.
    if (fs.existsSync(filePath)) {
      console.warn(`  ⚠ File already exists for ${date}: ${fileName}`);
      skipped += 1;
      continue;
    }

    const content = generateNoteContent({ hash, date, subject, body });
    fs.writeFileSync(filePath, content, 'utf8');
    existingTimestamps.add(date);
    generated += 1;
    console.log(`  ✓ ${fileName} <- ${subject.slice(0, 60)}${subject.length > 60 ? '...' : ''}`);
  }

  if (latestTimestamp !== null) {
    console.log(`  Latest existing dev-log: ${new Date(latestTimestamp).toISOString()}`);
  } else {
    console.log('  No existing dev-logs found.');
  }
  console.log(`\nDone. Generated ${generated} dev-log entries, skipped ${skipped}.`);
}

main();
