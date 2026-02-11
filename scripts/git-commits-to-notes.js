import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_DIR = path.join(__dirname, '..', 'public', 'notes', 'posts');

function getGitCommits() {
  try {
    const output = execSync('git log --pretty=format:"COMMIT_START%n%H%n%ai%n%s%n%b%nCOMMIT_END" --reverse', {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..')
    });
    
    const lines = output.trim().split('\n');
    const commits = [];
    let currentCommit = null;
    
    for (const line of lines) {
      if (line === 'COMMIT_START') {
        currentCommit = { hash: '', date: '', subject: '', body: '' };
      } else if (line === 'COMMIT_END') {
        if (currentCommit) {
          commits.push(currentCommit);
        }
        currentCommit = null;
      } else if (currentCommit) {
        if (!currentCommit.hash) {
          currentCommit.hash = line;
        } else if (!currentCommit.date) {
          currentCommit.date = line;
        } else if (!currentCommit.subject) {
          currentCommit.subject = line;
        } else {
          if (currentCommit.body) {
            currentCommit.body += '\n' + line;
          } else {
            currentCommit.body = line;
          }
        }
      }
    }
    
    return commits;
  } catch (error) {
    console.error('Error getting git commits:', error.message);
    return [];
  }
}

function formatDateToFilename(dateStr) {
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}.md`;
}

function generateMarkdown(commit) {
  const title = commit.subject || '无标题';
  const date = commit.date;
  const mood = 'neutral';
  const content = commit.body ? commit.body.trim() : commit.subject;
  
  return `---
title: "${title}"
date: "${date}"
mood: "${mood}"
---

${content}`;
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  ensureDirectoryExists(NOTES_DIR);
  
  const commits = getGitCommits();
  console.log(`Found ${commits.length} commits`);
  
  let created = 0;
  let skipped = 0;
  let invalid = 0;
  
  commits.forEach((commit, index) => {
    const filename = formatDateToFilename(commit.date);
    
    if (!filename) {
      console.log(`Skipping invalid date: ${commit.date} - ${commit.subject}`);
      invalid++;
      return;
    }
    
    const filepath = path.join(NOTES_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      skipped++;
      return;
    }
    
    const markdown = generateMarkdown(commit);
    fs.writeFileSync(filepath, markdown, 'utf-8');
    console.log(`Created: ${filename} - ${commit.subject}`);
    created++;
  });
  
  console.log(`\nDone! Created ${created} files, skipped ${skipped} existing files, ${invalid} invalid commits.`);
}

main();
