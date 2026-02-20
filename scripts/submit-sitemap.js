#!/usr/bin/env node
/**
 * Submit sitemap URLs to search engines
 * Supports: Baidu, Google (planned), Bing (planned)
 * 
 * Environment variables:
 * - BAIDU_PUSH_TOKEN: Baidu push token (required for Baidu)
 * - SEARCH_ENGINE_SUBMIT: Comma-separated list of engines to submit (default: baidu)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://sakurain.net';
const SITEMAP_PATH = path.join(__dirname, '../public/sitemap.xml');
const BATCH_SIZE = 2000;

const BAIDU_API = 'data.zz.baidu.com';
const BAIDU_PATH = '/urls';

function parseSitemap(sitemapPath) {
  if (!fs.existsSync(sitemapPath)) {
    console.error('Sitemap not found:', sitemapPath);
    return [];
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const urls = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;

  while ((match = locRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

async function submitToBaidu(urls, token) {
  if (!token) {
    console.log('  ⚠ BAIDU_PUSH_TOKEN not set, skipping Baidu submission');
    return { success: false, reason: 'no_token' };
  }

  console.log(`  Submitting ${urls.length} URLs to Baidu...`);

  const batches = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }

  const results = {
    success: 0,
    remain: 0,
    notSameSite: [],
    notValid: [],
    errors: [],
  };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const body = batch.join('\n');

    const result = await new Promise((resolve) => {
      const req = http.request(
        {
          hostname: BAIDU_API,
          port: 80,
          path: `${BAIDU_PATH}?site=${SITE_URL}&token=${token}`,
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'curl/7.12.1',
          },
          timeout: 30000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({
                statusCode: res.statusCode,
                data: JSON.parse(data),
              });
            } catch {
              resolve({
                statusCode: res.statusCode,
                data: data,
              });
            }
          });
        }
      );

      req.on('error', (error) => {
        resolve({ error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'Timeout' });
      });

      req.write(body);
      req.end();
    });

    if (result.error) {
      results.errors.push(result.error);
      console.log(`    Batch ${i + 1}/${batches.length}: ✗ ${result.error}`);
    } else if (result.statusCode === 200) {
      results.success += result.data.success || 0;
      results.remain = result.data.remain || 0;
      if (result.data.not_same_site) {
        results.notSameSite.push(...result.data.not_same_site);
      }
      if (result.data.not_valid) {
        results.notValid.push(...result.data.not_valid);
      }
      console.log(`    Batch ${i + 1}/${batches.length}: ✓ ${result.data.success} URLs submitted, ${result.data.remain} remaining today`);
    } else {
      const errorDetail = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
      results.errors.push(`HTTP ${result.statusCode}: ${errorDetail}`);
      console.log(`    Batch ${i + 1}/${batches.length}: ✗ HTTP ${result.statusCode} - ${errorDetail}`);
    }
  }

  return {
    success: results.errors.length === 0,
    ...results,
  };
}

async function submitToGoogle(urls) {
  console.log('  ⚠ Google Search Console API requires OAuth2 service account');
  console.log('  Please submit sitemap manually at: https://search.google.com/search-console');
  return { success: false, reason: 'manual_required' };
}

async function submitToBing(urls) {
  const apiKey = process.env.BING_API_KEY;
  if (!apiKey) {
    console.log('  ⚠ BING_API_KEY not set, skipping Bing submission');
    console.log('  You can submit sitemap at: https://www.bing.com/webmasters');
    return { success: false, reason: 'no_token' };
  }

  console.log('  ⚠ Bing API submission not yet implemented');
  console.log('  Please submit sitemap manually at: https://www.bing.com/webmasters');
  return { success: false, reason: 'not_implemented' };
}

const SEARCH_ENGINES = {
  baidu: {
    name: 'Baidu',
    submit: (urls) => submitToBaidu(urls, process.env.BAIDU_PUSH_TOKEN),
  },
  google: {
    name: 'Google',
    submit: submitToGoogle,
  },
  bing: {
    name: 'Bing',
    submit: submitToBing,
  },
};

async function submitToSearchEngines() {
  const enabledEngines = (process.env.SEARCH_ENGINE_SUBMIT || 'baidu')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => SEARCH_ENGINES[e]);

  if (enabledEngines.length === 0) {
    console.log('No search engines configured for submission');
    console.log('Set SEARCH_ENGINE_SUBMIT env var (e.g., "baidu,google,bing")');
    return;
  }

  console.log('Submitting sitemap to search engines...');
  console.log(`  Site: ${SITE_URL}`);
  console.log(`  Engines: ${enabledEngines.join(', ')}`);
  console.log('');

  const urls = parseSitemap(SITEMAP_PATH);

  if (urls.length === 0) {
    console.error('No URLs found in sitemap');
    process.exit(1);
  }

  console.log(`Found ${urls.length} URLs in sitemap`);
  console.log('');

  const results = {};

  for (const engine of enabledEngines) {
    const config = SEARCH_ENGINES[engine];
    console.log(`[${config.name}]`);

    try {
      const result = await config.submit(urls);
      results[engine] = result;
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      results[engine] = { success: false, error: error.message };
    }

    console.log('');
  }

  console.log('Submission Summary:');
  for (const [engine, result] of Object.entries(results)) {
    const config = SEARCH_ENGINES[engine];
    const status = result.success ? '✓' : '✗';
    const detail = result.success
      ? `${result.success} URLs submitted`
      : result.reason || result.error || 'Failed';
    console.log(`  ${status} ${config.name}: ${detail}`);
  }
}

submitToSearchEngines();
