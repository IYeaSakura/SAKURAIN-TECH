import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.join(__dirname, '..', 'content', 'notes', 'posts');

const MOOD_TO_DIFFICULTY = {
  happy: 'easy',
  neutral: 'normal',
  sad: 'difficult',
};

function migrateFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) return;

  const frontmatter = frontmatterMatch[1];
  if (!frontmatter.includes('mood:')) return;

  const moodMatch = frontmatter.match(/^mood:\s*["']?([^"'\r\n]+)["']?$/m);
  const mood = moodMatch ? moodMatch[1].trim() : 'neutral';
  const difficulty = MOOD_TO_DIFFICULTY[mood] ?? 'normal';

  const newFrontmatter = frontmatter.replace(/^mood:.*$/m, `difficulty: "${difficulty}"`);
  const newRaw = raw.replace(frontmatterMatch[0], `---\n${newFrontmatter}\n---`);
  fs.writeFileSync(filePath, newRaw, 'utf8');
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('Posts directory not found:', POSTS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  let migrated = 0;
  for (const file of files) {
    const before = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    migrateFile(path.join(POSTS_DIR, file));
    const after = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    if (before !== after) migrated += 1;
  }
  console.log(`Migrated ${migrated} / ${files.length} note files from mood to difficulty.`);
}

main();
