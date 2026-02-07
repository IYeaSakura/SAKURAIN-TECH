import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../public/blog/posts');
const OUTPUT_FILE = path.join(__dirname, '../public/blog/tags.json');

function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = content.match(frontmatterRegex);

  if (!match) return null;

  const frontmatterText = match[1];
  const data = {};

  const lines = frontmatterText.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }

      if (key === 'tags') {
        value = value.split(',').map(tag => tag.trim());
      }

      data[key] = value;
    }
  }

  return data;
}

function generateTags() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('Posts directory not found:', POSTS_DIR);
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
  const tagStats = new Map();

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter || !frontmatter.tags) {
      continue;
    }

    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

    for (const tag of tags) {
      const count = tagStats.get(tag) || 0;
      tagStats.set(tag, count + 1);
    }
  }

  const tags = Array.from(tagStats.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const output = {
    tags,
    total: tags.length,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Generated ${OUTPUT_FILE} with ${tags.length} unique tags`);
  console.log('Top 10 tags:');
  tags.slice(0, 10).forEach((tag, index) => {
    console.log(`  ${index + 1}. ${tag.name} (${tag.count} posts)`);
  });
}

generateTags();
