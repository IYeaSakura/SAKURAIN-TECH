#!/usr/bin/env node
/**
 * Submit sitemap URLs to search engines.
 * Primary: Bing (Bing Webmaster URL Submission API)
 * Also supports: Baidu (Baidu ordinary push API)
 * And: Google Search Console sitemap submission (service-account OAuth2)
 *
 * Environment variables:
 * - BING_API_KEY: Bing Webmaster API key (required for Bing)
 * - BAIDU_PUSH_TOKEN: Baidu push token (required for Baidu)
 * - GOOGLE_SERVICE_ACCOUNT_JSON: Google service account JSON (required for Google)
 * - SEARCH_ENGINE_SUBMIT: Comma-separated list of engines (default: bing,baidu)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://sakurain.net';
const GSC_SITE_URL = SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`;
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const BAIDU_BATCH_SIZE = 2000;
const BING_BATCH_SIZE = 500;

/**
 * Locate the generated sitemap.xml.
 * Static export writes it to dist/sitemap.xml; legacy builds may keep it in
 * .next/server/app/sitemap.xml.body or public/sitemap.xml.
 */
function resolveSitemapPath() {
  const candidates = [
    path.join(__dirname, '../dist/sitemap.xml'),
    path.join(__dirname, '../.next/server/app/sitemap.xml.body'),
    path.join(__dirname, '../public/sitemap.xml'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

const BAIDU_API = 'data.zz.baidu.com';
const BAIDU_PATH = '/urls';

function parseSitemap(sitemapPath) {
  if (!fs.existsSync(sitemapPath)) {
    console.error('✘ Sitemap not found:', sitemapPath);
    console.error('   Run "npm run build" first to generate sitemap.xml.');
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

function chunk(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

function httpsRequest(method, url, body, headers = {}, timeout = 30000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const protocol = isHttps ? https : http;
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const requestHeaders = {
      Host: parsed.hostname,
      ...headers,
    };

    if (payload) {
      requestHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = protocol.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers: requestHeaders,
        timeout,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsedData;
          try {
            parsedData = data ? JSON.parse(data) : null;
          } catch {
            parsedData = data;
          }
          resolve({ statusCode: res.statusCode, data: parsedData });
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

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function submitToBaidu(urls, token) {
  if (!token) {
    console.log('  ⚠ BAIDU_PUSH_TOKEN not set, skipping Baidu submission');
    return { success: false, reason: 'no_token' };
  }

  console.log(`  Submitting ${urls.length} URLs to Baidu...`);

  const batches = chunk(urls, BAIDU_BATCH_SIZE);
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
          path: `${BAIDU_PATH}?site=${encodeURIComponent(SITE_URL)}&token=${encodeURIComponent(token)}`,
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

/**
 * Build a signed JWT from a Google service account for OAuth2 token exchange.
 */
function createServiceAccountJwt(serviceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaims = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signingInput = `${encodedHeader}.${encodedClaims}`;

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(signingInput)
    .sign(serviceAccount.private_key, 'base64url');

  return `${signingInput}.${signature}`;
}

async function getGoogleAccessToken(serviceAccount) {
  const jwt = createServiceAccountJwt(serviceAccount);
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(jwt)}`;

  const result = await httpsRequest(
    'POST',
    'https://oauth2.googleapis.com/token',
    body,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    30000
  );

  if (result.error) {
    throw new Error(`Token request failed: ${result.error}`);
  }

  if (result.statusCode !== 200) {
    const detail = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
    throw new Error(`Token request failed: HTTP ${result.statusCode} - ${detail}`);
  }

  if (!result.data.access_token) {
    throw new Error('No access_token in Google token response');
  }

  return result.data.access_token;
}

async function submitToGoogle() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.log('  ⚠ GOOGLE_SERVICE_ACCOUNT_JSON not set, skipping Google submission');
    console.log('  You can submit the sitemap manually at: https://search.google.com/search-console');
    return { success: false, reason: 'no_token' };
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    console.log('  ✗ GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
    return { success: false, reason: 'invalid_json' };
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    console.log('  ✗ GOOGLE_SERVICE_ACCOUNT_JSON missing client_email or private_key');
    return { success: false, reason: 'invalid_service_account' };
  }

  console.log('  Submitting sitemap to Google Search Console...');

  try {
    const accessToken = await getGoogleAccessToken(serviceAccount);
    const siteUrl = encodeURIComponent(GSC_SITE_URL);
    const sitemapUrl = encodeURIComponent(SITEMAP_URL);
    const submitUrl = `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/sitemaps/${sitemapUrl}`;

    const result = await httpsRequest(
      'PUT',
      submitUrl,
      null,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      30000
    );

    if (result.error) {
      throw new Error(result.error);
    }

    if (result.statusCode >= 200 && result.statusCode < 300) {
      console.log(`    ✓ Sitemap submitted: ${SITEMAP_URL}`);
      return { success: true, sitemap: SITEMAP_URL };
    }

    const detail = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
    throw new Error(`HTTP ${result.statusCode} - ${detail}`);
  } catch (error) {
    console.log(`    ✗ ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function submitToBing(urls) {
  const apiKey = process.env.BING_API_KEY;
  if (!apiKey) {
    console.log('  ⚠ BING_API_KEY not set, skipping Bing submission');
    console.log('  Get an API key at: https://www.bing.com/webmasters');
    return { success: false, reason: 'no_token' };
  }

  console.log(`  Submitting ${urls.length} URLs to Bing...`);

  const batches = chunk(urls, BING_BATCH_SIZE);
  const results = {
    success: 0,
    errors: [],
  };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const submitUrl = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${encodeURIComponent(apiKey)}`;

    const result = await httpsRequest(
      'POST',
      submitUrl,
      { siteUrl: SITE_URL, urlList: batch },
      {
        'Content-Type': 'application/json; charset=utf-8',
      },
      30000
    );

    if (result.error) {
      results.errors.push(result.error);
      console.log(`    Batch ${i + 1}/${batches.length}: ✗ ${result.error}`);
    } else if (result.statusCode >= 200 && result.statusCode < 300) {
      results.success += batch.length;
      console.log(`    Batch ${i + 1}/${batches.length}: ✓ ${batch.length} URLs submitted`);
    } else {
      const detail = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
      results.errors.push(`HTTP ${result.statusCode}: ${detail}`);
      console.log(`    Batch ${i + 1}/${batches.length}: ✗ HTTP ${result.statusCode} - ${detail}`);
    }
  }

  return {
    success: results.errors.length === 0,
    submitted: results.success,
    errors: results.errors,
  };
}

const SEARCH_ENGINES = {
  baidu: {
    name: 'Baidu',
    submit: (urls) => submitToBaidu(urls, process.env.BAIDU_PUSH_TOKEN),
  },
  google: {
    name: 'Google',
    submit: () => submitToGoogle(),
  },
  bing: {
    name: 'Bing',
    submit: submitToBing,
  },
};

async function submitToSearchEngines() {
  const enabledEngines = (process.env.SEARCH_ENGINE_SUBMIT || 'bing,baidu')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => SEARCH_ENGINES[e]);

  if (enabledEngines.length === 0) {
    console.log('No search engines configured for submission');
    console.log('Set SEARCH_ENGINE_SUBMIT env var (e.g., "bing,baidu,google")');
    return;
  }

  const sitemapPath = resolveSitemapPath();

  console.log('Submitting sitemap to search engines...');
  console.log(`  Site: ${SITE_URL}`);
  console.log(`  Engines: ${enabledEngines.join(', ')}`);
  console.log(`  Sitemap: ${sitemapPath}`);
  console.log('');

  const urls = parseSitemap(sitemapPath);

  if (urls.length === 0) {
    console.error('✘ No URLs found in sitemap');
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
      ? result.sitemap
        ? `sitemap submitted (${result.sitemap})`
        : `${result.success || result.submitted || 0} URLs submitted`
      : result.reason || result.error || 'Failed';
    console.log(`  ${status} ${config.name}: ${detail}`);
  }
}

submitToSearchEngines().catch((error) => {
  console.error('✘ Unexpected error during sitemap submission:', error.message);
  process.exit(1);
});
