import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(process.cwd(), 'public/notes/posts');
const OUTPUT_DIR = path.join(process.cwd(), 'public/notes/archives');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function parseMarkdown(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return null;
  }

  const frontmatterText = match[1];
  const body = match[2].trim();

  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    
    if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = value.slice(1, -1).split(',').map(v => v.trim().replace(/"/g, ''));
    } else {
      frontmatter[key] = value.replace(/^"|"$/g, '');
    }
  }

  return {
    ...frontmatter,
    content: body
  };
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return {
    year,
    month,
    day,
    hours,
    minutes,
    yearMonth: `${year}-${month}`,
    fullDate: `${year}-${month}-${day}`,
    fullTime: `${hours}:${minutes}`
  };
}

async function generateNotesArchive() {
  try {
    if (!fs.existsSync(POSTS_DIR)) {
      console.log('Notes posts directory not found. Creating...');
      fs.mkdirSync(POSTS_DIR, { recursive: true });
      console.log(`Created ${POSTS_DIR}`);
      return;
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
    
    if (files.length === 0) {
      console.log('No note files found.');
      return;
    }

    const notes = [];
    const archive = {};

    for (const file of files) {
      const filePath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseMarkdown(content);

      if (!parsed || !parsed.date) {
        console.warn(`Skipping ${file}: missing date`);
        continue;
      }

      const formatted = formatDate(parsed.date);
      const note = {
        id: file.replace('.md', ''),
        slug: file.replace('.md', ''),
        title: parsed.title || '无标题',
        content: parsed.content,
        date: parsed.date,
        mood: parsed.mood || 'neutral',
        ...formatted
      };

      notes.push(note);

      const yearMonth = formatted.yearMonth;
      if (!archive[yearMonth]) {
        archive[yearMonth] = [];
      }
      archive[yearMonth].push(note);
    }

    const sortedNotes = notes.sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const yearMonth in archive) {
      const monthNotes = archive[yearMonth].sort((a, b) => new Date(b.date) - new Date(a.date));
      const outputPath = path.join(OUTPUT_DIR, `index-${yearMonth}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(monthNotes, null, 2));
      console.log(`Generated ${outputPath} with ${monthNotes.length} notes`);
    }

    const months = Object.keys(archive).sort((a, b) => new Date(b) - new Date(a));
    const archiveData = {
      months,
      total: notes.length,
      generatedAt: new Date().toISOString()
    };

    const archivePath = path.join(process.cwd(), 'public/notes', 'archive.json');
    fs.writeFileSync(archivePath, JSON.stringify(archiveData, null, 2));
    console.log(`Generated ${archivePath}`);

    console.log(`\nArchive generation completed!`);
    console.log(`Total notes: ${notes.length}`);
    console.log(`Total months: ${months.length}`);
  } catch (error) {
    console.error('Failed to generate notes archive:', error);
    process.exit(1);
  }
}

generateNotesArchive();
