#!/usr/bin/env node
/**
 * Generate sitemap.xml for SEO
 * Scans all routes, blog posts, and docs to create a comprehensive sitemap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = 'https://sakurain.net';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/blog', changefreq: 'daily', priority: 0.9 },
  { path: '/docs', changefreq: 'weekly', priority: 0.8 },
  { path: '/friends', changefreq: 'monthly', priority: 0.5 },
  { path: '/friends-circle', changefreq: 'daily', priority: 0.6 },
  { path: '/about', changefreq: 'monthly', priority: 0.7 },
  { path: '/notes', changefreq: 'daily', priority: 0.6 },
  { path: '/earth-online', changefreq: 'weekly', priority: 0.5 },
  { path: '/studio', changefreq: 'weekly', priority: 0.7 },
];

// Read blog posts from archives
function getBlogPosts() {
  const posts = [];
  const archivesDir = path.join(__dirname, '../public/blog/archives');

  if (!fs.existsSync(archivesDir)) {
    console.warn('Archives directory not found:', archivesDir);
    return posts;
  }

  const files = fs.readdirSync(archivesDir).filter(
    file => file.startsWith('index-') && file.endsWith('.json')
  );

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(archivesDir, file), 'utf-8');
      const monthPosts = JSON.parse(content);
      if (Array.isArray(monthPosts)) {
        posts.push(...monthPosts);
      }
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error.message);
    }
  }

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Read docs structure
function getDocPages() {
  const pages = [];
  const docsPath = path.join(__dirname, '../public/docs/docs.json');

  if (!fs.existsSync(docsPath)) {
    console.warn('Docs config not found, scanning directories...');
    return scanDocsDirectories();
  }

  try {
    const content = fs.readFileSync(docsPath, 'utf-8');
    const docs = JSON.parse(content);

    for (const category of docs.categories || []) {
      pages.push({
        path: `/docs/${category.id}`,
        priority: 0.7,
        changefreq: 'weekly',
      });

      for (const item of category.items || []) {
        pages.push({
          path: `/docs/${category.id}/${item.id}`,
          priority: 0.6,
          changefreq: 'weekly',
        });

        for (const chapter of item.chapters || []) {
          pages.push({
            path: `/docs/${category.id}/${item.id}/${chapter.id}`,
            priority: 0.5,
            changefreq: 'monthly',
          });
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse docs.json:', error.message);
    return scanDocsDirectories();
  }

  return pages;
}

// Fallback: scan docs directories directly
function scanDocsDirectories() {
  const pages = [];
  const docsDir = path.join(__dirname, '../public/docs');

  if (!fs.existsSync(docsDir)) {
    return pages;
  }

  const categories = fs.readdirSync(docsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'));

  for (const category of categories) {
    const categoryPath = path.join(docsDir, category.name);
    pages.push({
      path: `/docs/${category.name}`,
      priority: 0.7,
      changefreq: 'weekly',
    });

    const items = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'));

    for (const item of items) {
      pages.push({
        path: `/docs/${category.name}/${item.name}`,
        priority: 0.6,
        changefreq: 'weekly',
      });

      const itemPath = path.join(categoryPath, item.name);
      const chapters = fs.readdirSync(itemPath)
        .filter(file => file.endsWith('.md') && file !== 'index.md');

      for (const chapter of chapters) {
        const chapterId = chapter.replace('.md', '');
        pages.push({
          path: `/docs/${category.name}/${item.name}/${chapterId}`,
          priority: 0.5,
          changefreq: 'monthly',
        });
      }
    }
  }

  return pages;
}

// Escape XML special characters
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Format date to ISO 8601
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Generate sitemap XML
function generateSitemap() {
  console.log('Generating sitemap.xml...');

  const urls = [];
  const today = formatDate(new Date());

  // Add static pages
  for (const page of STATIC_PAGES) {
    urls.push({
      loc: `${SITE_URL}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  }

  // Add blog posts
  const blogPosts = getBlogPosts();
  console.log(`Found ${blogPosts.length} blog posts`);

  for (const post of blogPosts) {
    urls.push({
      loc: `${SITE_URL}/blog/${post.slug}`,
      lastmod: formatDate(post.date),
      changefreq: 'monthly',
      priority: 0.8,
    });
  }

  // Add doc pages
  const docPages = getDocPages();
  console.log(`Found ${docPages.length} doc pages`);

  for (const page of docPages) {
    urls.push({
      loc: `${SITE_URL}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  }

  // Generate XML
  const urlset = urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>
`;

  // Write sitemap
  fs.writeFileSync(OUTPUT_PATH, sitemap);
  console.log(`✓ Generated sitemap.xml with ${urls.length} URLs`);
  console.log(`  Output: ${OUTPUT_PATH}`);

  return urls.length;
}

// Run
generateSitemap();
