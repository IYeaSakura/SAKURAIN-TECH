import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../public/blog/posts');
const OUTPUT_DIR = path.join(__dirname, '../public/blog');
const ARCHIVES_DIR = path.join(__dirname, '../public/blog/archives');

function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = content.match(frontmatterRegex);

  if (!match) return null;

  const frontmatterText = match[1];
  const bodyContent = content.replace(frontmatterRegex, '').trim();
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

  return { frontmatter: data, content: bodyContent };
}

function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateArchive() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('Posts directory not found:', POSTS_DIR);
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(ARCHIVES_DIR)) {
    fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
  }

  const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
  const archive = {};
  const postsByDate = {};

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(content);

    if (!parsed || !parsed.frontmatter || !parsed.frontmatter.date) {
      console.warn(`Skipping ${file}: no frontmatter or date found`);
      continue;
    }

    const frontmatter = parsed.frontmatter;
    const date = new Date(frontmatter.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}-${month}`;
    const dateKey = formatDateKey(frontmatter.date);

    if (!archive[yearMonth]) {
      archive[yearMonth] = [];
    }

    if (!postsByDate[dateKey]) {
      postsByDate[dateKey] = 0;
    }
    postsByDate[dateKey]++;

    const slug = file.replace('.md', '');

    archive[yearMonth].push({
      slug,
      title: frontmatter.title,
      description: frontmatter.description,
      date: frontmatter.date,
      author: frontmatter.author,
      tags: frontmatter.tags || [],
      cover: frontmatter.cover,
      featured: frontmatter.featured === true || frontmatter.featured === 'true',
      content: parsed.content
    });
  }

  const allPosts = Object.values(archive).flat();
  const sortedAllPosts = allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  const featuredPosts = sortedAllPosts.filter(post => post.featured);

  for (const [yearMonth, posts] of Object.entries(archive)) {
    const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const outputPath = path.join(ARCHIVES_DIR, `index-${yearMonth}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(sortedPosts, null, 2));
    console.log(`Generated ${outputPath} with ${sortedPosts.length} posts`);
  }

  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify({ posts: featuredPosts }, null, 2));
  console.log(`Generated ${indexPath} with ${featuredPosts.length} featured posts`);

  const archiveList = Object.keys(archive).sort((a, b) => b.localeCompare(a));
  const archivePath = path.join(OUTPUT_DIR, 'archive.json');
  fs.writeFileSync(archivePath, JSON.stringify({ months: archiveList, postsByDate }, null, 2));
  console.log(`Generated ${archivePath} with ${archiveList.length} months`);

  console.log('Archive generation completed!');
}

generateArchive();
