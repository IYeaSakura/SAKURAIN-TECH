#!/usr/bin/env node
/**
 * 生成博客订阅 Feed (RSS 2.0 / Atom / JSON Feed)
 * 构建时执行，输出到 public 目录
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 路径配置
const ARCHIVES_DIR = path.join(__dirname, '../public/blog/archives');
const OUTPUT_DIR = path.join(__dirname, '../public');
const SITE_DATA_PATH = path.join(__dirname, '../public/data/site-data.json');

// Feed 配置
const FEED_CONFIG = {
  title: 'SAKURAIN 博客',
  description: '专注博弈论算法工程化与大规模数据分析',
  siteUrl: 'https://sakurain.tech',
  feedUrl: 'https://sakurain.tech/feed.xml',
  atomUrl: 'https://sakurain.tech/atom.xml',
  jsonFeedUrl: 'https://sakurain.tech/feed.json',
  author: {
    name: 'SAKURAIN',
    email: 'Yae_SakuRain@outlook.com'
  },
  language: 'zh-CN',
  copyright: '© 2026 SAKURAIN 技术工作室'
};

// 读取站点数据
function loadSiteData() {
  try {
    const data = fs.readFileSync(SITE_DATA_PATH, 'utf-8');
    const siteData = JSON.parse(data);
    return {
      title: siteData.meta?.title || FEED_CONFIG.title,
      description: siteData.meta?.description || FEED_CONFIG.description,
      author: siteData.contact?.email || FEED_CONFIG.author.email
    };
  } catch (error) {
    console.warn('Failed to load site data, using defaults:', error.message);
    return FEED_CONFIG;
  }
}

// 读取所有博客文章
function loadAllPosts() {
  const posts = [];
  
  if (!fs.existsSync(ARCHIVES_DIR)) {
    console.warn('Archives directory not found:', ARCHIVES_DIR);
    return posts;
  }

  const files = fs.readdirSync(ARCHIVES_DIR).filter(file => file.startsWith('index-') && file.endsWith('.json'));
  
  for (const file of files) {
    const filePath = path.join(ARCHIVES_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const monthPosts = JSON.parse(content);
      if (Array.isArray(monthPosts)) {
        posts.push(...monthPosts);
      }
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error.message);
    }
  }

  // 按日期降序排序
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 生成 RSS 2.0 Feed
function generateRSS(posts, siteInfo) {
  const lastBuildDate = posts.length > 0 
    ? new Date(posts[0].date).toUTCString() 
    : new Date().toUTCString();

  const items = posts.map(post => {
    const pubDate = new Date(post.date).toUTCString();
    const link = `${FEED_CONFIG.siteUrl}/blog/${post.slug}`;
    const categories = post.tags?.map(tag => `<category>${escapeXml(tag)}</category>`).join('') || '';
    
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${siteInfo.author} (${post.author || 'SAKURAIN'})</author>
      <description>${escapeXml(post.description || '')}</description>
      ${categories}
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteInfo.title)}</title>
    <link>${FEED_CONFIG.siteUrl}</link>
    <description>${escapeXml(siteInfo.description)}</description>
    <language>${FEED_CONFIG.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <copyright>${FEED_CONFIG.copyright}</copyright>
    <generator>SAKURAIN Feed Generator</generator>
    <atom:link href="${FEED_CONFIG.feedUrl}" rel="self" type="application/rss+xml"/>
    <atom:link href="${FEED_CONFIG.atomUrl}" rel="alternate" type="application/atom+xml"/>
    ${items}
  </channel>
</rss>`;
}

// 生成 Atom Feed
function generateAtom(posts, siteInfo) {
  const updated = posts.length > 0 
    ? new Date(posts[0].date).toISOString() 
    : new Date().toISOString();

  const entries = posts.map(post => {
    const published = new Date(post.date).toISOString();
    const link = `${FEED_CONFIG.siteUrl}/blog/${post.slug}`;
    const categories = post.tags?.map(tag => `
    <category term="${escapeXml(tag)}"/>`).join('') || '';
    
    return `
  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${link}"/>
    <id>${link}</id>
    <published>${published}</published>
    <updated>${published}</updated>
    <author>
      <name>${escapeXml(post.author || 'SAKURAIN')}</name>
      <email>${siteInfo.author}</email>
    </author>
    <summary>${escapeXml(post.description || '')}</summary>${categories}
  </entry>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteInfo.title)}</title>
  <subtitle>${escapeXml(siteInfo.description)}</subtitle>
  <link href="${FEED_CONFIG.atomUrl}" rel="self" type="application/atom+xml"/>
  <link href="${FEED_CONFIG.siteUrl}" rel="alternate" type="text/html"/>
  <updated>${updated}</updated>
  <id>${FEED_CONFIG.siteUrl}/</id>
  <author>
    <name>SAKURAIN</name>
    <email>${siteInfo.author}</email>
  </author>
  <rights>${FEED_CONFIG.copyright}</rights>${entries}
</feed>`;
}

// 生成 JSON Feed
function generateJSONFeed(posts, siteInfo) {
  const items = posts.map(post => {
    const link = `${FEED_CONFIG.siteUrl}/blog/${post.slug}`;
    return {
      id: link,
      url: link,
      title: post.title,
      content_text: post.description || '',
      date_published: new Date(post.date).toISOString(),
      author: {
        name: post.author || 'SAKURAIN'
      },
      tags: post.tags || []
    };
  });

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: siteInfo.title,
    description: siteInfo.description,
    home_page_url: FEED_CONFIG.siteUrl,
    feed_url: FEED_CONFIG.jsonFeedUrl,
    language: FEED_CONFIG.language,
    authors: [
      {
        name: 'SAKURAIN',
        url: FEED_CONFIG.siteUrl
      }
    ],
    items: items
  };

  return JSON.stringify(feed, null, 2);
}

// XML 转义
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 主函数
function generateFeeds() {
  console.log('Generating blog feeds...');
  
  const siteInfo = loadSiteData();
  const posts = loadAllPosts();
  
  if (posts.length === 0) {
    console.warn('No posts found, skipping feed generation');
    return;
  }
  
  console.log(`Found ${posts.length} posts`);
  
  // 生成 RSS 2.0
  const rss = generateRSS(posts, siteInfo);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'feed.xml'), rss);
  console.log('✓ Generated feed.xml (RSS 2.0)');
  
  // 生成 Atom
  const atom = generateAtom(posts, siteInfo);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'atom.xml'), atom);
  console.log('✓ Generated atom.xml (Atom)');
  
  // 生成 JSON Feed
  const jsonFeed = generateJSONFeed(posts, siteInfo);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'feed.json'), jsonFeed);
  console.log('✓ Generated feed.json (JSON Feed)');
  
  console.log('Feed generation completed!');
  console.log('  - RSS 2.0: /feed.xml');
  console.log('  - Atom: /atom.xml');
  console.log('  - JSON Feed: /feed.json');
}

generateFeeds();
